from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "문서 라우팅 시스템 가동 중"}                 