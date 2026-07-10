# 기술문서

기준일: 2026-07-09 목요일
프로젝트: `lvclac` 레버리지 계산기
목표: 앱 구조, 데이터 흐름, 결제 흐름, 운영 체크를 한 문서에서 찾을 수 있게 한다.

## 한 줄 설명

이 앱은 숫자를 넣으면 레버리지, 청산가, 증거금 상태를 계산해 주는 React 계산기다. 로그인하면 계산값과 계좌기록을 Supabase에 저장할 수 있고, Pro 결제는 Paddle Billing으로 연결하는 중이다.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| Frontend | React 19, TypeScript 6, Vite 8 |
| State | React Context (`AuthContext`, `CalculatorContext`, `LayoutContext`) |
| DB/Auth | Supabase Auth, Supabase Postgres, RLS |
| Billing | Paddle Billing, Paddle.js, Vercel Function style API |
| Tests | Vitest |
| Deploy target | Vercel 계열 서버리스 API 구조 |

## 주요 폴더

| 경로 | 역할 |
| --- | --- |
| `src/calc/` | 계산 공식. 가능하면 순수 함수로 유지한다. |
| `src/components/` | 화면 컴포넌트. 계산기, 마이페이지, 인증, 결제 UI가 있다. |
| `src/context/` | 앱 전체 상태. 로그인, 저장, 계산기 입력, undo/redo를 묶는다. |
| `src/db/` | Supabase client, 저장소 접근 함수, 결제 상태 조회. |
| `api/billing/` | 결제 checkout, portal, webhook API 진입점. |
| `scripts/billing/` | API에서 쓰는 순수 결제 로직과 테스트. |
| `supabase/migrations/` | DB 테이블, RLS, 인덱스 정의. |
| `docs/` | 현재 문서. `docs/legacy/`는 과거 참고 자료다. |
| `docs/company-incorporation-checklist.md` | 주식회사 설립, 사업자등록, Paddle live 정산 준비 체크리스트. |

## 앱 화면 흐름

`src/App.tsx`가 현재 URL을 보고 화면을 고른다.

| 경로 | 화면 |
| --- | --- |
| `/` | 계산기 본체 |
| `/my` | 마이페이지, 저장/계좌기록/결제 상태 |
| `/guide` | 사용 가이드 |
| `/formulas` | 계산식 설명 |
| `/about` | 소개 |
| feedback board path | 문의/피드백 보드 |

계산기 본체는 `InputPanel`과 `ResultPanel`이 중심이다. `CalculatorContext`가 입력값, 저장 상태, undo/redo, 저장 위치를 관리한다.

## 인증 흐름

담당 파일: `src/context/AuthContext.tsx`

1. 앱 시작 시 Supabase session을 읽는다.
2. session user가 있으면 `profiles` row를 보장한다.
3. 이메일 로그인, 이메일 가입, Google OAuth, 로그아웃을 제공한다.
4. `subscriptions`를 읽어 `isPro`를 계산한다.
5. `isPro`는 `active` 또는 `trialing` 구독이면 `true`다.

인증 메일(가입 확인 등)은 Supabase Auth가 발송한다. 프로덕션에서는 Supabase 기본 SMTP 대신 Resend 커스텀 SMTP와 repo 템플릿을 쓴다. 설정: [`docs/auth-email-setup.md`](./auth-email-setup.md), HTML: [`emails/supabase/`](../emails/supabase/).

보안 기준:

- 클라이언트는 Supabase anon key만 쓴다.
- service role key는 서버 API에서만 써야 한다.
- Google OAuth 비밀번호나 OTP는 에이전트가 입력하지 않는다.

## 계산기 저장 흐름

담당 파일: `src/context/CalculatorContext.tsx`, `src/db/numberSets.ts`

저장 위치는 두 가지다.

| 모드 | 저장 위치 | 설명 |
| --- | --- | --- |
| local | browser `localStorage` | 비로그인도 가능. 현재 기기에만 저장된다. |
| cloud | Supabase `number_sets` | 로그인 필요. 다른 기기에서 복원 가능하다. |

흐름:

1. 사용자가 저장 기능을 켠다.
2. `storageMode`가 `local`이면 `localStorage`에 저장한다.
3. `storageMode`가 `cloud`이면 `number_sets` 최신 row를 upsert처럼 갱신한다.
4. 저장을 끄면 화면은 기본값으로 돌릴 수 있고, 삭제는 사용자가 명확히 선택했을 때만 한다.
5. local draft를 cloud로 옮기는 마이그레이션 함수가 있다.

## 계좌기록 흐름

담당 파일: `src/db/accountRecords.ts`, `supabase/migrations/005_account_records.sql`

테이블:

| 테이블 | 저장 내용 |
| --- | --- |
| `order_history` | 주문 전/후 입력값, 주문 수량/가격, 주문 전/후 결과 |
| `account_snapshots` | 사용자가 저장한 계좌 스냅샷 |

주요 정책:

- `user_id = auth.uid()`인 row만 읽고 쓸 수 있다.
- 페이지네이션은 `limit + 1` 오버페치로 `hasMore`를 판단한다.
- 전체삭제는 명확한 확인 모달을 거쳐야 한다.

## 결제 흐름

담당 파일:

- Client: `src/db/billing.ts`, `src/components/billing/BillingPanel.tsx`
- Server: `api/billing/*.ts`, `scripts/billing/*.ts`
- DB: `supabase/migrations/006_subscriptions.sql`

Paddle Billing 흐름:

1. 사용자가 마이페이지에서 월간/연간 Pro를 누른다.
2. client가 `/api/billing/checkout`에 현재 Supabase access token과 plan을 보낸다.
3. server가 token으로 사용자를 확인하고 Paddle price id, custom data, success URL을 돌려준다.
4. client가 Paddle.js를 로드하고 overlay checkout을 연다.
5. Paddle webhook이 `/api/billing/webhook`으로 온다.
6. server가 `Paddle-Signature`를 HMAC으로 검증한다.
7. subscription event이면 `subscriptions` row를 `provider='paddle'`로 upsert한다.
8. client는 `subscriptions.status`를 읽어 Pro 권한을 보여준다.

Portal 흐름:

1. Pro 사용자가 결제 관리를 누른다.
2. `/api/billing/portal`이 Paddle customer portal session URL을 만든다.
3. client가 해당 URL로 이동한다.

주의할 점:

- webhook은 raw body가 필요하다.
- `PADDLE_WEBHOOK_SECRET`은 서버에만 있어야 한다.
- `PADDLE_API_KEY`도 서버에만 있어야 한다.
- `VITE_PADDLE_CLIENT_TOKEN`은 브라우저 공개용 client token이다.

## DB 테이블 요약

| 테이블 | 주요 컬럼 | 권한 |
| --- | --- | --- |
| `profiles` | `id`, `email`, `nickname`, `auto_save_order_history` | 본인 row 중심 |
| `number_sets` | `user_id`, `title`, `inputs`, `updated_at` | 본인만 CRUD |
| `subscriptions` | `user_id`, `provider`, `provider_customer_id`, `provider_subscription_id`, `status`, `current_period_end` | 본인 select만. 쓰기는 service role |
| `order_history` | `user_id`, `position_side`, `order_contracts`, `order_price`, `before_inputs`, `after_inputs` | 본인만 select/insert/delete |
| `account_snapshots` | `user_id`, `title`, `inputs`, `result` | 본인만 select/insert/delete |

## 환경변수

Server-only:

```text
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENV=sandbox
PADDLE_PRICE_MONTHLY=
PADDLE_PRICE_YEARLY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=
```

Client:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PADDLE_CLIENT_TOKEN=
VITE_PADDLE_ENV=sandbox
```

## 테스트 명령

전체 기본 확인:

```bash
npm run build
npm test
```

결제만 빠르게 확인:

```bash
npm.cmd test -- scripts/billing/billingHandlers.test.ts scripts/billing/subscriptionSync.test.ts
```

계산 로직만 빠르게 확인:

```bash
npm.cmd test -- src/calc/leverage.test.ts src/calc/mtmLink.test.ts
```

타입 체크:

```bash
npm.cmd exec tsc -- --noEmit
```

## MCP 운영 문서

| MCP | 사용할 일 | 주의 |
| --- | --- | --- |
| GitHub | 이슈, PR, 릴리스, 코드 리뷰 연결 | 현재 세션 직접 도구는 미노출 |
| Whimsical | Executive 로드맵 보드, 마인드맵, 업무흐름 그림 | repo 문서가 원본, Whimsical은 공유용 |
| Draw.io | 아키텍처 다이어그램 | 직접 도구 미노출 시 `.drawio` 파일로 관리 |
| Supabase | DB 상태, 마이그레이션, RLS 확인 | 스키마 변경 전 테이블 확인 필요 |
| Chrome | 외부 서비스 로그인/인증 화면 확인 | 비밀번호/OTP/카드번호는 사람이 직접 입력 |

현재 공유용 Whimsical 보드:

- Clean FigJam-style roadmap: https://whimsical.com/JvmREtRDDmZ2q9ZcZ55W4S
- Dependency FigJam-style roadmap: https://whimsical.com/6PL3wj3XNVeCAkb7WG3AdA
- Executive roadmap: https://whimsical.com/JU1pFkSaY2A1e6sZpNP77o
- Roadmap mind map: https://whimsical.com/UvsCUu9hNed1LxUkKwp9dq

## 배포 전 체크리스트

1. `npm run build` 통과
2. 결제 테스트: checkout 진입, 성공 복귀, webhook 반영, portal 이동
3. 로그인 테스트: 이메일, Google OAuth, 로그아웃, 세션 복원
4. 저장 테스트: local 저장, cloud 저장, local to cloud 이전
5. 계좌기록 테스트: 주문기록 자동저장, 스냅샷, 페이지네이션, 전체삭제
6. 보안 테스트: RLS, service role 노출 없음, webhook signature 실패 케이스
7. 운영 문서: 개인정보처리방침, 이용약관, 환불/해지, 문의 링크
8. GitHub: PR 설명, 검증 결과, 미검증 항목, 릴리스 태그

## 현재 남은 기술 위험

| 위험 | 영향 | 다음 조치 |
| --- | --- | --- |
| Paddle 실제 sandbox 결제 미완료 | Pro 권한이 실제로 반영되는지 확정 불가 | test 결제 1회 수행 |
| Paddle live business profile 미완료 | 실결제/정산 전환이 막힘 | 법인/사업자/정산 정보 확정 |
| GitHub/Draw.io MCP 미노출 | 자동 PR/다이어그램 생성이 막힘 | 브라우저 인증 후 도구 재확인 |
| 작업트리 변경이 많음 | 리뷰와 커밋 분리가 어려움 | 기능별 diff 정리 |
| 외부 계정 secret 필요 | 에이전트 단독 완료 불가 | 사람이 secret과 계정 인증 입력 |
