import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import json
import pytest
from unittest.mock import patch, MagicMock
from services.ai import analyze_document


VALID_AI_RESPONSE = {
    "document_type": "계약서",
    "department": "법무팀",
    "summary": "테스트 요약",
    "keywords": ["계약", "법무"],
    "confidence": 0.95,
    "reasoning": "법무 관련 내용",
}


def _make_mock_response(text: str) -> MagicMock:
    """Claude API 응답 mock 객체를 생성하는 헬퍼."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock()]
    mock_response.content[0].text = text
    return mock_response


def test_analyze_document_returns_valid_dict():
    """정상 JSON 응답일 때 dict를 반환하고 필수 키 6개를 모두 포함하는지 확인한다."""
    mock_response = _make_mock_response(json.dumps(VALID_AI_RESPONSE))

    with patch("services.ai.client.messages.create", return_value=mock_response):
        result = analyze_document("이 문서는 계약서입니다.")

    assert isinstance(result, dict)
    for key in ("document_type", "department", "summary", "keywords", "confidence", "reasoning"):
        assert key in result


def test_analyze_document_strips_markdown_codeblock():
    """응답이 ```json ... ``` 마크다운 코드블록 형태여도 JSON 파싱에 성공한다."""
    payload = {
        "document_type": "보고서",
        "department": "경영기획팀",
        "summary": "마크다운 블록 테스트",
        "keywords": ["보고서"],
        "confidence": 0.8,
        "reasoning": "경영 관련 내용",
    }
    mock_response = _make_mock_response(f"```json\n{json.dumps(payload)}\n```")

    with patch("services.ai.client.messages.create", return_value=mock_response):
        result = analyze_document("분기 경영 보고서입니다.")

    assert result["document_type"] == "보고서"


def test_long_text_truncated_to_3000_chars():
    """5000자 텍스트는 API 호출 시 3000자로 잘리고 '...(이하 생략)'이 붙는지 확인한다."""
    long_text = "가" * 5000
    mock_response = _make_mock_response(json.dumps(VALID_AI_RESPONSE))

    with patch("services.ai.client.messages.create", return_value=mock_response) as mock_create:
        analyze_document(long_text)

    user_content = mock_create.call_args.kwargs["messages"][0]["content"]
    assert "가" * 3001 not in user_content
    assert "...(이하 생략)" in user_content


def test_short_text_not_truncated():
    """3000자 이하의 텍스트는 잘리지 않고 원문 그대로 API에 전달된다."""
    short_text = "짧은 문서 내용입니다." * 5
    mock_response = _make_mock_response(json.dumps(VALID_AI_RESPONSE))

    with patch("services.ai.client.messages.create", return_value=mock_response) as mock_create:
        analyze_document(short_text)

    user_content = mock_create.call_args.kwargs["messages"][0]["content"]
    assert short_text in user_content
    assert "...(이하 생략)" not in user_content


def test_json_decode_error_raises_exception():
    """AI 응답이 JSON 형식이 아닐 때 '파싱'이 포함된 Exception이 발생한다."""
    mock_response = _make_mock_response("이것은 JSON이 아닙니다")

    with patch("services.ai.client.messages.create", return_value=mock_response):
        with pytest.raises(Exception, match="파싱"):
            analyze_document("문서 내용")


def test_api_call_failure_raises_exception():
    """Claude API 호출 자체가 실패하면 'Claude API 호출 실패'가 포함된 Exception이 전파된다."""
    with patch("services.ai.client.messages.create", side_effect=Exception("네트워크 오류")):
        with pytest.raises(Exception, match="Claude API 호출 실패"):
            analyze_document("문서 내용")
