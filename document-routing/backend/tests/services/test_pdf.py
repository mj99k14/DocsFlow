import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import pytest
from unittest.mock import MagicMock, patch
from services.pdf import extract_text_from_pdf


def test_file_not_found():
    """존재하지 않는 파일 경로를 전달하면 FileNotFoundError가 발생한다."""
    with pytest.raises(FileNotFoundError):
        extract_text_from_pdf("/nonexistent/path/file.pdf")


def test_non_pdf_file(tmp_path):
    """PDF가 아닌 파일(.txt)을 전달하면 ValueError가 발생한다."""
    txt_file = tmp_path / "document.txt"
    txt_file.write_text("텍스트 내용")
    with pytest.raises(ValueError, match="PDF 파일만 지원합니다"):
        extract_text_from_pdf(str(txt_file))


def test_successful_text_extraction(tmp_path):
    """정상적인 PDF에서 텍스트를 성공적으로 추출한다."""
    pdf_file = tmp_path / "test.pdf"
    pdf_file.write_bytes(b"%PDF-1.4 fake content")

    mock_page1 = MagicMock()
    mock_page1.extract_text.return_value = "첫 번째 페이지 내용"
    mock_page2 = MagicMock()
    mock_page2.extract_text.return_value = "두 번째 페이지 내용"

    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page1, mock_page2]
    mock_pdf.__enter__ = lambda self: self
    mock_pdf.__exit__ = MagicMock(return_value=False)

    with patch("pdfplumber.open", return_value=mock_pdf):
        result = extract_text_from_pdf(str(pdf_file))

    assert "[페이지 1]" in result
    assert "[페이지 2]" in result
    assert "첫 번째 페이지 내용" in result
    assert "두 번째 페이지 내용" in result


def test_scanned_pdf_raises_error(tmp_path):
    """텍스트가 없는 스캔 PDF는 ValueError를 발생시킨다."""
    pdf_file = tmp_path / "scanned.pdf"
    pdf_file.write_bytes(b"%PDF-1.4 fake content")

    mock_page = MagicMock()
    mock_page.extract_text.return_value = None

    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page]
    mock_pdf.__enter__ = lambda self: self
    mock_pdf.__exit__ = MagicMock(return_value=False)

    with patch("pdfplumber.open", return_value=mock_pdf):
        with pytest.raises(ValueError, match="텍스트를 추출할 수 없습니다"):
            extract_text_from_pdf(str(pdf_file))


def test_multipage_pdf_all_pages_included(tmp_path):
    """3페이지 PDF에서 모든 페이지의 텍스트가 포함된다."""
    pdf_file = tmp_path / "multipage.pdf"
    pdf_file.write_bytes(b"%PDF-1.4 fake content")

    pages = []
    for i, content in enumerate(["내용1", "내용2", "내용3"]):
        mock_page = MagicMock()
        mock_page.extract_text.return_value = content
        pages.append(mock_page)

    mock_pdf = MagicMock()
    mock_pdf.pages = pages
    mock_pdf.__enter__ = lambda self: self
    mock_pdf.__exit__ = MagicMock(return_value=False)

    with patch("pdfplumber.open", return_value=mock_pdf):
        result = extract_text_from_pdf(str(pdf_file))

    assert "내용1" in result
    assert "내용2" in result
    assert "내용3" in result


def test_pdf_with_empty_page_skips_it(tmp_path):
    """빈 페이지(None 반환)는 건너뛰고 텍스트가 있는 페이지만 포함한다."""
    pdf_file = tmp_path / "partial.pdf"
    pdf_file.write_bytes(b"%PDF-1.4 fake content")

    mock_page1 = MagicMock()
    mock_page1.extract_text.return_value = "텍스트 있음"
    mock_page2 = MagicMock()
    mock_page2.extract_text.return_value = None

    mock_pdf = MagicMock()
    mock_pdf.pages = [mock_page1, mock_page2]
    mock_pdf.__enter__ = lambda self: self
    mock_pdf.__exit__ = MagicMock(return_value=False)

    with patch("pdfplumber.open", return_value=mock_pdf):
        result = extract_text_from_pdf(str(pdf_file))

    assert "텍스트 있음" in result
    assert "[페이지 2]" not in result
