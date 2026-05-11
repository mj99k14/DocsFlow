# DocsFlow — 문서 자동 라우팅 시스템

AI 기반 문서 분류 및 부서 라우팅 시스템. 문서를 업로드하면 Claude AI가 내용을 분석하여 담당 부서로 자동 전달하고, Slack을 통해 승인/반려/보류를 처리합니다.

## 라이브 데모

| 서비스 | URL |
|--------|-----|
| 프론트엔드 | https://docs-flow-orcin.vercel.app/ |
| 백엔드 API | https://docsflow.onrender.com/docs |

## 주요 기능

- PDF / DOCX 문서 업로드
- Claude AI (claude-sonnet-4-6)로 문서 유형 분류 및 담당 부서 추천
- 복수 부서 동시 라우팅 (AND 승인 로직)
- Slack 버튼을 통한 승인 / 반려 / 보류 처리
- 반려 시 관리자 채널로 재분류 요청 전송
- 신뢰도 임계값 설정 (미달 시 관리자 직접 검토)
- 부서 관리 / 멤버 관리 (관리자 PIN 인증)

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React + Vite, shadcn/ui, Tailwind CSS |
| 백엔드 | FastAPI (Python) |
| 데이터베이스 | PostgreSQL (Supabase) |
| AI | Anthropic Claude API |
| 알림 | Slack Bot API + Webhook |
| 배포 | Vercel (FE) + Render (BE) + Supabase (DB) |

## 아키텍처

```
document-routing/
├── backend/
│   ├── main.py              # FastAPI 앱 진입점
│   ├── database.py          # SQLAlchemy 세션/엔진
│   ├── models.py            # ORM 모델
│   ├── schemas.py           # Pydantic 스키마
│   ├── routers/
│   │   ├── documents.py     # 문서 CRUD + 승인 API
│   │   ├── departments.py   # 부서/멤버 관리 API
│   │   └── slack.py         # Slack 콜백 처리
│   └── services/
│       ├── ai.py            # Claude API 호출
│       ├── pdf.py           # PDF/DOCX 텍스트 추출
│       └── slack.py         # Slack 메시지 전송
└── frontend/
    └── src/
        ├── pages/           # Dashboard, DocumentDetail, Upload, Settings
        ├── components/      # UI 컴포넌트
        └── services/api.js  # 백엔드 API 클라이언트
```

## 문서 처리 흐름

```
업로드 → PENDING
       → ANALYZING  (AI 분석 중)
       → COMPLETED  (분석 완료, Slack 알림 전송)
       → APPROVED   (모든 부서 승인)
       → REJECTED   (1개 이상 부서 반려)
       → HELD       (보류)
       → FAILED     (분석 실패, 재시도 가능)
```

## 로컬 실행

### 사전 준비

- Python 3.11+
- Node.js 18+
- PostgreSQL (또는 Supabase 연결)

### 백엔드

```bash
cd document-routing/backend
# .env 파일 생성 (아래 환경변수 섹션 참고)
../../.venv/Scripts/uvicorn main:app --reload
```

### 프론트엔드

```bash
cd document-routing/frontend
npm install
npm run dev
```

## 환경변수

### 백엔드 (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
ANTHROPIC_API_KEY=sk-ant-...
SLACK_BOT_TOKEN=xoxb-...
SLACK_WEBHOOK_REJECT=https://hooks.slack.com/services/...
BASE_URL=http://localhost:8000
ADMIN_PIN=1234
```

### 프론트엔드 (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

## Slack 연동 설정

1. Slack App 생성 → Bot Token 발급 (`SLACK_BOT_TOKEN`)
2. Interactivity 활성화 → Request URL: `https://docsflow.onrender.com/slack/callback`
3. 관리자 채널 Incoming Webhook 생성 (`SLACK_WEBHOOK_REJECT`)
4. Settings 페이지에서 각 부서에 Slack 채널 ID 연결
