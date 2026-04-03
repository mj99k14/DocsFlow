import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_PIN = os.getenv("ADMIN_PIN", "")


class PinRequest(BaseModel):
    pin: str


@router.post("/verify")
def verify_pin(data: PinRequest):
    if not ADMIN_PIN:
        raise HTTPException(status_code=500, detail="ADMIN_PIN이 설정되지 않았습니다")
    if data.pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="PIN이 올바르지 않습니다")
    return {"ok": True}
