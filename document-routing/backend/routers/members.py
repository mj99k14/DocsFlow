from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Member
from schemas import MemberCreate, MemberResponse
from routers.departments import verify_admin

router = APIRouter(prefix="/members", tags=["members"])


@router.get("/", response_model=list[MemberResponse])
def get_members(db: Session = Depends(get_db)):
    return db.query(Member).order_by(Member.department_id, Member.name).all()


@router.post("/", response_model=MemberResponse)
def create_member(data: MemberCreate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="이름을 입력해주세요")
    member = Member(name=data.name.strip(), department_id=data.department_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db), _=Depends(verify_admin)):
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="멤버를 찾을 수 없습니다")
    db.delete(member)
    db.commit()
    return {"message": "멤버가 삭제되었습니다"}
