# Stripe 결제 연동 — 설정 가이드

코드(구독 Checkout·Portal·Webhook·`isPro`)는 이미 구현돼 있습니다. 결제를 실제로 켜려면
아래 **외부 설정**만 하면 됩니다. 외국인 유저는 Stripe가 전 세계 카드/Apple Pay/Google Pay를
처리하므로 추가 작업 없이 동일 흐름으로 결제됩니다(EN locale 문구도 준비됨).

## 1. Stripe 계정·상품

1. [dashboard.stripe.com](https://dashboard.stripe.com) 가입 → **Test mode**에서 먼저 진행.
2. **Products** → 상품 1개(예: "Pro") 생성 후 가격 2개 추가(모두 Recurring):
   - 월간 $5 / month → 생성된 **Price ID**(`price_...`)를 `STRIPE_PRICE_MONTHLY`로.
   - 연간 $48 / year → **Price ID**를 `STRIPE_PRICE_YEARLY`로.
3. **Developers → API keys** → **Secret key**(`sk_test_...`)를 `STRIPE_SECRET_KEY`로.

## 2. Webhook 등록

1. **Developers → Webhooks → Add endpoint**
   - URL: `https://<your-domain>/api/stripe/webhook`
   - 이벤트 선택: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
2. 생성된 엔드포인트의 **Signing secret**(`whsec_...`)을 `STRIPE_WEBHOOK_SECRET`으로.

로컬 테스트는 Stripe CLI:
```
stripe listen --forward-to localhost:5173/api/stripe/webhook
```
출력되는 `whsec_...`를 로컬 `.env`의 `STRIPE_WEBHOOK_SECRET`에 넣으면 `npm run dev`에서도 동작합니다.

## 3. 환경변수 (`.env` 로컬 · Vercel 프로젝트 설정)

`.env.example`의 Stripe 블록 참고. 아래는 **서버 전용**(비-VITE 접두사 → 클라이언트 번들에 노출 안 됨):

| 변수 | 값 |
|------|----|
| `STRIPE_SECRET_KEY` | `sk_test_...` / 운영 `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_MONTHLY` | 월간 `price_...` |
| `STRIPE_PRICE_YEARLY` | 연간 `price_...` |
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키(웹훅이 RLS 우회로 동기화) |
| `APP_URL` | 결제 후 복귀 base URL(예: `https://your-domain.com`) |

> Vercel: **Settings → Environment Variables**에 동일하게 등록 후 재배포.

## 4. DB

`subscriptions` 테이블·RLS는 이미 존재합니다. 저장소 기록용 마이그레이션은
`supabase/migrations/006_subscriptions.sql`(idempotent). 다른 환경에 새로 적용할 때만 실행하면 됩니다.

## 흐름 요약

```
[사용자] 마이페이지 → 플랜 선택
   → POST /api/stripe/checkout (Supabase JWT)  → Stripe Checkout URL로 리다이렉트
   → 결제 완료 → /my?checkout=success 로 복귀
   → Stripe → POST /api/stripe/webhook → subscriptions 동기화(status=active)
   → isPro=true → Pro 잠금 해제 / 광고 제거(후속 작업)
[관리] Pro 사용자 → "구독 관리" → /api/stripe/portal → Stripe Customer Portal(취소·카드변경·영수증)
```

## 운영 전 체크

- [ ] Test mode에서 4242 4242 4242 4242 테스트 카드로 전체 흐름 확인
- [ ] 약관/개인정보에 유료·자동결제·환불 조항 추가(권장: 7일 전액 환불)
- [ ] Live mode 키로 교체 후 재배포
- [ ] Pro도 "참고용 시뮬레이션" 고지는 유지
