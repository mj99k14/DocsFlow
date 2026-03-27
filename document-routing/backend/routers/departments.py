from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Department
from schemas import DepartmentResponse

router = APIRouter(prefix="/departments", tags=["departments"])

@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


