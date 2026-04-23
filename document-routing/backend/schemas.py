from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from models import StatusType, ActionType


# ── 1. Document (문서) ───────────────────────────────────────

# 문서 업로드 응답
class DocumentResponse(BaseModel):
    id        : int
    file_name : str
    status    : StatusType
    created_at: datetime

    class Config:
        from_attributes = True  # SQLAlchemy 모델 → Pydantic 변환 허용


# 문서 상태 조회 응답
class DocumentStatusResponse(BaseModel):
    id        : int
    file_name : str
    status    : StatusType
    created_at: datetime

    class Config:
        from_attributes = True


# ── 2. AnalysisResult (AI 분석 결과) ────────────────────────

# 분석 결과 응답
class AnalysisResultResponse(BaseModel):
    id           : int
    document_id  : int
    document_type: Optional[str] = None   # 문서 유형
    summary      : Optional[str] = None   # 문서 요약
    keywords     : Optional[list] = None  # 키워드 배열
    reasoning    : Optional[str] = None   # AI 판단 근거
    created_at   : datetime
    departments  : Optional[List["DocumentDepartmentResponse"]] = None  # 추천 부서

    class Config:
        from_attributes = True


# ── 3. Department (부서) ─────────────────────────────────────

# 부서 응답
class DepartmentResponse(BaseModel):
    id           : int
    name         : str
    slack_channel: Optional[str] = None
    webhook_url  : Optional[str] = None

    class Config:
        from_attributes = True


# ── 4. DocumentDepartment (AI 추천 부서) ─────────────────────

# AI 추천 부서 응답
class DocumentDepartmentResponse(BaseModel):
    id             : int
    analysis_id    : int
    department_id  : int
    confidence     : Optional[float] = None
    is_selected    : bool
    approval_status: Optional[str] = None
    approved_by    : Optional[str] = None
    approved_at    : Optional[datetime] = None

    class Config:
        from_attributes = True


# ── 5. ApprovalHistory (승인 이력) ───────────────────────────

# 승인 요청 (Slack 버튼 또는 웹 UI)
class ApprovalRequest(BaseModel):
    action       : ActionType
    approved_by  : str
    department_id: Optional[int] = None   # 부서별 승인 시 필요


# 승인 응답
class ApprovalResponse(BaseModel):
    id           : int
    document_id  : int
    action       : ActionType
    approved_by  : str
    department_id: Optional[int] = None
    created_at   : datetime

    class Config:
        from_attributes = True


# ── 6. 전체 문서 상세 조회 (문서 + 분석결과 + 추천부서) ──────

class DocumentDetailResponse(BaseModel):
    id          : int
    file_name   : str
    status      : StatusType
    created_at  : datetime
    retry_count : int = 0
    analysis    : Optional[AnalysisResultResponse] = None  # 분석 결과 (departments 포함)

    class Config:
        from_attributes = True


class DepartmentUpdate(BaseModel):
    slack_channel: Optional[str] = None
    webhook_url  : Optional[str] = None

class DepartmentCreate(BaseModel):
    name: str
    slack_channel: Optional[str] = None
    webhook_url  : Optional[str] = None
