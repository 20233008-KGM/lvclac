# 유료 결제 · Pro 기능

Stripe 결제 인프라와 **유료 잠금 해제 기능** 문서를 이 폴더에 모읍니다.

---

## 결제·플랜

| 문서 | 내용 |
|------|------|
| [plans.md](./plans.md) | 플랜·혜택 비교 · `isPro` |
| [pricing.md](./pricing.md) | 가격 전략 · Stripe · 환불 |
| [payment-providers.md](./payment-providers.md) | Stripe · Lemon Squeezy |
| [implementation.md](./implementation.md) | Checkout · Webhook · DB |

## Pro 기능 (유료)

| 문서 | 내용 |
|------|------|
| [features.md](./features.md) | **기능 목록** · Phase 로드맵 |
| [input-sets.md](./input-sets.md) | 숫자 세트 저장 |
| [ad-free.md](./ad-free.md) | 광고 제거 |
| [reverse-calc.md](./reverse-calc.md) | 역산 시스템 |

---

## 요약

| 항목 | 내용 |
|------|------|
| 결제 | Stripe Checkout + Portal + Webhook |
| Pro | 월 **$5** / 연 **$48** |
| Lifetime | **$79** — 첫 출시 한정 |
| 원칙 | 기본 계산 Free · 결제 = `isPro` unlock |

---

## 폴더 밖 (연동·운영)

| 문서 | 내용 |
|------|------|
| [../login-integration.md](../login-integration.md) | 로그인 · 세트 · `isPro` 통합 |
| [../ads-management.md](../ads-management.md) | AdSense · GA4 슬롯 운영 (Free) |

[plan.md](../../plan.md) — 앱 초기 구축
