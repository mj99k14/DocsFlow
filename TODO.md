# DocsFlow TODO

---

## ✅ 완료된 것

- [x] PDF 업로드 + AI 분석 (Claude Tool Use)
- [x] Slack 알림 전송 (승인/반려/보류 버튼 포함)
- [x] Slack 버튼 클릭 → DB 상태 업데이트
- [x] 관리자 PIN 인증 (설정 페이지)
- [x] 부서별 Webhook URL DB 관리
- [x] AI 신뢰도 임계값 설정 (미달 시 관리자 채널)
- [x] 승인 완료 숨김 토글 (대시보드)
- [x] 자동 삭제 — 승인 문서 30일 후 삭제 (APScheduler)
- [x] 승인 내역 CSV 내보내기
- [x] 시스템 현황 통계 카드
- [x] 분석 실패 문서 재시도 (최대 3회 제한)

---

## 🔴 지금 당장 필요한 것

- [x] **DB 마이그레이션** — `retry_count` 컬럼 추가 완료
- [x] **파일 없는 FAILED 문서 처리** — 재시도 시 파일 삭제된 경우 toast 에러 메시지 표시
- [x] **대시보드 에러 표시** — API 실패 시 에러 배너 표시

---

## 🟡 기능 완성도

- [ ] **부서 삭제 기능** — 설정 페이지에 삭제 버튼 없음
- [ ] **문서 수동 삭제** — 관리자가 특정 문서 삭제할 수 있어야 함
- [ ] **대시보드 페이지네이션** — 문서 많아지면 느려짐 (현재 전체 조회)
- [ ] **분류 부서 동적화** — AI가 DB 부서 목록 기반으로 분류 (현재 4개 하드코딩)
- [ ] **스캔 PDF 지원** — OCR 연동 (이미지 기반 PDF는 현재 텍스트 추출 안 됨)

---

## 🔵 장기 / 서비스 확장

- [ ] **로그인/인증** — 현재 PIN 하나로 전체 공유, 사용자별 권한 필요
- [ ] **WebSocket** — 현재 5초 폴링 방식 → 실시간 업데이트로 전환
- [ ] **Slack Bot Token** — 부서 추가 시 채널 자동 생성
- [ ] **AI Agent 전환** — 단순 분류 → 다단계 추론, 문서 간 관계 분석
- [ ] **배포** — 로컬 전용 → 서버 배포 (Render, Railway 등)

---

## 📚 3일 공부 계획

> 각 날은 **개념 설명 → 코드 리뷰** 순서로 진행한다.
> 이 프로젝트 코드를 직접 보면서 "왜 이렇게 썼는지"를 이해하는 것이 목표다.

---

### Day 1 — 백엔드 핵심: DB와 API 구조

**개념 설명**
- [ ] **SQLAlchemy ORM** — DB를 Python 객체로 다루는 방법
  - `Column`, `relationship`, `ForeignKey`, `cascade` 가 뭔지
  - `db.query().filter().first()` 패턴이 SQL로 치면 뭔지
  - `selectinload` — N+1 쿼리 문제가 뭔지, 왜 쓰는지
- [ ] **FastAPI 구조**
  - `APIRouter` — 왜 라우터를 파일로 분리하는지
  - `Depends(get_db)` — 의존성 주입이 뭔지, 왜 쓰는지
  - `BackgroundTasks` — 업로드 후 즉시 응답하는 이유
- [ ] **Pydantic 스키마**
  - `models.py` vs `schemas.py` — 둘이 왜 따로 있는지
  - `from_attributes = True` 가 뭔지

**코드 리뷰**
- [ ] `database.py` — engine, sessionLocal, get_db() 흐름
- [ ] `models.py` — Document → AnalysisResult → DocumentDepartment 관계
- [ ] `routers/documents.py` — 업로드부터 AI 분석까지 전체 파이프라인

---

### Day 2 — AI 연동과 비동기 처리

**개념 설명**
- [ ] **Claude Tool Use API**
  - 일반 텍스트 응답 vs Tool Use 차이
  - `tools`, `tool_choice` 파라미터가 하는 일
  - `block.type == "tool_use"` 로 응답 파싱하는 이유
- [ ] **환경변수 (.env)**
  - API 키를 코드에 안 쓰는 이유
  - `os.getenv()` / `dotenv` 동작 방식
- [ ] **APScheduler**
  - 30일 자동 삭제가 어떻게 돌아가는지
  - `BackgroundScheduler` vs `cron` 표현식
- [ ] **PostgreSQL 기본**
  - JSONB 타입 — keywords 가 왜 JSONB로 저장되는지
  - `ALTER TABLE` — 왜 create_all()로 컬럼 추가가 안 되는지

**코드 리뷰**
- [ ] `services/ai.py` — `_build_system_prompt`, `_build_tools`, `analyze_document` 흐름
- [ ] `services/pdf.py` — PDF 텍스트 추출 방식
- [ ] `services/slack.py` — Webhook 메시지 전송 구조
- [ ] `main.py` — lifespan, 라우터 등록, CORS 설정

---

### Day 3 — 프론트엔드: React + API 연동

**개념 설명**
- [ ] **useState / useEffect**
  - 상태가 바뀌면 왜 화면이 다시 그려지는지
  - `useEffect` 의존성 배열 `[]` vs `[page]` 차이
  - 폴링 구현 — `setInterval` + `useRef` + cleanup 패턴
- [ ] **React Router**
  - `useParams` — URL의 `:id` 를 어떻게 꺼내는지
  - `useNavigate` — 삭제 후 대시보드로 이동하는 코드
- [ ] **axios 패턴**
  - `.then(r => r.data)` 체이닝이 뭔지
  - `headers` 로 PIN 넘기는 방식
  - `FormData` — 파일 업로드할 때 왜 쓰는지
- [ ] **CORS**
  - 왜 백엔드에 `allow_origins` 설정이 필요한지
  - 프론트(3000) → 백엔드(8000) 요청이 막히는 이유

**코드 리뷰**
- [ ] `services/api.js` — 전체 API 함수 구조
- [ ] `Dashboard.jsx` — 폴링, 필터, 페이지네이션 흐름
- [ ] `DocumentDetail.jsx` — 상태 관리, 재시도, 삭제 흐름
- [ ] `App.jsx` — 라우팅 구조, 레이아웃
