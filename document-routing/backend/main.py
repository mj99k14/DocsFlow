from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  
from database import engine
import models
from routers import documents, slack, departments

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS 설정 추가 ← 여기 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(slack.router)
app.include_router(departments.router)

@app.get("/")
def root():
    return {"message": "문서 라우팅 시스템 가동 중"}