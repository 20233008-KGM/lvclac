# 플랜·혜택

## 플랜 비교

| 플랜 | 월간 | 연간 | 1회 | 광고 | 입력 세트 | Pro 기능 |
|------|------|------|-----|------|-----------|----------|
| **Free** | $0 | — | — | 6슬롯 | 로그인 1세트 | ✕ |
| **Ad-Free** (선택) | $3 | $29 | — | 제거 | Free 동일 | ✕ |
| **Pro** | **$5** | **$48** | — | 제거 | N+ | ○ |
| **Lifetime** | — | — | **$79** | 제거 | Pro 동일 | ○ |

KRW · 가격 근거: [pricing.md](./pricing.md)

### Lifetime — 첫 출시 한정

v1 유료 오픈 ~ 첫 출시만 판매. 종료 후 Pro 구독만. Stripe 일회성 SKU.

## 혜택 → 기능 문서

| 혜택 | 문서 |
|------|------|
| 광고 제거 | [ad-free.md](./ad-free.md) |
| 입력 세트 | [input-sets.md](./input-sets.md) |
| 역산·프리셋·민감도 등 | [features.md](./features.md) |

## `isPro`

| `isPro` | 동작 |
|---------|------|
| `false` | Free — 광고, 세트 상한, 기능 잠금 |
| `true` | [features.md](./features.md) unlock |

구현: [implementation.md](./implementation.md) · 통합: [../login-integration.md](../login-integration.md)
