import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Department
from schemas import DepartmentResponse, DepartmentUpdate, DepartmentCreate
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/departments", tags=["departments"])

ADMIN_PIN = os.getenv("ADMIN_PIN", "")


def verify_admin(x_admin_pin: str = Header(None)):
    if not x_admin_pin or x_admin_pin != ADMIN_PIN:
        raise HTTPException(status_code=401, detail="관리자 PIN이 올바르지 않습니다")


@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.post("/", response_model=DepartmentResponse)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    dept = Department(name=data.name, slack_channel=data.slack_channel, webhook_url=data.webhook_url)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, data: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다")
    if data.slack_channel is not None:
        dept.slack_channel = data.slack_channel
    if data.webhook_url is not None:
        dept.webhook_url = data.webhook_url
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db), _=Depends(verify_admin)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다")
    db.delete(dept)
    db.commit()
    return {"message": "부서가 삭제되었습니다"}


