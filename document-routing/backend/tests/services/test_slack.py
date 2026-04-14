import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import pytest
from unittest.mock import patch, MagicMock
from services.slack import send_slack_notification, send_approved_notification


SAMPLE_AI_RESULT = {
    "department": "법무팀",
    "document_type": "계약서",
    "summary": "테스트 요약",
    "keywords": ["계약", "법무"],
    "confidence": 0.95,
    "reasoning": "법무 관련 내용",
}

LEGAL_WEBHOOK = "https://hooks.slack.com/legal"
PLANNING_WEBHOOK = "https://hooks.slack.com/planning"


def _make_mock_post(status_code: int = 200, text: str = "ok") -> MagicMock:
    """requests.post mock 객체를 생성하는 헬퍼."""
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.text = text
    return mock_resp


def test_send_notification_uses_given_webhook_url():
    """전달받은 webhook_url로 POST 요청이 전송된다."""
    with patch("requests.post", return_value=_make_mock_post()) as mock_post:
        send_slack_notification(1, "test.pdf", SAMPLE_AI_RESULT, webhook_url=LEGAL_WEBHOOK)

    mock_post.assert_called_once()
    called_url = mock_post.call_args.args[0]
    assert called_url == LEGAL_WEBHOOK


def test_no_webhook_url_raises_exception():
    """webhook_url이 None이면 Exception이 발생한다."""
    with patch("requests.post", return_value=_make_mock_post()):
        with pytest.raises(Exception):
            send_slack_notification(1, "test.pdf", SAMPLE_AI_RESULT, webhook_url=None)


def test_slack_returns_true_on_success():
    """Slack POST 요청이 200으로 성공하면 True를 반환한다."""
    with patch("requests.post", return_value=_make_mock_post(200)):
        result = send_slack_notification(1, "test.pdf", SAMPLE_AI_RESULT, webhook_url=LEGAL_WEBHOOK)

    assert result is True


def test_slack_raises_on_non_200_response():
    """Slack POST 요청이 200이 아니면 Exception이 발생한다."""
    with patch("requests.post", return_value=_make_mock_post(500, "Internal Server Error")):
        with pytest.raises(Exception, match="Slack 전송 실패"):
            send_slack_notification(1, "test.pdf", SAMPLE_AI_RESULT, webhook_url=LEGAL_WEBHOOK)


def test_confidence_emoji_high():
    """신뢰도 0.9 이상이면 Slack 메시지 블록에 🟢 이모지가 포함된다."""
    ai_result = {**SAMPLE_AI_RESULT, "confidence": 0.95}

    with patch("requests.post", return_value=_make_mock_post()) as mock_post:
        send_slack_notification(1, "test.pdf", ai_result, webhook_url=LEGAL_WEBHOOK)

    sent_json = mock_post.call_args.kwargs["json"]
    blocks_text = str(sent_json)
    assert "🟢" in blocks_text


def test_send_approved_notification_success():
    """send_approved_notification이 주어진 webhook_url로 POST 요청을 전송한다."""
    with patch("requests.post", return_value=_make_mock_post()) as mock_post:
        send_approved_notification(1, "test.pdf", "법무팀", "관리자", webhook_url=LEGAL_WEBHOOK)

    mock_post.assert_called_once()
    called_url = mock_post.call_args.args[0]
    assert called_url == LEGAL_WEBHOOK


def test_send_approved_notification_no_url_raises():
    """send_approved_notification에 webhook_url이 없으면 Exception이 발생한다."""
    with pytest.raises(Exception, match="Slack 채널 또는 Webhook URL이 필요합니다"):
        send_approved_notification(1, "test.pdf", "법무팀", "관리자", webhook_url=None)
