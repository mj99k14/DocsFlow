import os
import csv
import io
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import SystemSettings, Document, StatusType, ActionType, ApprovalHistory
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_PIN = os.getenv("ADMIN_PIN", "")


def verify_admin(x_admin_pin: str = Header(None)):
    if not x_admin_pin or x_admin_pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="관리자 PIN이 올바르지 않습니다")


class PinRequest(BaseModel):
    pin: str


class SettingsUpdate(BaseModel):
    confidence_threshold: float


@router.post("/verify")
def verify_pin(data: PinRequest):
    if not ADMIN_PIN:
        raise HTTPException(status_code=500, detail="ADMIN_PIN이 설정되지 않았습니다")
    if data.pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="PIN이 올바르지 않습니다")
    return {"ok": True}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db), _=Depends(verify_admin)):
    settings = db.query(SystemSettings).first()
    return {"confidence_threshold": settings.confidence_threshold if settings else 0.0}


@router.patch("/settings")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    settings = db.query(SystemSettings).first()
    settings.confidence_threshold = data.confidence_threshold
    db.commit()
    return {"confidence_threshold": settings.confidence_threshold}


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(verify_admin)):
    total = db.query(Document).count()
    approved = db.query(Document).filter(Document.status == StatusType.APPROVED).count()
    rejected = db.query(Document).filter(Document.status == StatusType.REJECTED).count()
    held = db.query(Document).filter(Document.status == StatusType.HELD).count()
    failed = db.query(Document).filter(Document.status == StatusType.FAILED).count()
    pending = db.query(Document).filter(Document.status.in_([StatusType.PENDING, StatusType.ANALYZING, StatusType.COMPLETED])).count()

    processed = approved + rejected + held
    approval_rate = round(approved / processed * 100) if processed > 0 else 0

    return {
        "total": total,
        "approved": approved,
        "rejected": rejected,
        "held": held,
        "failed": failed,
        "pending": pending,
        "approval_rate": approval_rate,
    }


@router.get("/export/approvals")
def export_approvals(db: Session = Depends(get_db), _=Depends(verify_admin)):
    rows = (
        db.query(ApprovalHistory, Document)
        .join(Document, ApprovalHistory.document_id == Document.id)
        .order_by(ApprovalHistory.created_at.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["파일명", "액션", "처리자", "처리일시"])
    for approval, doc in rows:
        action_label = {"APPROVED": "승인", "REJECTED": "반려", "HELD": "보류"}.get(approval.action.value, approval.action.value)
        writer.writerow([
            doc.file_name,
            action_label,
            approval.approved_by,
            approval.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue().encode("utf-8-sig")]),  # utf-8-sig → 엑셀에서 한글 깨짐 방지
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=approval_history.csv"},
    )
