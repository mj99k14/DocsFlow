import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ── ENUM 타입 정의 ──────────────────────────────────────────
class StatusType(str, enum.Enum):
    PENDING    = "PENDING"      # 업로드 완료, 분석 대기
    ANALYZING  = "ANALYZING"    # AI 분석 중
    COMPLETED  = "COMPLETED"    # 분석 완료
    FAILED     = "FAILED"       # 분석 실패
    HELD = "HELD" #반려


class ActionType(str, enum.Enum):
    APPROVED = "APPROVED"   # 승인
    REJECTED = "REJECTED"   # 반려
    HELD = "HELD" #반려


# ── 1. documents (문서) ─────────────────────────────────────
class Document(Base):
    __tablename__ = "documents"

    id         = Column(Integer, primary_key=True, index=True)
    file_name  = Column(String(255), nullable=False)        # 파일 이름
    file_path  = Column(String(500), nullable=False)        # 저장 경로
    status     = Column(Enum(StatusType), default=StatusType.PENDING)  # 현재 상태
    created_at = Column(DateTime, default=datetime.utcnow)  # 업로드 시간

    # 관계
    analysis = relationship("AnalysisResult", back_populates="document", uselist=False)
    approvals = relationship("ApprovalHistory", back_populates="document")


# ── 2. analysis_results (AI 분석 결과) ──────────────────────
class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id            = Column(Integer, primary_key=True, index=True)
    document_id   = Column(Integer, ForeignKey("documents.id"), nullable=False)  # 문서 Id
    document_type = Column(String(50))   # 문서 유형 (계약서, 보고서 등)
    summary       = Column(Text)         # 문서 요약
    keywords      = Column(JSONB)        # 키워드 ["계약", "법무"]
    reasoning     = Column(Text)         # AI 판단 근거
    created_at    = Column(DateTime, default=datetime.utcnow)  # 분석 시간

    # 관계
    document    = relationship("Document", back_populates="analysis")
    departments = relationship("DocumentDepartment", back_populates="analysis")


# ── 3. departments (부서) ────────────────────────────────────
class Department(Base):
    __tablename__ = "departments"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)   # 부서 이름
    slack_channel = Column(String(100))                   # Slack 채널

    # 관계
    document_departments = relationship("DocumentDepartment", back_populates="department")


# ── 4. document_departments (AI 추천 부서) ───────────────────
class DocumentDepartment(Base):
    __tablename__ = "document_departments"

    id            = Column(Integer, primary_key=True, index=True)
    analysis_id   = Column(Integer, ForeignKey("analysis_results.id"), nullable=False)  # 분석 Id
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)        # 부서 Id
    confidence    = Column(Float)                        # AI 신뢰도 (0.0 ~ 1.0)
    is_selected   = Column(Boolean, default=False)       # 최종 선택 여부

    # 관계
    analysis   = relationship("AnalysisResult", back_populates="departments")
    department = relationship("Department", back_populates="document_departments")


# ── 5. approval_history (승인 이력) ──────────────────────────
class ApprovalHistory(Base):
    __tablename__ = "approval_history"

    id          = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)  # 문서 Id
    action      = Column(Enum(ActionType), nullable=False)   # 승인/반려
    approved_by = Column(String(100))                        # 승인자 (Slack 유저)
    created_at  = Column(DateTime, default=datetime.utcnow) # 승인 시간

    # 관계
    document = relationship("Document", back_populates="approvals")