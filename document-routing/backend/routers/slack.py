import json
from fastapi import APIRouter, Request, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Document, ApprovalHistory, StatusType, ActionType

router = APIRouter(
    prefix="/slack",
    tags=["slack"]
)


#  Slack Callback 처리 
@router.post("/callback")
async def slack_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Slack 버튼 클릭 시 호출되는 Callback API
    승인 / 반려 / 보류 처리
    """

    # Slack은 form-data로 payload 전송
    form_data = await request.form()
    payload_str = form_data.get("payload")

    if not payload_str:
        return JSONResponse(content={"error": "payload 없음"}, status_code=400)

    payload = json.loads(payload_str)

    # 액션 정보 추출
    actions = payload.get("actions", [])
    if not actions:
        return JSONResponse(content={"ok": True})

    action = actions[0]
    action_id    = action.get("action_id")   # approve_document / reject_document / hold_document
    document_id  = int(action.get("value"))  # 문서 ID
    user_name    = payload.get("user", {}).get("name", "unknown")  # Slack 유저명

    # action_id → ActionType 매핑
    action_map = {
        "approve_document": ActionType.APPROVED,
        "reject_document":  ActionType.REJECTED,
        "hold_document":    ActionType.HELD,
    }

    action_type = action_map.get(action_id)
    if not action_type:
        return JSONResponse(content={"error": "알 수 없는 액션"}, status_code=400)

    # 백그라운드에서 DB 업데이트
    background_tasks.add_task(
        process_approval,
        document_id,
        action_type,
        user_name,
        db
    )

    # Slack에 3초 안에 응답 (Slack 규칙!)
    return JSONResponse(content={"ok": True})


def process_approval(
    document_id: int,
    action_type: ActionType,
    user_name: str,
    db: Session
):
    """
    승인/반려/보류 처리 백그라운드 함수
    """
    try:
        # 문서 조회
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            print(f" 문서 {document_id} 없음")
            return

        # 상태 업데이트
        status_map = {
            ActionType.APPROVED: StatusType.COMPLETED,
            ActionType.REJECTED: StatusType.FAILED,
            ActionType.HELD:     StatusType.HELD,
        }
        document.status = status_map[action_type]
        db.commit()

        # 승인 이력 저장
        approval = ApprovalHistory(
            document_id=document_id,
            action=action_type,
            approved_by=user_name,
        )
        db.add(approval)
        db.commit()

        print(f" 문서 {document_id} → {action_type.value} ({user_name})")

    except Exception as e:
        print(f" 승인 처리 실패: {str(e)}")