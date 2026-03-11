import pdfplumber
from pathlib import Path
import logging
logging.getLogger("pdfplumber").setLevel(logging.ERROR)

#택스트 추출
def extract_text_from_pdf(file_path:str) -> str:
    """
    PDF 파일에서 텍스트 추출
    
    Args:
        file_path: PDF 파일 경로
    
    Returns:
        추출된 텍스트 (실패 시 빈 문자열)
    """
       
    # 파일 존재 여부 확인
    if not Path(file_path).exists():
       raise FileNotFoundError(f"파일을 찾을 수 없습니다:{file_path}")
    
    #pdf 파일 여부 확인
    if not file_path.endswith(".pdf"):
        raise ValueError("PDF 파일만 지원합니다")

    text =""

    try:
        with pdfplumber.open(file_path) as pdf:

            #페이지가 없는 경우
            if len(pdf.pages) == 0:
                raise ValueError("pdf에 페이지가 없습니다.")
            
            #페이지별 텍스트 추출
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()

                if page_text:
                    text += f"\n[페이지 {i + 1}]\n"
                    text += page_text
    except Exception as e:
        raise Exception(f"PDF텍스트 추출 실패: {str(e)}")
    
    #텍스트가 없는 경우 (스캔 pdf)
    if not text.strip():
        raise ValueError("텍스트를 추출할 수 없습니다. 스캔된 pdf일 수 있습니다")
    return text.strip()

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