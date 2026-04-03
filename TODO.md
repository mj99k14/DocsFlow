# DocsFlow 할 일 목록

---

## 🔴 단기 (지금 바로 할 수 있는 것)

- [x] 반려/보류 버튼 추가 — DocumentDetail에 승인 버튼 옆에 반려·보류 버튼 추가
- [x] 10MB 파일 크기 제한 — Upload.jsx `addFiles`에 size 체크 추가
- [x] Slack Webhook URL 관리 UI — 설정 페이지에서 URL 저장 시 실제 백엔드 반영

---

## 🟡 중기 (기능 완성도)

- [ ] 알림 설정 토글 실제 연동 — 현재 UI만 있고 기능 없음

---

## 🔵 장기 (서비스 확장)

- [ ] 로그인/인증 — 사용자별 권한, 승인자 이름 하드코딩 제거
  - [ ] 문서 삭제 — 권한 있는 사용자만 삭제 가능하도록 인증과 함께 구현
- [ ] Slack Bot Token 전환 — 부서 추가/삭제 시 채널 자동 생성/삭제
  - [ ] 부서 삭제 기능 — Bot Token 연동과 함께 구현
- [ ] 스캔 PDF 지원 — OCR 연동 (텍스트 없는 이미지 PDF 처리)
- [ ] 분류 부서 동적 확장 — 현재 4개 고정 → DB 부서 목록 기반으로 AI가 분류
- [ ] AI Agent 전환 — 단순 분류 → 다단계 추론, 문서 간 관계 분석

---

## 📚 공부 (병행)

- [ ] `main.jsx` — React가 HTML에 붙는 방식
- [ ] `App.jsx` — 라우팅, 레이아웃 구조
- [ ] `Dashboard.jsx` — useState, useEffect 실전 이해
- [ ] `DocumentDetail.jsx` — URL 파라미터, 조건부 렌더링
- [ ] `api.js` — axios 패턴, FormData
- [ ] `Upload.jsx` — useState, 드래그앤드롭 이벤트, 파일 유효성 검사 패턴
