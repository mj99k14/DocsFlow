# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 설정

모든 응답은 한국어로 작성한다.

## 프로젝트 개요

**DocsFlow** — 문서 라우팅 시스템. FastAPI 백엔드 + PostgreSQL 데이터베이스 구성.

## 실행 방법

### 백엔드

```bash
# 반드시 .venv의 uvicorn을 직접 실행 (system Python은 패키지 못 찾음)
c:\Users\YJU\Desktop\DOCX\.venv\Scripts\uvicorn main:app --reload
```

PostgreSQL 연결 정보 (`database.py`):
- URL: `postgresql://postgres:1212@localhost:5432/document_routing`
- 로컬 PostgreSQL 서버가 실행 중이어야 한다.

### 프론트엔드

```bash
# document-routing/frontend/ 기준
npm run dev
```

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

## 프론트엔드 아키텍처

```
document-routing/frontend/src/
├── main.jsx          # React 앱 진입점
├── App.jsx           # 라우팅, 레이아웃, 사이드바
├── pages/            # 화면 단위 (주 작업 공간)
│   ├── Dashboard.jsx
│   ├── DocumentDetail.jsx
│   ├── Upload.jsx
│   └── Settings.jsx
├── components/ui/    # shadcn 자동생성 컴포넌트 (수정 불필요)
├── services/api.js   # 백엔드 API 호출 함수 모음
└── lib/utils.js      # shadcn 내부 유틸 (수정 불필요)
```

- 페이지 추가 시: `pages/`에 파일 생성 후 `App.jsx`에 `<Route>` 등록
- API 추가 시: `services/api.js`에만 추가

## Slack 연동

- Webhook URL은 `backend/services/slack.py`의 `WEBHOOK_URLS` 딕셔너리에 부서명:URL 형태로 하드코딩
- 부서명이 없으면 `경영기획팀` URL을 fallback으로 사용

## 백엔드 아키텍처

### DB 세션 주입 패턴

```python
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db

@app.get("/example")
def example(db: Session = Depends(get_db)):
    ...
```
