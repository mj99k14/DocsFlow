import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models import Document, AnalysisResult, DocumentDepartment, Department, StatusType, ApprovalHistory
from schemas import DocumentResponse, DocumentStatusResponse, DocumentDetailResponse, ApprovalResponse
from services.pdf import extract_text_from_pdf
from services.ai import analyze_document
from services.slack import send_slack_notification
from database import sessionLocal

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
        
        # 2. PDF 텍스트 추출
        text = extract_text_from_pdf(file_path)

        # 3. Claude AI 분석
        ai_result = analyze_document(text)

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

        #7. Slack 알림 전송
        send_slack_notification(document_id,document.file_name,ai_result)

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
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다")

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


# ── 2. 문서 목록 조회 ────────────────────────────────────────
@router.get("/", response_model=list[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    return db.query(Document).order_by(Document.created_at.desc()).all()


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


# ── 5. 문서 상세 조회 (분석 결과 포함) ──────────────────────
@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_detail(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")
    return document

