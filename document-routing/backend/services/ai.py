import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _build_system_prompt(department_names: list[str]) -> str:
    dept_list = "\n".join(f"- {name}" for name in department_names)
    return f"""당신은 기업 문서 분류 전문가 AI AGENT 입니다.
문서 내용을 꼼꼼히 분석하고 반드시 classify_document 툴을 사용하여 분류 하세요.

분류 가능한 부서 목록:
{dept_list}
"""


def _build_tools(department_names: list[str]) -> list:
    return [
        {
            "name": "classify_document",
            "description": "기업 문서를 분석하여 담당 부서를 분류하고 요약합니다.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "document_type": {
                        "type": "string",
                        "enum": ["계약서", "보고서", "기획서", "품의서", "기타"],
                    },
                    "department": {
                        "type": "string",
                        "enum": department_names,
                    },
                    "summary": {"type": "string"},
                    "keywords": {"type": "array", "items": {"type": "string"}},
                    "confidence": {"type": "number"},
                    "reasoning": {"type": "string"},     
                },
                "required": ["document_type", "department", "summary", "keywords", "confidence", "reasoning"],
            },
        }
    ]


# ── Claude API 호출 ──────────────────────────────────────────
def analyze_document(text: str, department_names: list[str]) -> dict:
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

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=_build_system_prompt(department_names),
        tools=_build_tools(department_names),
        tool_choice={"type":"tool","name": "classify_document"},
        messages=[
            {
                "role": "user",
                "content": f"다음 문서를 분석해주세요:\n\n{text}"
            }
        ]
    )

    #TOOL 결과 추출
    for block in response.content:
        if block.type == "tool_use" and block.name =="classify_document":
            return block.input
    raise Exception("Tool Use 결과 없음")
       