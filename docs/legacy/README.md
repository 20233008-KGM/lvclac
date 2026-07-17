# 레거시 문서

> **이 폴더(`docs/legacy/`) 전체는 과거에 만든 정책 문서, 기능 초안, 자동화 개발 시스템(페르소나·AutoCorp 등) 보존본이다.**
>
> **현재 규칙으로 따르지 말고, 맥락 파악용으로만 참고한다.**
>
> 현재 기준 문서:
> - [`lvclac-project-memory.md`](C:/Users/rlarb/Documents/lvclac-project-memory.md) — 장기 메모리
> - [`docs/product-core-design.md`](../product-core-design.md) — 제품 원칙
> - [`docs/launch-schedule.md`](../launch-schedule.md) — 런칭 일정
> - [`docs/bugs.md`](../bugs.md) — 알려진 버그

## 하위 폴더

| 경로 | 내용 |
|------|------|
| [automation-retired/](./automation-retired/) | 퇴역 페르소나 자동화, AutoCorp/Codex 워크플로, 업무흐름 다이어그램 |
| [premium/](./premium/) | 과거 Pro·결제 기능 초안 |
| (루트 MD 파일들) | 계산기 필드, 로그인 연동, AdSense 등 과거 기능 문서 |

## 계산·검증

| 문서 | 내용 |
|------|------|
| [calculator-fields.md](./calculator-fields.md) | 입력 필드·증거금·청산가 |
| [test-cases.md](./test-cases.md) | 롱/숏 × 증거금 3입력 × 전체기능 케이스 매트릭스 |
| [scenario-test-report.md](./scenario-test-report.md) | 시나리오 검증 보고서 |

## UI·문서

| 문서 | 내용 |
|------|------|
| [ko-tooltip-guide.md](./ko-tooltip-guide.md) | 한국어 툴팁 작성 원칙·마크업·안티패턴 |

## 운영·연동

| 문서 | 내용 |
|------|------|
| [login-integration.md](./login-integration.md) | 로그인·세트·`isPro` 통합 정책 |
| [ads-management.md](./ads-management.md) | AdSense·GA4 슬롯 운영 (Free) |

## 유료 결제 · Pro 기능 (`premium/`)

| 문서 | 내용 |
|------|------|
| [premium/README.md](./premium/README.md) | **목차·요약** |
| [premium/features.md](./premium/features.md) | Pro 기능 목록·로드맵 |
| [premium/input-sets.md](./premium/input-sets.md) | 숫자 세트 저장 |
| [premium/ad-free.md](./premium/ad-free.md) | 광고 제거 |
| [premium/reverse-calc.md](./premium/reverse-calc.md) | 역산 시스템 |
| [premium/plans.md](./premium/plans.md) | 플랜·혜택 |
| [premium/pricing.md](./premium/pricing.md) | 가격·Stripe |
| [premium/payment-providers.md](./premium/payment-providers.md) | 결제 인프라 |
| [premium/implementation.md](./premium/implementation.md) | Checkout·Webhook·`isPro` |

## 가격 요약

| 플랜 | USD |
|------|-----|
| Pro 월간 | **$5/월** |
| Pro 연간 | **$48/년** |
| Lifetime | **$79** (첫 출시 한정) |

→ [premium/pricing.md](./premium/pricing.md)
