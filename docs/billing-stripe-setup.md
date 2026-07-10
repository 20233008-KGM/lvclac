# Paddle Billing 결제 연동 설정 가이드

이 문서는 현재 결제 구현 기준입니다. 파일명은 기존 링크 호환을 위해 유지하지만 내용은 Paddle Billing 기준입니다.

자세한 실행 체크리스트는 `docs/billing-paddle-setup.md`를 기준으로 본다. 주식회사 설립, 사업자등록, 정산 정보 준비는 `docs/company-incorporation-checklist.md`에서 관리한다.

## 1. Paddle 상품과 가격

1. Paddle Billing에서 구독 상품을 만들고 월간/연간 Price ID를 확인합니다.
2. 월간 Price ID는 `PADDLE_PRICE_MONTHLY`, 연간 Price ID는 `PADDLE_PRICE_YEARLY`에 넣습니다.
3. 클라이언트 token은 `VITE_PADDLE_CLIENT_TOKEN`에 넣고, 환경은 `VITE_PADDLE_ENV=sandbox|live`로 맞춥니다.

## 2. 서버 환경변수

서버 전용 값은 비 `VITE_` 접두사라 클라이언트 번들에 노출되지 않습니다.

| 변수 | 값 |
|------|----|
| `PADDLE_API_KEY` | Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | notification destination secret |
| `PADDLE_ENV` | `sandbox` 또는 `live` |
| `PADDLE_PRICE_MONTHLY` | 월간 `pri_...` |
| `PADDLE_PRICE_YEARLY` | 연간 `pri_...` |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `subscriptions` 동기화용 service role key |
| `APP_URL` | 결제 후 복귀 base URL |

## 3. Webhook

Paddle notification destination URL:

```text
https://<your-domain>/api/billing/webhook
```

로컬 dev 서버에서는 다음 URL로 받습니다.

```text
http://localhost:5173/api/billing/webhook
```

서명 검증은 `Paddle-Signature` 헤더와 raw body로 수행합니다. 핸들러는 `subscription.*` 이벤트를 받아 `subscriptions` 테이블에 `provider='paddle'`로 upsert합니다.

## 4. 사용자 흐름

```text
Free 사용자 -> /api/billing/checkout -> Paddle.js overlay checkout
결제 완료 -> /my?checkout=success
Paddle webhook -> subscriptions 동기화
active/trialing -> isPro=true

Pro 사용자 -> /api/billing/portal -> Paddle portal session URL로 이동
```

## 5. 확인 항목

- [ ] sandbox에서 Paddle.js overlay checkout이 열리는지 확인
- [ ] webhook `subscription.updated` 수신 후 `subscriptions.status=active` 반영 확인
- [ ] Pro 사용자 포털 버튼이 Paddle portal session URL로 이동하는지 확인
- [ ] live 전환 시 `PADDLE_ENV`, `VITE_PADDLE_ENV`, client token, API key를 모두 live 값으로 교체
