import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session, selectinload
from database import get_db
from models import Document, AnalysisResult, DocumentDepartment, Department, StatusType, ApprovalHistory, SystemSettings
from schemas import DocumentResponse, DocumentStatusResponse, DocumentDetailResponse, ApprovalResponse
from services.pdf import extract_text, ALLOWED_EXTENSIONS
from services.ai import analyze_document
from services.slack import send_slack_notification, send_approved_notification, send_human_rejected_notification, send_held_notification
from database import sessionLocal
from fastapi.responses import FileResponse
from schemas import ApprovalRequest
from routers.departments import verify_admin

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── 백그라운드 파이프라인 ─────────────────────────────────────
def process_document(document_id: int, file_path: str):
    db = sessionLocal()
    try:
        # 1. 상태 → ANALYZING
        document = db.query(Document).filter(Document.id == document_id).first()
        document.status = StatusType.ANALYZING
        db.commit()
        
        # 2. 텍스트 추출 (PDF/DOCX)
        text = extract_text(file_path)

        # 3. Claude AI 분석 (DB 부서 목록 동적 전달)
        department_names = [d.name for d in db.query(Department).all()]
        ai_result = analyze_document(text, department_names)

        # 4. 분석 결과 DB 저장
        analysis = AnalysisResult(
            document_id=document_id,
            document_type=ai_result.get("document_type"),
            summary=ai_result.get("summary"),
            keywords=ai_result.get("keywords"),
            reasoning=ai_result.get("reasoning"),
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        # 5. 추천 부서 DB 저장
        department_name = ai_result.get("department")
        confidence = ai_result.get("confidence", 0.0)

        department = db.query(Department).filter(
            Department.name == department_name
        ).first()

        if department:
            doc_dept = DocumentDepartment(
                analysis_id=analysis.id,
                department_id=department.id,
                confidence=confidence,
                is_selected=True
            )
            db.add(doc_dept)
            db.commit()


        # 6. 상태 → COMPLETED
        document.status = StatusType.COMPLETED
        db.commit()

        # 7. 신뢰도 임계값 체크 → 미달 시 관리자 채널로 전송
        settings = db.query(SystemSettings).first()
        threshold = settings.confidence_threshold if settings else 0.0

        if threshold > 0.0 and confidence < threshold:
            from services.slack import send_rejected_notification
            print(f" 신뢰도 {int(confidence*100)}% < 임계값 {int(threshold*100)}% → 관리자 채널로 전송")
            send_rejected_notification(document_id, document.file_name, "AI 자동 분류 (저신뢰도)", department_name, departments=department_names)
        else:
            webhook_url = department.webhook_url if department else None
            send_slack_notification(document_id, document.file_name, ai_result, webhook_url=webhook_url)

        print(f" 문서 {document_id} 분석 완료: {department_name} ({confidence})")

    except Exception as e:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = StatusType.FAILED
            db.commit()
        print(f" 문서 {document_id} 분석 실패: {str(e)}")
    finally:
        db.close()


# ── 1. 문서 업로드 ───────────────────────────────────────────
@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail=f"PDF, DOCX 파일만 업로드 가능합니다")

    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)

    document = Document(
        file_name=file.filename,
        file_path=file_path,
        status=StatusType.PENDING
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # 백그라운드에서 AI 분석 실행 (즉시 응답 반환)
    background_tasks.add_task(process_document, document.id, file_path)

    return document


# ── 2. 문서 목록 조회 (페이지네이션) ────────────────────────
@router.get("/", response_model=list[DocumentDetailResponse])
def get_documents(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * size
    return db.query(Document).options(
        selectinload(Document.analysis).selectinload(AnalysisResult.departments)
    ).order_by(Document.created_at.desc()).offset(offset).limit(size).all()


# ── 3. 문서 총 개수 조회 ─────────────────────────────────────
@router.get("/count")
def get_documents_count(db: Session = Depends(get_db)):
    return {"total": db.query(Document).count()}


# ── 3. 문서 상태 조회 ────────────────────────────────────────
@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    return document


# ── 4. 승인 이력 조회 ────────────────────────────────────────
@router.get("/{document_id}/history", response_model=list[ApprovalResponse])
def get_document_history(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    return db.query(ApprovalHistory).filter(
        ApprovalHistory.document_id == document_id
    ).order_by(ApprovalHistory.created_at.desc()).all()


# ── 5. 파일 다운로드 ──────────────────────────────────────────
@router.get("/{document_id}/file")
def download_file(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="파일이 존재하지 않습니다")
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type="application/pdf"
    )


# ── 6. 문서 상세 조회 (분석 결과 포함) ──────────────────────
@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    return document

# ── 7. 분석 재시도 ───────────────────────────────────────────
@router.post("/{document_id}/retry")
def retry_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    if document.status != StatusType.FAILED:
        raise HTTPException(status_code=400, detail="실패한 문서만 재시도할 수 있습니다")
    if document.retry_count >= 3:
        raise HTTPException(status_code=400, detail="최대 재시도 횟수(3회)를 초과했습니다")
    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(status_code=400, detail="원본 파일이 존재하지 않습니다")

    document.status = StatusType.PENDING
    document.retry_count += 1
    db.commit()

    background_tasks.add_task(process_document, document.id, document.file_path)
    return {"message": "재분석을 시작합니다"}


# ── 8. 문서 삭제 ─────────────────────────────────────────────
@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")

    # 파일 삭제
    if document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)

    db.delete(document)
    db.commit()
    return {"message": "문서가 삭제되었습니다"}


# ── 9. 문서 승인/반려/보류 ───────────────────────────────────

@router.post("/{document_id}/approve", response_model=ApprovalResponse)
def approve_document(
    document_id: int,
    data: ApprovalRequest,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    status_map = {
        "APPROVED": StatusType.APPROVED,
        "REJECTED": StatusType.REJECTED,
        "HELD":     StatusType.HELD,
    }
    document.status = status_map[data.action]
    db.commit()
    approval = ApprovalHistory(
        document_id=document_id,
        action=data.action,
        approved_by=data.approved_by,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    # Slack 알림
    analysis = db.query(AnalysisResult).filter(AnalysisResult.document_id == document_id).first()
    dept_name = ""
    dept = None
    if analysis:
        doc_dept = db.query(DocumentDepartment).filter(DocumentDepartment.analysis_id == analysis.id).first()
        if doc_dept:
            dept = db.query(Department).filter(Department.id == doc_dept.department_id).first()
            dept_name = dept.name if dept else ""

    try:
        if data.action == "APPROVED":
            webhook_url = dept.webhook_url if dept else None
            send_approved_notification(document_id, document.file_name, dept_name, data.approved_by, webhook_url=webhook_url)
        elif data.action == "REJECTED":
            send_human_rejected_notification(document_id, document.file_name, data.approved_by, dept_name)
        elif data.action == "HELD":
            send_held_notification(document_id, document.file_name, data.approved_by, analysis)
    except Exception as e:
        print(f" Slack 알림 전송 실패: {str(e)}")

    return approval
