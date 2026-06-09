---
name: 레버리지 청산 계산기
overview: Vite + React + TypeScript 기반 청산 계산기와 간단한 로그인(아이디/비밀번호)을 구축합니다. DB는 아직 연결하지 않고 Repository 패턴으로 준비만 하며, 로그인 사용자별 최근 계산기 입력값을 저장·복원합니다.
todos:
  - id: scaffold-vite
    content: Vite + React + TypeScript 프로젝트 생성 및 npm run dev 확인
    status: completed
  - id: calc-module
    content: src/calc/leverage.ts — 청산가, 변동률, 추가매수, 매수후청산가 순수 함수 구현
    status: completed
  - id: auth-layer
    content: auth 검증·Repository 인터페이스·localStorage 어댑터(계정+입력값+세션)·Supabase 스텁·DB 마이그레이션 SQL
    status: completed
  - id: migrate-util
    content: (선택) migrateLocalToSupabase.ts — DB 연결 시 localStorage 데이터 일회성 이전 유틸
    status: completed
  - id: auth-ui
    content: LoginForm / RegisterForm — 아이디 중복검사, 비밀번호 7자 이상, AuthContext 연동
    status: completed
  - id: prefs-save
    content: 로그인 사용자별 계산기 입력값 debounce 저장 및 로그인 시 자동 복원
    status: completed
  - id: ui-panels
    content: InputPanel / ResultPanel 컴포넌트 및 App.tsx 상태 연결
    status: completed
  - id: responsive-ui
    content: 모바일/데스크톱 반응형 CSS — breakpoint, 터치 친화 입력, 로그인·계산기 레이아웃
    status: completed
  - id: styling-validation
    content: 카드형 UI 스타일, 숫자 포맷, 엣지케이스(0계약, 음수 여유증거금) 처리
    status: completed
  - id: manual-verify
    content: 계산·롱/숏·로그인/회원가입·입력값 저장/복원·모바일/데스크톱 반응형 수동 검증
    status: pending
---

# 레버리지 청산 계산기 웹앱

프로젝트 루트의 `plan.md` — 구현 계획 및 설계 문서입니다.

## 목표

입력값을 바꾸면 즉시 아래 결과가 갱신되는 단일 페이지 계산기.

| 입력 | 출력 |
|------|------|
| 계좌평가금액, 유지증거금, 총 계약수, 약정금액, 현재상품가격, 계약승수 | 청산가격 |
| 포지션 방향 (롱/숏) | 버틸 수 있는 하락율(롱) / 상승율(숏) |
| (선택) 개시증거금 1계약 | 추가 매수 가능 계약 수 |
| 추가 매수 계약 수 | 매수 후 청산가격 |
| — | 최대 매수 시뮬레이션 청산가격 |

## 실행

```bash
npm install
npm run dev    # 개발 서버
npm run build  # 프로덕션 빌드
```

## 로컬 저장 → DB 이전

- **지금**: 브라우저 `localStorage` (`leverage_users`, `leverage_prefs`, `leverage_session`)
- **나중**: `.env`에 `VITE_SUPABASE_URL` 설정 후 `supabaseAdapter` 구현

자세한 설계는 이 문서의 원본 계획을 참고하세요.
