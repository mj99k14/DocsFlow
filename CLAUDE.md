# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 설정

모든 응답은 한국어로 작성한다.

## 프로젝트 개요

**DocsFlwe** — 문서 라우팅 시스템. FastAPI 백엔드 + PostgreSQL 데이터베이스 구성.

## 실행 방법

```bash
# 백엔드 서버 실행 (document-routing/backend/ 기준)
uvicorn main:app --reload
```

PostgreSQL 연결 정보 (`database.py`):
- URL: `postgresql://postgres:1212@localhost:5432/document_routing`
- 로컬 PostgreSQL 서버가 실행 중이어야 한다.

## 아키텍처

```
document-routing/
└── backend/
    ├── main.py       # FastAPI 앱 진입점, 라우터 등록
    ├── database.py   # SQLAlchemy 엔진, 세션, Base, get_db() 의존성
    ├── models.py     # SQLAlchemy ORM 모델 (DB 테이블 정의)
    └── schemas.py    # Pydantic 스키마 (요청/응답 직렬화)
```

### 레이어 구조

- **database.py** — `engine`, `sessionLocal`, `Base`, `get_db()` 제공. 모든 모델과 라우터가 이 파일에 의존한다.
- **models.py** — `Base`를 상속한 ORM 클래스 정의. DB 마이그레이션 대상.
- **schemas.py** — Pydantic `BaseModel` 서브클래스로 API 입출력 타입 정의.
- **main.py** — `FastAPI()` 인스턴스 생성, 라우터/엔드포인트 등록.

### DB 세션 주입 패턴

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

@app.get("/example")
def example(db: Session = Depends(get_db)):
    ...
```
