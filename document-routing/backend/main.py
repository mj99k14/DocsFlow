from fastapi import FastAPI
from database import engine
import models
from routers import documents
from routers import documents, slack

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(documents.router)
app.include_router(slack.router)


@app.get("/")
def root():
    return {"message": "문서 라우팅 시스템 가동 중"}