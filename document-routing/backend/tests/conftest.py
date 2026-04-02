import sys
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base, get_db
from main import app
from models import Department, Document, StatusType

TEST_DATABASE_URL = "postgresql://postgres:1212@localhost:5432/document_routing_test"


@pytest.fixture(scope="session")
def engine():
    """테스트 DB 엔진 — 세션 시작 시 테이블 생성, 종료 시 삭제."""
    test_engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db(engine):
    """각 테스트마다 트랜잭션을 시작하고 종료 시 rollback해 테스트 간 격리."""
    connection = engine.connect()
    transaction = connection.begin()

    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=connection
    )
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    """FastAPI TestClient — get_db 의존성을 테스트 DB 세션으로 override."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_department(db):
    """테스트용 부서 레코드 생성."""
    dept = Department(name="법무팀", slack_channel="#legal")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@pytest.fixture
def sample_document(db):
    """테스트용 문서 레코드 생성."""
    doc = Document(
        file_name="test.pdf",
        file_path="./test.pdf",
        status=StatusType.PENDING,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
