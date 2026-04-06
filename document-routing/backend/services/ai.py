import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── 프롬프트 ────────────────────────────────────────────────
SYSTEM_PROMPT = """
당신은 기업 문서 분류 전문가 AI AGENT 입니다.
문서 내용을 꼼꼼히 분석하고 반드시 classify_document 툴을 사용하여 분류 하세요.

분류 기준:
- 법무팀: 계약서, 법적 문서, 협약서, 소송 관련
- 재무팀: 예산, 결산, 회계, 세금, 지출 관련
- 인사팀: 채용, 급여, 복리후생, 인사평가 관련
- 경영기획팀: 사업계획, 전략, 보고서, 기획서 관련
"""

#------------tool정의------------------------------------------
tools = [
    {
        "name": "classify_document",
        "description":"기업 문서를 분석하여 담당 부서를 분류하고 요약합니다.",
        "input_schema" : {
            "type" : "object",
            "properties": {
                "document_type" :{
                    "type" :"string",
                    "enum": ["계약서", "보고서", "기획서", "품의서", "기타"],
                },
                "department": {
                    "type": "string",
                    "enum" : ["법무팀", "재무팀", "인사팀", "경영기획팀"],
                },
            "summary": {"type": "string"},
            "keywords" : {"type": "array", "items": {"type": "string"}},
            "confidence" : {"type": "number"},
            "reasoning": {"type": "string"},
            },
            "required": ["document_type", "department", "summary", "keywords", "confidence", "reasoning"],
        },
    }
]


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

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        tools=tools,
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
       