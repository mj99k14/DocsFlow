import os
import requests
from dotenv import load_dotenv

load_dotenv()


#부서별 wehook URL
WEBHOOK_URLS = {
    "법무팀": os.getenv("SLACK_WEBHOOK_LEGAL"),
    "재무팀": os.getenv("SLACK_WEBHOOK_FINANCE"),
    "인사팀": os.getenv("SLACK_WEBHOOK_HR"),
    "경영기획팀":os.getenv("SLACK_WEBHOOK_PLANNING"),
}


def send_slack_notification(document_id:int, file_name:str, ai_result:dict):
    """
    AI 분석 결과를 Slack으로 전송
    승인 / 반려 / 보류 버튼 포함
 
    Args:
        document_id: 문서 ID
        file_name:   파일 이름
        ai_result:   Claude AI 분석 결과 딕셔너리
    """
    department   = ai_result.get("department", "경영기획팀")
    doc_type     = ai_result.get("document_type", "기타")
    summary      = ai_result.get("summary", "요약 없음")
    confidence   = ai_result.get("confidence", 0.0)
    reasoning    = ai_result.get("reasoning", "")
    keywords     = ai_result.get("keywords", [])
 
    #키워드 문자열 반환
    keywords_str =", ".join(keywords) if keywords else "없음"

    #신뢰도 이미지
    if confidence >= 0.9:
        conf_emoji = "🟢"
    elif confidence >= 0.7:
        conf_emoji = "🟡"
    else:
        conf_emoji = "🔴"

    # Slack Block kit 메세지 구성
    message = {
        "blocks": [
            # 제목
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"📄 새 문서가 도착했습니다",
                    "emoji": True
                }
            },
            # 문서 정보
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*파일명*\n{file_name}"},
                    {"type": "mrkdwn", "text": f"*문서 유형*\n{doc_type}"},
                    {"type": "mrkdwn", "text": f"*추천 부서*\n{department}"},
                    {"type": "mrkdwn", "text": f"*신뢰도*\n{conf_emoji} {int(confidence * 100)}%"},
                ]
            },
            # 요약
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*📝 문서 요약*\n{summary}"
                }
            },
            # 키워드
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🔑 키워드*\n{keywords_str}"
                }
            },
            # 판단 근거
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🤖 AI 판단 근거*\n{reasoning}"
                }
            },
            # 구분선
            {"type": "divider"},
            # 승인/반려/보류 버튼
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": " 승인", "emoji": True},
                        "style": "primary",
                        "value": f"{document_id}",
                        "action_id": "approve_document"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": " 반려", "emoji": True},
                        "style": "danger",
                        "value": f"{document_id}",
                        "action_id": "reject_document"
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": " 보류", "emoji": True},
                        "value": f"{document_id}",
                        "action_id": "hold_document"
                    }
                ]
            }
        ]
    }

    #해당 부서 webhook URL 가져오기
    webhook_url = WEBHOOK_URLS.get(department)

    #부서 URL 없으면 기본 채널로
    if not webhook_url:
        webhook_url = WEBHOOK_URLS.get("경영기획팀")
    
    if not webhook_url:
        raise Exception("Slack Webhook URL이 설정되지 않습니다")
    
    #SLACK으로 전송
    response = requests.post(webhook_url, json=message)

    if response.status_code != 200:
        raise Exception(f"Slack 전송 실패: {response.status_code} {response.text}")
    print(f"Slack 알림 전송 완료 -> {department} ({file_name})")
    return True