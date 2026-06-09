# 레버리지 계산기 Pro — 프리미엄 구독 계획

Stripe 기반 유료 구독(광고 제거 + 파워 기능) 설계 문서입니다.

## 문서 목차

| 문서 | 내용 |
|------|------|
| [features.md](./features.md) | Free vs Pro 기능 경계 |
| [pricing.md](./pricing.md) | 가격 전략·Stripe Price 설정 |
| [payment-providers.md](./payment-providers.md) | Stripe (1차) + Lemon Squeezy (대안) |
| [implementation.md](./implementation.md) | Phase별 기술 로드맵·스키마·API |

## 요약

- **결제:** Stripe (Checkout + Customer Portal + Webhook)
- **대안:** Lemon Squeezy — 해외 매출·세금 부담 커질 때 검토
- **가격:** Pro 월 **$5** / 연 **$48** · Lifetime **$79** (**첫 출시 한정**, 이후 구독만) · 7일 무료 체험
- **핵심 원칙:** 기본 청산가 계산은 무료 유지. Pro는 반복 사용 편의 + 리스크 관리 + 깔끔한 UI.

기존 앱 구축 계획은 프로젝트 루트의 [plan.md](../../plan.md)를 참고하세요.
