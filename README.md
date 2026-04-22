# 📄 DocsFlow AI — 文書自動ルーティングシステム

このプロジェクトの README は以下の言語でご覧いただけます。
言語を選択してください：

JP 日本語（現在表示中）
KR [한국어판을 읽む](#한국어판)

---

## 🔗 デプロイ済みURL

| サービス | URL |
|----------|-----|
| フロントエンド (Vercel) | https://docs-flow-orcin.vercel.app |
| バックエンド API (EC2 + ngrok) | https://noninduced-enrico-unmirthfully.ngrok-free.app |
| API ドキュメント (Swagger) | https://noninduced-enrico-unmirthfully.ngrok-free.app/docs |

---

## 📌 プロジェクト概要

文書をアップロードすると、Claude AI が内容を自動分析し、適切な部署へルーティングして Slack で通知を送るシステムです。

---

## 🧭 背景

企業の現場では、契約書・企画書・報告書などの文書が毎日多数届きます。
担当部署を手作業で判断・振り分けるプロセスは時間がかかり、ミスも発生しやすい課題があります。

このプロジェクトでは、**Claude AI の Tool Use 機能**を活用することで、文書の内容から担当部署を自動で判定し、Slack を通じた承認ワークフローまでを一貫して実現しました。

---

## 🛠 使用技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React, Vite, React Router, Axios |
| バックエンド | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Claude API (Tool Use による構造化出力) |
| 通知 | Slack Incoming Webhook |
| インフラ | AWS EC2 (t3.micro), Vercel |
| CI/CD | GitHub Actions + AWS SSM |
| トンネル | ngrok（固定ドメイン） |

---

## ⚡ 主な機能

- **文書アップロード** — PDF, DOCX, PPTX, TXT 対応（最大 10MB、フロント・バック両方で検証）
- **AI 自動分類** — Claude が文書の種別・要約・キーワード・信頼度・判断根拠を出力
- **Slack 通知** — 分析完了後、該当部署チャンネルへ通知（承認 / 却下 / 保留ボタン付き）
- **信頼度しきい値** — 低信頼度の文書は管理者チャンネルへ自動振り分け
- **承認ワークフロー** — Slack ボタンまたは Web ダッシュボードで処理可能
- **再分類** — 却下・保留時に管理者がドロップダウンで別部署へ再配布
- **自動削除** — 承認済み文書は 30 日後に自動削除（APScheduler）
- **モバイル対応** — スマートフォンでも操作可能なレスポンシブレイアウト

---

## 💡 工夫した点

**① Slack アクションボタンの上限突破**
Slack の actions ブロックはボタンが最大 5 個までという制限があります。
部署数が増えた場合に備え、再分類 UI を `static_select` ドロップダウンに変更することで制限を回避しました。

**② 再分類の無限ループ防止**
却下 → 再分類 → 再度却下 → 再分類… というループが発生しうる設計でした。
承認履歴テーブルで「再分類済みフラグ」をチェックし、同一文書への二重送信を防止しています。

**③ CI/CD の SSH ポート問題**
学校・企業ネットワークではポート 22（SSH）のアウトバウンドが遮断されているケースがあり、
GitHub Actions からの SSH デプロイが失敗しました。
AWS SSM Session Manager に切り替えることでポートに依存しないデプロイを実現しました。

**④ Claude API のレスポンス構造化**
通常のテキスト応答では JSON パースが不安定になるため、`tool_choice` を強制指定することで
`classify_document` ツールの呼び出しを必須とし、常に構造化された JSON を取得できるようにしました。

**⑤ モバイルレイアウト**
固定幅サイドバーがスマートフォンで画面を圧迫する問題に対し、
`useIsMobile` フックで 768px を境界に切り替え、モバイルでは下部タブバー方式を採用しました。

---

## 📁 プロジェクト構成

```
document-routing/
├── backend/
│   ├── main.py              # FastAPI エントリポイント
│   ├── database.py          # SQLAlchemy エンジン・セッション
│   ├── models.py            # ORM モデル
│   ├── schemas.py           # Pydantic スキーマ
│   ├── routers/
│   │   ├── documents.py     # 文書アップロード・照会・承認
│   │   └── departments.py   # 部署管理
│   └── services/
│       ├── ai.py            # Claude API 連携
│       ├── pdf.py           # テキスト抽出
│       └── slack.py         # Slack 通知
└── frontend/
    └── src/
        ├── App.jsx          # ルーティング・レイアウト
        ├── pages/           # ダッシュボード・アップロード・詳細・設定
        └── services/api.js  # API 呼び出し関数
```

---

<a name="한국어판"></a>

<details>
<summary>🇰🇷 한국어판</summary>

<br>

# 📄 DocsFlow AI — 문서 자동 라우팅 시스템

## 🔗 배포 주소

| 서비스 | URL |
|--------|-----|
| 프론트엔드 (Vercel) | https://docs-flow-orcin.vercel.app |
| 백엔드 API (EC2 + ngrok) | https://noninduced-enrico-unmirthfully.ngrok-free.app |
| API 문서 (Swagger) | https://noninduced-enrico-unmirthfully.ngrok-free.app/docs |

---

## 📌 프로젝트 개요

문서를 업로드하면 Claude AI가 내용을 자동 분석하여 적절한 부서로 라우팅하고, Slack으로 알림을 보내는 문서 분류 시스템입니다.

---

## 🧭 배경

기업 현장에서는 계약서, 기획서, 보고서 등 다양한 문서가 매일 쏟아집니다.
담당 부서를 수동으로 판단하고 배분하는 과정은 시간이 오래 걸리고 실수가 생기기 쉽습니다.

이 프로젝트는 **Claude AI의 Tool Use 기능**을 활용해 문서 내용을 자동으로 분석하고, Slack 기반 승인 워크플로우까지 한 번에 처리할 수 있도록 구현했습니다.

---

## 🛠 사용한 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, React Router, Axios |
| 백엔드 | FastAPI, SQLAlchemy, PostgreSQL |
| AI | Claude API (Tool Use로 구조화된 JSON 출력) |
| 알림 | Slack Incoming Webhook |
| 인프라 | AWS EC2 (t3.micro), Vercel |
| CI/CD | GitHub Actions + AWS SSM |
| 터널 | ngrok (고정 도메인) |

---

## ⚡ 주요 기능

- **문서 업로드** — PDF, DOCX, PPTX, TXT 지원 (최대 10MB, 프론트·백엔드 모두 검증)
- **AI 자동 분류** — Claude가 문서 유형·요약·키워드·신뢰도·판단 근거 출력
- **Slack 알림** — 분석 완료 시 해당 부서 채널에 알림 (승인/반려/보류 버튼 포함)
- **신뢰도 임계값** — 낮은 신뢰도 문서는 관리자 채널로 자동 분리
- **승인 워크플로우** — Slack 버튼 또는 웹 대시보드에서 처리 가능
- **재분류** — 반려·보류 시 관리자가 드롭다운으로 다른 부서에 재배분
- **자동 삭제** — 승인된 문서 30일 후 자동 삭제 (APScheduler)
- **모바일 대응** — 스마트폰에서도 조작 가능한 반응형 레이아웃

---

## 💡 고심한 부분

**① Slack 버튼 5개 제한 돌파**
Slack의 actions 블록은 버튼 최대 5개 제한이 있습니다.
부서 수가 늘어날 경우를 대비해 재분류 UI를 `static_select` 드롭다운으로 교체해 제한을 우회했습니다.

**② 재분류 무한 루프 방지**
반려 → 재분류 → 재반려 → 재분류… 루프가 발생할 수 있는 구조였습니다.
승인 이력 테이블에서 "재분류 여부"를 체크해 동일 문서에 대한 이중 전송을 차단했습니다.

**③ CI/CD SSH 포트 문제**
학교·기업 네트워크에서 포트 22(SSH) 아웃바운드가 차단되어
GitHub Actions에서 SSH 배포가 실패했습니다.
AWS SSM Session Manager로 전환해 포트에 의존하지 않는 배포를 구현했습니다.

**④ Claude API 응답 구조화**
일반 텍스트 응답은 JSON 파싱이 불안정해질 수 있어,
`tool_choice`를 강제 지정해 `classify_document` 툴 호출을 필수로 만들어
항상 구조화된 JSON을 받을 수 있도록 했습니다.

**⑤ 모바일 레이아웃**
고정 너비 사이드바가 스마트폰 화면을 압박하는 문제를
`useIsMobile` 훅으로 768px 기준 분기 처리하고, 모바일에서는 하단 탭바 방식으로 전환했습니다.

---

## 📁 프로젝트 구조

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

</details>
