from fastapi import FastAPI
from database import engine
import models
app = FastAPI()
models.Base.metadata.create_all(bind=engine)
@app.get("/")
def root():
    return {"message": "문서 라우팅 시스템 가동 중"}                 

