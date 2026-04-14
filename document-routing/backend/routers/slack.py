import json
from fastapi import APIRouter, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from database import sessionLocal
from models import Document, AnalysisResult, ApprovalHistory, StatusType, ActionType
from services.slack import send_rejected_notification, send_slack_notification, update_slack_message, send_held_notification, get_slack_channels

router = APIRouter(
    prefix="/slack",
    tags=["slack"]
)


# ── Slack 채널 목록 조회 ─────────────────────────────────────
@router.get("/channels")
def list_slack_channels():
    """워크스페이스의 Slack 채널 목록 반환"""
    return get_slack_channels()


# ── Slack Callback 처리 ──────────────────────────────────────
@router.post("/callback")
async def slack_callback(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Slack 버튼 클릭 시 호출되는 Callback API
    승인 / 반려 / 보류 / 재분류 처리
    """
    form_data = await request.form()
    payload_str = form_data.get("payload")

    if not payload_str:
        return JSONResponse(content={"error": "payload 없음"}, status_code=400)

    payload = json.loads(payload_str)

    actions = payload.get("actions", [])
    if not actions:
        return JSONResponse(content={"ok": True})

    action       = actions[0]
    action_id    = action.get("action_id")
    value        = action.get("value")
    user_name    = payload.get("user", {}).get("name", "unknown")
    response_url = payload.get("response_url", "")
    print(f" response_url: {response_url!r}")

    # 재분류 드롭다운 처리 (reroute_select)
    if action_id == "reroute_select":
        value = action.get("selected_option", {}).get("value", "")
        document_id, new_department = value.split("|")
        document_id = int(document_id)
        background_tasks.add_task(
            process_reroute,
            document_id,
            new_department,
            user_name,
            response_url,
        )
        return JSONResponse(content={"ok": True})

    # 승인/반려/보류 처리
    action_map = {
        "approve_document": ActionType.APPROVED,
        "reject_document":  ActionType.REJECTED,
        "hold_document":    ActionType.HELD,
    }

    action_type = action_map.get(action_id)
    if not action_type:
        return JSONResponse(content={"error": "알 수 없는 액션"}, status_code=400)

    document_id = int(value)

    background_tasks.add_task(
        process_approval,
        document_id,
        action_type,
        user_name,
        response_url,
    )

    # Slack 3초 규칙
    return JSONResponse(content={"ok": True})


def process_approval(document_id: int, action_type: ActionType, user_name: str, response_url: str = ""):
    """승인/반려/보류 처리"""
    db = sessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            print(f" 문서 {document_id} 없음")
            return

        # 상태 업데이트
        status_map = {
            ActionType.APPROVED: StatusType.APPROVED,
            ActionType.REJECTED: StatusType.REJECTED,
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

        # Slack 메시지 업데이트 (버튼 제거 + 결과 표시)
        if response_url:
            update_slack_message(response_url, action_type.value, user_name)

        # 반려 시 관리자 채널로 재분류 요청 (이미 재분류된 적 있으면 생략)
        if action_type == ActionType.REJECTED:
            already_rerouted = db.query(ApprovalHistory).filter(
                ApprovalHistory.document_id == document_id,
                ApprovalHistory.approved_by.like("%(재분류→%"),
            ).first()

            if not already_rerouted:
                analysis = db.query(AnalysisResult).filter(
                    AnalysisResult.document_id == document_id
                ).first()
                original_department = "미확인"

                from models import DocumentDepartment, Department
                doc_dept = db.query(DocumentDepartment).join(AnalysisResult).filter(
                    AnalysisResult.document_id == document_id
                ).first()

                if doc_dept:
                    dept = db.query(Department).filter(
                        Department.id == doc_dept.department_id
                    ).first()
                    original_department = dept.name if dept else "미확인"

                from models import Department as Dept
                dept_names = [d.name for d in db.query(Dept).all()]
                send_rejected_notification(
                    document_id,
                    document.file_name,
                    user_name,
                    original_department,
                    analysis,
                    departments=dept_names,
                )

        # 보류 시 관리자 채널 알림
        if action_type == ActionType.HELD:
            analysis = db.query(AnalysisResult).filter(
                AnalysisResult.document_id == document_id
            ).first()
            from models import Department as Dept
            dept_names = [d.name for d in db.query(Dept).all()]
            send_held_notification(
                document_id,
                document.file_name,
                user_name,
                analysis,
                departments=dept_names,
            )

    except Exception as e:
        print(f" 승인 처리 실패: {str(e)}")
    finally:
        db.close()


def process_reroute(document_id: int, new_department: str, user_name: str, response_url: str = ""):
    """재분류 처리 - 새로운 부서 채널로 재전송"""
    db = sessionLocal()
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return

        # 분석 결과 가져오기
        analysis = db.query(AnalysisResult).filter(
            AnalysisResult.document_id == document_id
        ).first()

        if not analysis:
            return

        # ai_result 재구성
        ai_result = {
            "department":    new_department,
            "document_type": analysis.document_type,
            "summary":       analysis.summary,
            "keywords":      analysis.keywords,
            "reasoning":     analysis.reasoning,
            "confidence":    0.0
        }

        # 상태 COMPLETED 유지 (AI 분석은 이미 완료됨, 부서만 변경)
        document.status = StatusType.COMPLETED
        db.commit()

        # 재분류 이력 저장
        approval = ApprovalHistory(
            document_id=document_id,
            action=ActionType.APPROVED,
            approved_by=f"{user_name}(재분류→{new_department})",
        )
        db.add(approval)
        db.commit()

        # 새 부서 채널로 재전송
        from models import Department
        dept = db.query(Department).filter(Department.name == new_department).first()
        channel = dept.slack_channel if dept else None
        webhook_url = dept.webhook_url if dept else None
        send_slack_notification(document_id, document.file_name, ai_result, channel=channel, webhook_url=webhook_url)

        print(f"문서 {document_id} 재분류 완료 → {new_department}")

        # Slack 메시지 업데이트 (버튼 제거 + 결과 표시)
        if response_url:
            update_slack_message(response_url, "APPROVED", f"{user_name}(재분류→{new_department})")

    except Exception as e:
        print(f" 재분류 처리 실패: {str(e)}")
    finally:
        db.close()

