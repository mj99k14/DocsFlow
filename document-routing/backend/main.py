import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from database import engine, sessionLocal
import models
from routers import documents, slack, departments, admin
from datetime import datetime, timedelta, timezone

models.Base.metadata.create_all(bind=engine) #models테이블이없으면 생성 있으면 pass


def cleanup_old_documents():
    """30일 이상 지난 APPROVED 문서 자동 삭제 (파일 + DB)"""
    db = sessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        old_docs = db.query(models.Document).filter(
            models.Document.status == models.StatusType.APPROVED,
            models.Document.created_at < cutoff,
        ).all()

        for doc in old_docs:
            # PDF 파일 삭제
            if doc.file_path and os.path.exists(doc.file_path):
                os.remove(doc.file_path)
            # DB 레코드 삭제 (연관 레코드 cascade)
            db.delete(doc)

        db.commit()
        if old_docs:
            print(f" 자동 삭제: {len(old_docs)}개 문서 정리 완료")
    except Exception as e:
        print(f" 자동 삭제 실패: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_old_documents, 'cron', hour=0, minute=0)  # 매일 자정
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://docs-flow-orcin.vercel.app", "https://docs-flow-git-main-mj99k14s-projects.vercel.app", "https://docs-flow-5lzrmgeig-mj99k14s-projects.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(slack.router)
app.include_router(departments.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"message": "문서 라우팅 시스템 가동 중"}
