import os
import json
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── 프롬프트 ────────────────────────────────────────────────
SYSTEM_PROMPT = """
당신은 기업 문서 분류 전문가입니다.
문서 내용을 분석하고 반드시 아래 JSON 형식으로만 응답하세요.
다른 설명이나 텍스트는 절대 포함하지 마세요.

{
    "document_type": "계약서 또는 보고서 또는 기획서 또는 품의서 또는 기타",
    "department": "법무팀 또는 재무팀 또는 인사팀 또는 경영기획팀",
    "summary": "문서 내용 3줄 요약",
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "confidence": 0.0에서 1.0 사이 숫자,
    "reasoning": "이 부서로 분류한 이유"
}
"""


# ── Claude API 호출 ──────────────────────────────────────────
def analyze_document(text: str) -> dict:
    """
    PDF 텍스트를 Claude API로 분석

    Args:
        text: PDF에서 추출한 텍스트

    Returns:
        분석 결과 딕셔너리
    """

    # 텍스트가 너무 길면 앞 3000자만 사용
    if len(text) > 3000:
        text = text[:3000] + "\n...(이하 생략)"

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"다음 문서를 분석해주세요:\n\n{text}"
                }
            ]
        )

        # 응답 텍스트 추출
        result_text = response.content[0].text

        # 마크다운 코드블록 제거 후 JSON 파싱
        if "```" in result_text:
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result = json.loads(result_text.strip())
        return result

    except json.JSONDecodeError:
        raise Exception("AI 응답을 JSON으로 파싱할 수 없습니다")

    except Exception as e:
        raise Exception(f"Claude API 호출 실패: {str(e)}")