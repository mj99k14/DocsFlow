# DocsFlow 프로젝트 진행 현황

## 프로젝트 개요
문서를 업로드하면 Claude AI가 분석하여 적절한 부서로 자동 라우팅하고 Slack으로 알림을 보내는 시스템

---

## 전체 흐름

```
사용자가 파일 업로드
    ↓
Vercel (React 프론트엔드)
    ↓ API 요청
ngrok 터널 (noninduced-enrico-unmirthfully.ngrok-free.dev)
    ↓
EC2 (FastAPI 백엔드 :8000)
    ↓
Claude AI → 부서 분류 + 요약 + 키워드 + 신뢰도
    ↓
PostgreSQL (EC2 내부) → 분석 결과 저장
    ↓
신뢰도 임계값 초과? → 해당 부서 Slack 채널로 알림 (승인/반려/보류 버튼)
신뢰도 임계값 미달? → 관리자 채널로 알림 (재분류 드롭다운)
    ↓
Slack 버튼/드롭다운 클릭 → /slack/callback → 상태 업데이트 + 이력 저장
```

---

## 구현 완료 기능

### 백엔드 (FastAPI)

#### 문서 처리
- PDF, DOCX, PPTX, TXT 파일 업로드 및 텍스트 추출
- Claude AI를 통한 문서 자동 분석 (부서 추천, 문서 유형, 요약, 키워드, 근거)
- DB에 등록된 부서 목록 기반 동적 분류
- 신뢰도 임계값 미달 시 관리자 채널 자동 전송
- 분석 실패 시 재시도 기능 (최대 3회)
- 30일 이상 지난 승인 문서 자동 삭제 (APScheduler)

#### 승인 워크플로우
- Slack 버튼 클릭으로 승인 / 반려 / 보류 처리
- 웹 대시보드에서도 승인 / 반려 / 보류 처리
- 반려 시 관리자 채널로 재분류 요청 알림 (재분류 드롭다운 포함)
- 보류 시 관리자 채널로 알림 (재분류 드롭다운 포함)
- 재분류 드롭다운 선택 시 해당 부서 채널로 재전송
- 재분류 후 반려되어도 무한 루프 방지 (이력 체크)
- 승인 이력 저장 및 조회

#### 부서 관리
- 부서 추가 / 삭제 (관리자 PIN 인증)
- 부서별 Slack Webhook URL 관리
- 신뢰도 임계값 설정

#### 문서 검색 (서버사이드)
- `GET /documents/?search=키워드` — 파일명 기준 ilike 검색
- `GET /documents/count?search=키워드` — 검색 결과 수 반환
- 대소문자 무관 부분 일치 검색

### Slack 연동
- 부서 채널: AI 분석 결과 + 승인/반려/보류 버튼
- 관리자 채널: 반려/보류 알림 + 재분류 드롭다운 (`static_select`, 부서 수 제한 없음)
- 버튼/드롭다운 클릭 후 메시지 자동 업데이트 (버튼 제거, 처리 결과 표시)
- 웹 승인 시 해당 부서 채널로 승인 완료 알림
- Slack Interactivity Request URL: `https://noninduced-enrico-unmirthfully.ngrok-free.dev/slack/callback`

### 프론트엔드 (React)

#### 대시보드
- 문서 목록 조회 (페이지네이션)
- 상태별 필터 (전체 / 처리 완료 / 승인 대기 등)
- 파일 유형별 필터 (PDF / DOCX / PPTX / TXT)
- 문서 통계 (총 문서 수, 처리 완료, 분석 중, 평균 신뢰도)
- **서버사이드 검색** (파일명 기준, 300ms 디바운스, 검색 시 1페이지로 초기화)
- **모바일 반응형**: 통계 2×2 그리드, 필터 가로 스크롤, 테이블에서 날짜/부서 열 숨김

#### 문서 상세
- AI 분석 결과 조회 (부서, 유형, 요약, 키워드, 근거, 신뢰도)
- 승인 / 반려 / 보류 처리
- 승인 이력 조회 (KST 시간 표시)
- 파일 다운로드
- 5초마다 자동 갱신 (Slack 버튼 클릭 결과 자동 반영)
- **모바일 반응형**: 헤더 버튼 세로 정렬, 본문 1열 레이아웃

#### 업로드
- PDF, DOCX, PPTX, TXT 파일 업로드
- 업로드 후 실시간 상태 표시
- **모바일 반응형**: 안내 패널 세로 배치

#### 설정
- 부서 추가 / 삭제
- 신뢰도 임계값 설정
- 관리자 PIN 인증
- **모바일 반응형**: 패딩 축소, 통계 2열 그리드

#### 공통 레이아웃 (App.jsx)
- **데스크탑**: 좌측 사이드바 + 상단 헤더
- **모바일**: 상단 헤더 + 하단 탭바 (BottomNav, 고정 위치, safe-area 대응)
- `useIsMobile` 훅 (`src/hooks/useIsMobile.js`) — 768px 기준, resize 이벤트 반응

### 테스트
- pytest 기반 백엔드 단위 테스트
- 별도 PostgreSQL DB(`document_routing_test`)로 격리된 테스트 환경
- 각 테스트마다 트랜잭션 rollback으로 테스트 간 데이터 간섭 없음
- 문서 업로드, 조회, 승인/반려/보류, 이력, 다운로드 테스트

---

## 배포 현황

### 백엔드 (AWS EC2)
- **인스턴스**: t3.micro (ap-northeast-2, 서울)
- **IP**: 54.180.105.235
- **포트**: 8000
- **DB**: PostgreSQL (EC2 내부 로컬)
- **외부 접속**: ngrok 고정 도메인 (`noninduced-enrico-unmirthfully.ngrok-free.dev`)
- **API 문서**: https://noninduced-enrico-unmirthfully.ngrok-free.dev/docs
- **프로세스 관리**: systemd 서비스 (`docsflow.service`, `ngrok.service`) — EC2 재시작 시 자동 실행

### 프론트엔드 (Vercel)
- **URL**: https://docs-flow-orcin.vercel.app
- **배포 방식**: GitHub 연동 자동 배포 (main 브랜치 push 시 자동 재배포)
- **환경 변수**: `VITE_API_URL=https://noninduced-enrico-unmirthfully.ngrok-free.dev`

---

## EC2 서버 관리

### 접속 방법
AWS 콘솔 → EC2 → 인스턴스 → DocsFlow 선택 → 연결 버튼 → EC2 Instance Connect
```bash
sudo su - ec2-user
```

### 코드 변경 배포 (일반적인 경우)
```bash
cd /home/ec2-user/DocsFlow/document-routing/backend
git pull
sudo systemctl restart docsflow
```

### 서비스 상태 확인
```bash
sudo systemctl status docsflow    # uvicorn 상태
sudo systemctl status ngrok       # ngrok 상태
journalctl -u docsflow -n 50      # uvicorn 최근 로그
journalctl -u ngrok -n 20         # ngrok 최근 로그
curl -s https://noninduced-enrico-unmirthfully.ngrok-free.dev/documents/count  # API 응답 확인
```

### systemd 서비스 파일 위치 (EC2)

**`/etc/systemd/system/docsflow.service`**
```ini
[Unit]
Description=DocsFlow FastAPI Backend
After=network.target postgresql.service

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/DocsFlow/document-routing/backend
ExecStart=/home/ec2-user/.local/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**`/etc/systemd/system/ngrok.service`**
```ini
[Unit]
Description=ngrok Tunnel
After=network.target docsflow.service

[Service]
User=ec2-user
ExecStart=/usr/local/bin/ngrok http --url=noninduced-enrico-unmirthfully.ngrok-free.dev 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### ngrok authtoken 재등록 (토큰 오류 시)
```bash
ngrok config add-authtoken 2vQrXJdAGlzyfbrIjMWGdjSv9TK_gs1RUghh7W2WPQ63NHWN
```

---

## 환경 변수 (.env, EC2 경로: /home/ec2-user/DocsFlow/document-routing/backend/.env)

```
DATABASE_URL=postgresql://postgres:1212@localhost:5432/document_routing
ANTHROPIC_API_KEY=...
SLACK_WEBHOOK_REJECT=https://hooks.slack.com/services/...  # 관리자(반려) 채널
BASE_URL=https://noninduced-enrico-unmirthfully.ngrok-free.dev
# SLACK_BOT_TOKEN은 비활성화 (Webhook URL 방식 사용)
```

## Slack Webhook URL (DB departments 테이블에 저장)
| 부서 | 채널 |
|------|------|
| 법무팀 | https://hooks.slack.com/services/T0AM0FMF15L/B0ALWL3DYEP/... |
| 재무팀 | https://hooks.slack.com/services/T0AM0FMF15L/B0AM10ZEE22/... |
| 경영기획팀 | https://hooks.slack.com/services/T0AM0FMF15L/B0AMFUVM4JV/... |
| 인사팀 | https://hooks.slack.com/services/T0AM0FMF15L/B0ALWL0BFT5/... |
| 관리자(반려) | https://hooks.slack.com/services/T0AM0FMF15L/B0AMY24H3QQ/... |

---

## 주요 해결 이슈 이력

| 문제 | 원인 | 해결 |
|------|------|------|
| Slack 알림 안 옴 | SLACK_BOT_TOKEN이 활성화되어 있어 채널 ID 필요 | .env에서 BOT_TOKEN 주석 처리, Webhook URL 방식으로 통일 |
| 재분류 시 반려 채널로 전송 | DB에서 경영기획팀 webhook_url이 관리자 채널 URL과 동일했음 | SQL UPDATE로 경영기획팀 webhook_url 수정 |
| 프론트 CORS 오류 | ngrok 브라우저 경고 페이지가 API 요청을 가로챔 | axios 헤더에 `ngrok-skip-browser-warning: true` 추가 |
| 승인 이력 시간 UTC 표시 | toLocaleString()에 timeZone 옵션 없음 | `{ timeZone: 'Asia/Seoul' }` 추가 |
| Slack 버튼 클릭 후 수동 새로고침 필요 | 단순 useEffect로 1회만 로드 | setInterval 5초 폴링으로 자동 갱신 |
| 백엔드 SSH 종료 시 꺼짐 | 터미널 세션에 종속된 프로세스 | systemd 서비스 등록으로 해결 (EC2 재시작 시 자동 기동) |
| EC2 재시작 시 uvicorn/ngrok 꺼짐 | nohup은 세션 종속, 재부팅 시 미실행 | docsflow.service / ngrok.service를 systemd에 등록 (`systemctl enable`) |
| 재분류 버튼 5개 제한 | Slack actions 블록의 버튼 최대 개수 제한 | `static_select` 드롭다운으로 교체 (제한 없음) |
| 검색이 현재 페이지 내에서만 동작 | 프론트에서 JS filter 방식 사용 | 백엔드 ilike 쿼리로 전체 DB 검색 + 300ms 디바운스 적용 |
| 모바일에서 화면 잘림 | 고정 너비 레이아웃 (사이드바 + 테이블) | useIsMobile 훅 + 조건부 레이아웃 (하단 탭바, 1열 그리드) |

---

## GitHub Actions CI/CD 구성 (백엔드 자동 배포)

### 워크플로우 파일
`.github/workflows/deploy-backend.yml`

### 트리거 조건
`main` 브랜치에 아래 경로 변경 push 시 자동 실행:
- `document-routing/backend/**`
- `.github/workflows/deploy-backend.yml`

### 파이프라인 구조

```
1단계: test job (ubuntu-latest)
  ├── PostgreSQL 15 서비스 컨테이너 (document_routing_test DB)
  ├── Python 3.11 설정 + pip 캐시
  ├── pip install -r requirements.txt -r requirements-test.txt
  └── pytest -v (DATABASE_URL=postgresql://postgres:1212@localhost:5432/document_routing_test)

2단계: deploy job (test 성공 시에만 실행)
  ├── AWS 자격증명 설정 (configure-aws-credentials@v4)
  └── AWS SSM send-command → EC2에서 실행:
        git pull origin main
        pip install -r requirements.txt --quiet
        systemctl restart docsflow
        systemctl is-active docsflow && echo 배포완료
```

### GitHub Secrets 설정 (레포지토리 Settings → Secrets and variables → Actions)

| Secret 이름 | 값 |
|-------------|-----|
| `AWS_ACCESS_KEY_ID` | IAM 사용자 액세스 키 ID |
| `AWS_SECRET_ACCESS_KEY` | IAM 사용자 시크릿 액세스 키 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 |

### AWS 설정

**IAM 사용자 (`github-actions-deployer`)**
- 권한 정책: `AmazonSSMFullAccess` 직접 연결
- 액세스 키 생성 → GitHub Secrets에 등록

**EC2 IAM 역할 (`EC2-SSM-Role`)**
- EC2 인스턴스에 이미 연결되어 있어야 함
- SSM Agent가 실행 중이어야 함 (`systemctl status amazon-ssm-agent`)

### 핵심 설계 결정

| 결정 | 이유 |
|------|------|
| SSH 대신 AWS SSM 사용 | 학교/기업 네트워크에서 포트 22 outbound 차단 |
| SSM 명령에서 `sudo` 제거 | SSM은 root 권한으로 실행되므로 sudo가 오히려 오류 발생 |
| CI용 DB명을 `document_routing_test`로 분리 | `main.py` 임포트 시 `create_all` 호출로 실DB 연결 시도 방지 |
| `requirements-test.txt` 별도 유지 | CI에서만 필요한 pytest 관련 패키지 분리 |

### 트러블슈팅 이력

| 문제 | 원인 | 해결 |
|------|------|------|
| `ModuleNotFoundError: apscheduler` | requirements.txt 누락 | apscheduler, python-docx, python-pptx 추가 |
| `database "document_routing" does not exist` | CI 환경변수와 서비스 컨테이너 DB명 불일치 | 둘 다 `document_routing_test`로 통일 |
| `test_slack` AssertionError (regex mismatch) | 테스트의 match 문자열이 실제 예외 메시지와 달랐음 | 테스트 파일 match 문자열 수정 |
| SSH i/o timeout | 포트 22 outbound 차단 (학교/기업 네트워크) | AWS SSM으로 전환 |
| SSM `Waiter CommandExecuted failed` | `sudo systemctl`을 root로 실행 시 실패 | SSM 명령에서 `sudo` 제거 |

---

## 향후 개선 사항

- [x] EC2 서버 재시작 시 uvicorn/ngrok 자동 실행 (systemd 서비스 등록) ✅
- [x] 재분류 버튼 5개 제한 해결 → static_select 드롭다운으로 교체 ✅
- [x] 서버사이드 문서 검색 (ilike + 디바운스) ✅
- [x] 모바일 반응형 레이아웃 (useIsMobile + 하단 탭바) ✅
- [x] GitHub Actions를 통한 백엔드 자동 배포 (CI/CD) ✅
- [ ] HTTPS 직접 적용 (nginx + Let's Encrypt, ngrok 없이)
