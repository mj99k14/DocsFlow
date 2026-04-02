import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


# ---------------------------------------------------------------------------
# GET /departments/
# ---------------------------------------------------------------------------

def test_get_departments_returns_list(client):
    """GET /departments/ 호출 시 200 응답과 함께 리스트를 반환하는지 확인."""
    response = client.get("/departments/")

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )
    assert isinstance(response.json(), list), (
        f"응답 바디가 list 타입이어야 하지만 {type(response.json()).__name__}가 반환되었습니다"
    )


# ---------------------------------------------------------------------------
# POST /departments/
# ---------------------------------------------------------------------------

def test_create_department_success(client):
    """POST /departments/ 에 유효한 데이터를 전송하면 부서가 생성되고 200을 반환하는지 확인."""
    payload = {"name": "재무팀", "slack_channel": "#finance"}
    response = client.post("/departments/", json=payload)

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )

    body = response.json()
    assert body.get("name") == "재무팀", (
        f"name이 '재무팀'이어야 하지만 '{body.get('name')}'이 반환되었습니다"
    )
    assert body.get("slack_channel") == "#finance", (
        f"slack_channel이 '#finance'이어야 하지만 '{body.get('slack_channel')}'이 반환되었습니다"
    )
    assert "id" in body, "응답 JSON에 'id' 필드가 존재해야 합니다"


def test_create_department_without_name_fails(client):
    """POST /departments/ 에 name 필드 없이 요청하면 422 Unprocessable Entity를 반환하는지 확인."""
    response = client.post("/departments/", json={})

    assert response.status_code == 422, (
        f"422이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


# ---------------------------------------------------------------------------
# PUT /departments/{dept_id}
# ---------------------------------------------------------------------------

def test_update_department_slack_channel(client, sample_department):
    """PUT /departments/{id} 로 slack_channel을 수정하면 변경된 값이 반환되는지 확인."""
    dept_id = sample_department.id
    response = client.put(f"/departments/{dept_id}", json={"slack_channel": "#updated"})

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )

    body = response.json()
    assert body.get("slack_channel") == "#updated", (
        f"slack_channel이 '#updated'이어야 하지만 '{body.get('slack_channel')}'이 반환되었습니다"
    )


def test_update_nonexistent_department_returns_404(client):
    """존재하지 않는 부서 ID로 PUT 요청 시 404를 반환하는지 확인."""
    response = client.put("/departments/99999", json={"slack_channel": "#test"})

    assert response.status_code == 404, (
        f"404이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )


def test_update_with_null_slack_channel_keeps_existing(client, sample_department):
    """PUT 요청에서 slack_channel을 null로 보내면 기존 값('#legal')을 유지하는지 확인."""
    dept_id = sample_department.id
    response = client.put(f"/departments/{dept_id}", json={"slack_channel": None})

    assert response.status_code == 200, (
        f"200이 기대되었으나 {response.status_code}가 반환되었습니다: {response.text}"
    )

    body = response.json()
    assert body.get("slack_channel") == "#legal", (
        f"null 전송 시 기존 값 '#legal'이 유지되어야 하지만 '{body.get('slack_channel')}'이 반환되었습니다"
    )
