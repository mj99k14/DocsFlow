import pdfplumber
import docx
from pathlib import Path
import logging
logging.getLogger("pdfplumber").setLevel(logging.ERROR)

ALLOWED_EXTENSIONS = (".pdf", ".docx")

def extract_text(file_path: str) -> str:
    """
    PDF 또는 DOCX 파일에서 텍스트 추출

    Args:
        file_path: 파일 경로

    Returns:
        추출된 텍스트
    """
    if not Path(file_path).exists():
        raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")

    if file_path.endswith(".pdf"):
        return _extract_from_pdf(file_path)
    elif file_path.endswith(".docx"):
        return _extract_from_docx(file_path)
    else:
        raise ValueError(f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(ALLOWED_EXTENSIONS)}")


def _extract_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            if len(pdf.pages) == 0:
                raise ValueError("PDF에 페이지가 없습니다.")
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    text += f"\n[페이지 {i + 1}]\n"
                    text += page_text
    except Exception as e:
        raise Exception(f"PDF 텍스트 추출 실패: {str(e)}")

    if not text.strip():
        raise ValueError("텍스트를 추출할 수 없습니다. 스캔된 PDF일 수 있습니다")
    return text.strip()


def _extract_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs)
    except Exception as e:
        raise Exception(f"DOCX 텍스트 추출 실패: {str(e)}")

    if not text.strip():
        raise ValueError("텍스트를 추출할 수 없습니다. 빈 문서일 수 있습니다")
    return text.strip()


# 하위 호환용 (기존 코드에서 extract_text_from_pdf 를 직접 호출하는 곳 없음)
extract_text_from_pdf = extract_text

#페이지 수 등 기본 정보
def ger_pdf_info(file_path:str) -> dict:
    """
    PDF 기본 정보 반환 (페이지 수 등)
    
    Args:
        file_path: PDF 파일 경로
    
    Returns:
        PDF 정보 딕셔너리
    """
    with pdfplumber.open(file_path) as pdf:
        return{
            "page_count": len(pdf.pages),
            "file_path": file_path
        }