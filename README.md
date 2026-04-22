# DocsFlow AI

문서를 업로드하면 Claude AI가 자동으로 분석하여 적절한 부서로 라우팅하고, Slack으로 알림을 보내는 문서 분류 시스템입니다.

## 배포 주소

| 서비스 | URL |
|--------|-----|
| 프론트엔드 (Vercel) | https://docs-flow-orcin.vercel.app |
| 백엔드 API (EC2 + ngrok) | https://noninduced-enrico-unmirthfully.ngrok-free.dev |
| API 문서 (Swagger) | https://noninduced-enrico-unmirthfully.ngrok-free.dev/docs |

## 주요 기능

- **문서 업로드** — PDF, DOCX, PPTX, TXT 지원 (최대 10MB)
- **AI 자동 분류** — Claude AI가 문서 내용을 분석해 담당 부서 추천 (문서 유형, 요약, 키워드, 신뢰도, 판단 근거 제공)
- **Slack 알림** — 분석 완료 시 해당 부서 채널로 알림 (승인/반려/보류 버튼 포함)
- **신뢰도 임계값** — 낮은 신뢰도 문서는 관리자 채널로 분리 전송
- **승인 워크플로우** — Slack 버튼 또는 웹 대시보드에서 승인/반려/보류 처리
- **재분류** — 반려/보류 시 관리자가 드롭다운으로 다른 부서에 재배분
- **자동 삭제** — 승인된 문서 30일 후 자동 삭제

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, React Router, Axios |
| 백엔드 | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Claude API (Tool Use) |
| 알림 | Slack Incoming Webhook |
| 배포 | AWS EC2 (t3.micro) + Vercel |
| CI/CD | GitHub Actions + AWS SSM |
| 터널 | ngrok (고정 도메인) |

## 시스템 흐름

```
사용자 파일 업로드
    ↓
Vercel (React 프론트엔드)
    ↓ API 요청
ngrok 터널
    ↓
EC2 FastAPI 백엔드 (:8000)
    ↓
Claude AI → 부서 분류 + 요약 + 키워드 + 신뢰도
    ↓
PostgreSQL → 분석 결과 저장
    ↓
신뢰도 임계값 초과 → 해당 부서 Slack 채널 (승인/반려/보류 버튼)
신뢰도 임계값 미달 → 관리자 채널 (재분류 드롭다운)
    ↓
Slack 버튼 클릭 → 상태 업데이트 + 이력 저장
```

## 프로젝트 구조

```
document-routing/
├── backend/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── database.py          # SQLAlchemy 엔진 및 세션
│   ├── models.py            # ORM 모델
│   ├── schemas.py           # Pydantic 스키마
│   ├── routers/
│   │   ├── documents.py     # 문서 업로드/조회/승인
│   │   └── departments.py   # 부서 관리
│   └── services/
│       ├── ai.py            # Claude API 연동
│       ├── pdf.py           # 파일 텍스트 추출
│       └── slack.py         # Slack 알림
└── frontend/
    └── src/
        ├── App.jsx          # 라우팅 및 레이아웃
        ├── pages/           # 대시보드, 업로드, 상세, 설정
        └── services/api.js  # API 호출 함수
```

## 로컬 실행

### 백엔드

```bash
cd document-routing/backend
# .env 파일 필요 (DATABASE_URL, ANTHROPIC_API_KEY, ADMIN_PIN 등)
.venv/Scripts/uvicorn main:app --reload
```

### 프론트엔드

```bash
cd document-routing/frontend
npm install
npm run dev
```

## CI/CD

`main` 브랜치에 `document-routing/backend/**` 경로 변경이 push되면 GitHub Actions가 자동으로:

1. pytest 백엔드 테스트 실행
2. 테스트 통과 시 AWS SSM으로 EC2에 자동 배포 (`git pull` + `systemctl restart docsflow`)
