import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import io
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from models import StatusType, Document


# ---------------------------------------------------------------------------
# 업로드 관련 (테스트 1-2)
# ---------------------------------------------------------------------------

def test_upload_pdf_success(client):
    """PDF 파일 업로드 시 200 응답과 함께 file_name, status 필드를 반환하는지 확인.

    process_document 백그라운드 태스크와 파일 저장(open)을 mock으로 교체해
    실제 AI 분석 및 디스크 쓰기를 방지한다.
    """
    pdf_bytes = io.BytesIO(b"%PDF-1.4 fake pdf content")

    with patch("routers.documents.process_document") as mock_process, \
         patch("builtins.open", MagicMock()):
        response = client.post(
            "/documents/upload",
            files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
        )

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert "file_name" in body, "응답 JSON에 'file_name' 필드가 존재해야 합니다"
    assert "status" in body, "응답 JSON에 'status' 필드가 존재해야 합니다"


def test_upload_non_pdf_fails(client):
    """지원하지 않는 확장자(.hwp) 업로드 시 400 Bad Request를 반환하는지 확인."""
    hwp_bytes = io.BytesIO(b"HWP fake content")

    response = client.post(
        "/documents/upload",
        files={"file": ("report.hwp", hwp_bytes, "application/octet-stream")},
    )

    assert response.status_code == 400, (
        f"400이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# 목록/상세 조회 (테스트 3-5)
# ---------------------------------------------------------------------------

def test_get_documents_returns_list(client):
    """GET /documents/ 호출 시 200 응답과 함께 리스트를 반환하는지 확인."""
    response = client.get("/documents/")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    assert isinstance(response.json(), list), (
        f"응답 바디가 list 타입이어야 하지만 {type(response.json()).__name__}가 반환되었습니다"
    )


def test_get_document_detail_success(client, sample_document):
    """GET /documents/{id} 호출 시 200 응답과 함께 올바른 file_name을 반환하는지 확인."""
    doc_id = sample_document.id
    response = client.get(f"/documents/{doc_id}")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert body.get("file_name") == "test.pdf", (
        f"file_name이 'test.pdf'이어야 하지만 '{body.get('file_name')}'이 반환되었습니다"
    )


def test_get_nonexistent_document_returns_404(client):
    """존재하지 않는 문서 ID로 GET 요청 시 404를 반환하는지 확인."""
    response = client.get("/documents/99999")

    assert response.status_code == 404, (
        f"404이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# 파일 다운로드 (테스트 6-7)
# ---------------------------------------------------------------------------

def test_download_file_success(client, db, sample_document, tmp_path):
    """GET /documents/{id}/file 호출 시 실제 파일이 존재하면 200을 반환하는지 확인.

    tmp_path fixture로 임시 PDF 파일을 생성한 뒤, sample_document의
    file_path를 해당 경로로 직접 수정해 다운로드를 테스트한다.
    """
    # 임시 PDF 파일 생성
    tmp_file = tmp_path / "test.pdf"
    tmp_file.write_bytes(b"%PDF-1.4 temporary pdf")

    # DB에서 직접 file_path 수정
    sample_document.file_path = str(tmp_file)
    db.commit()
    db.refresh(sample_document)

    response = client.get(f"/documents/{sample_document.id}/file")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


def test_download_file_not_found(client, sample_document):
    """GET /documents/{id}/file 호출 시 file_path가 존재하지 않으면 404를 반환하는지 확인.

    sample_document의 file_path는 './test.pdf'로 실제 존재하지 않는 경로이므로
    별도 수정 없이 그대로 사용한다.
    """
    response = client.get(f"/documents/{sample_document.id}/file")

    assert response.status_code == 404, (
        f"404이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# 승인/반려/보류 (테스트 8-11)
# ---------------------------------------------------------------------------

def test_approve_document_success(client, sample_document):
    """POST /documents/{id}/approve 에 APPROVED 액션 전송 시 200과 action 필드를 반환하는지 확인.

    send_approved_notification을 mock으로 교체해 실제 Slack 전송을 방지한다.
    """
    with patch("routers.documents.send_approved_notification") as mock_notify:
        response = client.post(
            f"/documents/{sample_document.id}/approve",
            json={"action": "APPROVED", "approved_by": "관리자"},
        )

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert body.get("action") == "APPROVED", (
        f"action이 'APPROVED'이어야 하지만 '{body.get('action')}'이 반환되었습니다"
    )


def test_reject_document_success(client, sample_document):
    """POST /documents/{id}/approve 에 REJECTED 액션 전송 시 200과 action 필드를 반환하는지 확인."""
    response = client.post(
        f"/documents/{sample_document.id}/approve",
        json={"action": "REJECTED", "approved_by": "관리자"},
    )

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert body.get("action") == "REJECTED", (
        f"action이 'REJECTED'이어야 하지만 '{body.get('action')}'이 반환되었습니다"
    )


def test_hold_document_success(client, sample_document):
    """POST /documents/{id}/approve 에 HELD 액션 전송 시 200과 action 필드를 반환하는지 확인."""
    response = client.post(
        f"/documents/{sample_document.id}/approve",
        json={"action": "HELD", "approved_by": "관리자"},
    )

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert body.get("action") == "HELD", (
        f"action이 'HELD'이어야 하지만 '{body.get('action')}'이 반환되었습니다"
    )


def test_approve_nonexistent_document_returns_404(client):
    """존재하지 않는 문서 ID로 승인 요청 시 404를 반환하는지 확인."""
    response = client.post(
        "/documents/99999/approve",
        json={"action": "APPROVED", "approved_by": "관리자"},
    )

    assert response.status_code == 404, (
        f"404이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# 승인 이력 (테스트 12-13)
# ---------------------------------------------------------------------------

def test_get_history_success(client, sample_document):
    """승인 처리 후 GET /documents/{id}/history 호출 시 이력이 1건 이상 반환되는지 확인.

    send_approved_notification을 mock으로 교체해 실제 Slack 전송을 방지한다.
    """
    # 먼저 승인 처리
    with patch("routers.documents.send_approved_notification"):
        client.post(
            f"/documents/{sample_document.id}/approve",
            json={"action": "APPROVED", "approved_by": "관리자"},
        )

    response = client.get(f"/documents/{sample_document.id}/history")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert isinstance(body, list), (
        f"응답 바디가 list 타입이어야 하지만 {type(body).__name__}가 반환되었습니다"
    )
    assert len(body) >= 1, (
        f"이력이 1건 이상이어야 하지만 {len(body)}건이 반환되었습니다"
    )


def test_get_history_nonexistent_document_returns_404(client):
    """존재하지 않는 문서 ID로 이력 조회 시 404를 반환하는지 확인."""
    response = client.get("/documents/99999/history")

    assert response.status_code == 404, (
        f"404이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# 목록 정렬 (테스트 14)
# ---------------------------------------------------------------------------

def test_documents_ordered_by_created_at_desc(client, db):
    """GET /documents/ 응답이 created_at 내림차순(최신순)으로 정렬되어 있는지 확인.

    created_at 값이 다른 Document 2개를 직접 생성해 순서를 검증한다.
    """
    older_doc = Document(
        file_name="older.pdf",
        file_path="./older.pdf",
        status=StatusType.PENDING,
        created_at=datetime.utcnow() - timedelta(hours=1),
    )
    newer_doc = Document(
        file_name="newer.pdf",
        file_path="./newer.pdf",
        status=StatusType.PENDING,
        created_at=datetime.utcnow(),
    )
    db.add(older_doc)
    db.add(newer_doc)
    db.commit()

    response = client.get("/documents/")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    body = response.json()
    assert isinstance(body, list) and len(body) >= 2, (
        f"문서가 2건 이상이어야 하지만 {len(body)}건이 반환되었습니다"
    )

    # 첫 번째 항목이 newer_doc(더 최근)이어야 한다
    first_name = body[0].get("file_name")
    assert first_name == "newer.pdf", (
        f"첫 번째 항목이 'newer.pdf'이어야 하지만 '{first_name}'이 반환되었습니다"
    )
