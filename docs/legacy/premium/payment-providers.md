# 결제 인프라

## 1차 선택: Stripe

- **Stripe Checkout** — 구독 결제 페이지를 Stripe가 호스팅. 카드 등록 → 즉시 Pro 활성화 흐름에 최적.
- **Stripe Customer Portal** — 구독 취소·카드 변경·영수증을 Stripe UI로 처리 (자체 구현 부담 감소).
- **Webhook** (`checkout.session.completed`, `customer.subscription.updated/deleted`) — Supabase `subscriptions` 테이블 동기화.
- 한국 신용·체크카드 지원. 해외 사용자(EN locale)에도 동일 스택 사용 가능.

## 대안: Lemon Squeezy

| 항목 | Stripe | Lemon Squeezy |
|------|--------|---------------|
| 역할 | 결제 인프라 (직접 판매자) | Merchant of Record (판매·세금·환불 대행) |
| 세금/VAT | 판매자(본인) 처리 | Lemon Squeezy가 처리 |
| 수수료 | ~2.9% + 고정 (한국 카드 추가 수수료 있음) | ~5% + 결제 수수료 |
| 적합 시점 | 지금 (개발자 친화, 문서 풍부) | 해외 매출 커지고 세금 부담 커질 때 전환 검토 |

## Lemon Squeezy 전환 트리거 (나중에 검토)

- 월 해외 결제 건수 증가
- VAT/세금 신고 부담
- 단일 대시보드에서 환불·영수증 통합 관리 필요

## 국내 PG (참고)

한국 사용자 비중이 매우 높고 카카오페이·네이버페이가 필수일 경우 토스페이먼츠·포트원 검토. 현재 계획은 Stripe 우선.
