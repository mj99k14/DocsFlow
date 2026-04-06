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
- [ ] **대시보드 에러 표시** — API 실패 시 사용자에게 아무 피드백이 없음

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

## 📚 공부 — 백엔드 (Python / FastAPI)

- [ ] **SQLAlchemy ORM**
  - Column 타입 (String, Integer, Float, JSONB, Enum)
  - relationship, ForeignKey, cascade
  - `db.query().filter().first()` 패턴
  - `selectinload` — N+1 쿼리 문제와 해결
- [ ] **FastAPI 핵심**
  - `Depends(get_db)` — 의존성 주입 패턴
  - `BackgroundTasks` — 비동기 백그라운드 작업
  - `lifespan` — 앱 시작/종료 시 실행되는 코드
  - `APIRouter` — 라우터 분리 구조
- [ ] **Pydantic**
  - `BaseModel`, `Optional`, `from_attributes`
  - 요청/응답 스키마 분리하는 이유
- [ ] **Claude Tool Use API**
  - `tools`, `tool_choice` 파라미터
  - `block.type == "tool_use"` 응답 파싱
  - 일반 텍스트 응답 vs Tool Use 차이
- [ ] **APScheduler**
  - `BackgroundScheduler` vs `AsyncScheduler`
  - cron 표현식 (`hour=0, minute=0`)
- [ ] **환경변수 (.env)**
  - `dotenv` 사용법
  - 민감 정보 분리하는 이유

---

## 📚 공부 — 프론트엔드 (React)

- [ ] **useState / useEffect**
  - 상태가 바뀌면 왜 리렌더링되는지
  - useEffect 의존성 배열 `[]` vs `[값]` 차이
  - 폴링 구현 (`setInterval` + `useRef` + cleanup)
- [ ] **React Router**
  - `useParams` — URL에서 `:id` 꺼내는 법
  - `useNavigate` — 코드로 페이지 이동
  - `<Route>` 구조
- [ ] **axios 패턴**
  - `.then(r => r.data)` 체이닝
  - `headers` 넘기는 법 (PIN 인증)
  - `responseType: 'blob'` — 파일 다운로드
  - `FormData` — 파일 업로드
- [ ] **컴포넌트 구조**
  - props 전달
  - 조건부 렌더링 (`&&`, 삼항연산자)
  - 리스트 렌더링 (`.map()` + `key`)
- [ ] **shadcn/ui**
  - 로컬에 복사된 컴포넌트 구조
  - Tailwind CSS 클래스 기반 스타일링
  - CSS 변수 (`--card`, `--primary` 등)

---

## 📚 공부 — 인프라 / 기타

- [ ] **PostgreSQL 기본**
  - `psql` 접속 및 기본 쿼리
  - `ALTER TABLE` — 컬럼 추가
  - JSONB 타입 (keywords 저장 방식)
- [ ] **CORS**
  - 왜 필요한지 (브라우저 보안 정책)
  - `allow_origins` 설정
- [ ] **Git 흐름**
  - `add → commit → push` 각 단계 의미
  - `.gitignore` — 올리면 안 되는 파일 관리
