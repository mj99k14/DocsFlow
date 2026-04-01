from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Department
from schemas import DepartmentResponse, DepartmentUpdate, DepartmentCreate

router = APIRouter(prefix="/departments", tags=["departments"])

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.post("/", response_model=DepartmentResponse)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db)):
    dept = Department(name=data.name, slack_channel=data.slack_channel)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, data: DepartmentUpdate, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="부서를 찾을 수 없습니다")
    if data.slack_channel is not None:
        dept.slack_channel = data.slack_channel
    db.commit()
    db.refresh(dept)
    return dept


