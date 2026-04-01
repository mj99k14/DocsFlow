import os
import requests
from dotenv import load_dotenv

load_dotenv()

# 부서별 Webhook URL
WEBHOOK_URLS = {
    "법무팀":    os.getenv("SLACK_WEBHOOK_LEGAL"),
    "재무팀":    os.getenv("SLACK_WEBHOOK_FINANCE"),
    "인사팀":    os.getenv("SLACK_WEBHOOK_HR"),
    "경영기획팀": os.getenv("SLACK_WEBHOOK_PLANNING"),
}

# 관리자 채널 Webhook URL
WEBHOOK_ADMIN = os.getenv("SLACK_WEBHOOK_REJECT")
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


def send_slack_notification(document_id: int, file_name: str, ai_result: dict):
    """
    AI 분석 결과를 Slack으로 전송
    승인 / 반려 / 보류 버튼 포함
    """
    department = ai_result.get("department", "경영기획팀")
    doc_type   = ai_result.get("document_type", "기타")
    summary    = ai_result.get("summary", "요약 없음")
    confidence = ai_result.get("confidence", 0.0)
    reasoning  = ai_result.get("reasoning", "")
    keywords   = ai_result.get("keywords", [])

    keywords_str = ", ".join(keywords) if keywords else "없음"

    if confidence >= 0.9:
        conf_emoji = "🟢"
    elif confidence >= 0.7:
        conf_emoji = "🟡"
    else:
        conf_emoji = "🔴"

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "📄 새 문서가 도착했습니다", "emoji": True}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*파일명*\n{file_name}"},
                    {"type": "mrkdwn", "text": f"*문서 유형*\n{doc_type}"},
                    {"type": "mrkdwn", "text": f"*추천 부서*\n{department}"},
                    {"type": "mrkdwn", "text": f"*신뢰도*\n{conf_emoji} {int(confidence * 100)}%"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*📝 문서 요약*\n{summary}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*🔑 키워드*\n{keywords_str}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*🤖 AI 판단 근거*\n{reasoning}"}
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📎 원본 파일*\n<{BASE_URL}/documents/{document_id}/file|{file_name} 다운로드>"
                }
            },
            {"type": "divider"},
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "✅ 승인", "emoji": True},
                        "style": "primary",
                        "value": f"{document_id}",
                        "action_id": "approve_document"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "❌ 반려", "emoji": True},
                        "style": "danger",
                        "value": f"{document_id}",
                        "action_id": "reject_document"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "⏸ 보류", "emoji": True},
                        "value": f"{document_id}",
                        "action_id": "hold_document"
                    }
                ]
            }
        ]
    }

    webhook_url = WEBHOOK_URLS.get(department)   
    if not webhook_url:
        webhook_url = WEBHOOK_URLS.get("경영기획팀")

    if not webhook_url:
        raise Exception("Slack Webhook URL이 설정되지 않았습니다")

    response = requests.post(webhook_url, json=message)
    if response.status_code != 200:
        raise Exception(f"Slack 전송 실패: {response.status_code} {response.text}")

    print(f" Slack 알림 전송 완료 → {department} ({file_name})")
    return True


def send_rejected_notification(document_id: int, file_name: str, rejected_by: str, original_department: str, analysis=None):
    """반려 시 관리자 채널로 재분류 요청 알림 전송"""
    if not WEBHOOK_ADMIN:
        print(" 관리자 Webhook URL이 설정되지 않았습니다")
        return False

    summary      = analysis.summary       if analysis else "요약 없음"
    keywords     = analysis.keywords      if analysis else []
    doc_type     = analysis.document_type if analysis else "미확인"
    keywords_str = ", ".join(keywords) if keywords else "없음"

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "⚠️ 문서 재분류가 필요합니다", "emoji": True}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*파일명*\n{file_name}"},
                    {"type": "mrkdwn", "text": f"*문서 유형*\n{doc_type}"},
                    {"type": "mrkdwn", "text": f"*AI 추천 부서*\n{original_department}"},
                    {"type": "mrkdwn", "text": f"*반려한 담당자*\n{rejected_by}"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*📝 문서 요약*\n{summary}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*🔑 키워드*\n{keywords_str}"}
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📎 원본 파일*\n<{BASE_URL}/documents/{document_id}/file|{file_name} 다운로드>"
                }
            },
            {"type": "divider"},
            # 재분류 버튼
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "⚖️ 법무팀", "emoji": True},
                        "value": f"{document_id}|법무팀",
                        "action_id": "reroute_legal"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "💰 재무팀", "emoji": True},
                        "value": f"{document_id}|재무팀",
                        "action_id": "reroute_finance"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "👥 인사팀", "emoji": True},
                        "value": f"{document_id}|인사팀",
                        "action_id": "reroute_hr"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "📊 경영기획팀", "emoji": True},
                        "value": f"{document_id}|경영기획팀",
                        "action_id": "reroute_planning"
                    },
                ]
            }
        ]
    }

    response = requests.post(WEBHOOK_ADMIN, json=message)
    if response.status_code != 200:
        raise Exception(f"관리자 알림 전송 실패: {response.status_code} {response.text}")

    print(f" 관리자 채널 재분류 요청 전송 완료 ({file_name})")
    return True


def update_slack_message(response_url: str, action_type: str, user_name: str):
    """
    버튼 클릭 후 Slack 메시지를 결과 메시지로 교체 (버튼 제거)
    """
    label_map = {
        "APPROVED": "✅ 승인",
        "REJECTED": "❌ 반려",
        "HELD":     "⏸ 보류",
    }
    label = label_map.get(action_type, action_type)

    message = {
        "replace_original": True,
        "blocks": [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{label} 처리되었습니다. (담당자: *{user_name}*)"
                }
            }
        ]
    }

    response = requests.post(response_url, json=message)
    if response.status_code != 200:
        print(f" Slack 메시지 업데이트 실패: {response.status_code} {response.text}")


def send_approved_notification(document_id: int, file_name: str, dept_name: str, approved_by: str):
    """웹에서 승인 시 해당 부서 채널로 승인 완료 알림 전송 (버튼 없음)"""
    webhook_url = WEBHOOK_URLS.get(dept_name) or WEBHOOK_URLS.get("경영기획팀")
    if not webhook_url:
        raise Exception("Slack Webhook URL이 설정되지 않았습니다")

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "✅ 문서가 승인되었습니다", "emoji": True}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*파일명*\n{file_name}"},
                    {"type": "mrkdwn", "text": f"*승인 부서*\n{dept_name}"},
                    {"type": "mrkdwn", "text": f"*승인자*\n{approved_by}"},
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📎 원본 파일*\n<{BASE_URL}/documents/{document_id}/file|{file_name} 다운로드>"
                }
            },
        ]
    }

    response = requests.post(webhook_url, json=message)
    if response.status_code != 200:
        raise Exception(f"Slack 전송 실패: {response.status_code} {response.text}")
    print(f" 승인 알림 전송 완료 → {dept_name} ({file_name})")


def send_held_notification(document_id: int, file_name: str, held_by: str, analysis=None):
    """보류 시 관리자 채널로 알림 전송"""
    if not WEBHOOK_ADMIN:
        print(" 관리자 Webhook URL이 설정되지 않았습니다")
        return False

    summary  = analysis.summary       if analysis else "요약 없음"
    keywords = analysis.keywords      if analysis else []
    doc_type = analysis.document_type if analysis else "미확인"
    keywords_str = ", ".join(keywords) if keywords else "없음"

    message = {
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "⏸ 문서가 보류되었습니다", "emoji": True}
            },
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*파일명*\n{file_name}"},
                    {"type": "mrkdwn", "text": f"*문서 유형*\n{doc_type}"},
                    {"type": "mrkdwn", "text": f"*문서 ID*\n{document_id}"},
                    {"type": "mrkdwn", "text": f"*보류한 담당자*\n{held_by}"},
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*📝 문서 요약*\n{summary}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*🔑 키워드*\n{keywords_str}"}
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📎 원본 파일*\n<{BASE_URL}/documents/{document_id}/file|{file_name} 다운로드>"
                }
            },
            {"type": "divider"},
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": "부서를 선택해 재분류해 주세요."}
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "⚖️ 법무팀", "emoji": True},
                        "value": f"{document_id}|법무팀",
                        "action_id": "reroute_legal"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "💰 재무팀", "emoji": True},
                        "value": f"{document_id}|재무팀",
                        "action_id": "reroute_finance"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "👥 인사팀", "emoji": True},
                        "value": f"{document_id}|인사팀",
                        "action_id": "reroute_hr"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "📊 경영기획팀", "emoji": True},
                        "value": f"{document_id}|경영기획팀",
                        "action_id": "reroute_planning"
                    },
                ]
            }
        ]
    }

    response = requests.post(WEBHOOK_ADMIN, json=message)
    if response.status_code != 200:
        print(f" 보류 알림 전송 실패: {response.status_code} {response.text}")
        return False

    print(f" 보류 알림 전송 완료 ({file_name})")
    return True