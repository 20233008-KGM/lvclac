# 로그인 통합관리

> **상태: 추가 예정**

로그인·세션·`isPro`를 하나의 정책으로 묶습니다.

## 현재 동작

| 항목 | 동작 |
|------|------|
| 비로그인 | 계산기 사용, 입력값 세션 단위 |
| 로그인 | 입력값 1세트 저장·복원 |
| Pro | 미연동 — [premium/plans.md](./premium/plans.md) |

## 통합 정책 (예정)

| 영역 | 문서 |
|------|------|
| 인증 | 본 문서 · `AuthContext` |
| 입력 세트 | [premium/input-sets.md](./premium/input-sets.md) |
| 광고 제거 | [premium/ad-free.md](./premium/ad-free.md) |
| 결제·플랜 | [premium/](./premium/README.md) |
| Pro 기능 | [premium/features.md](./premium/features.md) |

## `isPro` 분기

| 상태 | 세트 | 광고 | Pro 기능 |
|------|------|------|----------|
| 비로그인 | 0 | 6슬롯 | ✕ |
| 로그인 Free | 1 | 6슬롯 | ✕ |
| Pro | N+ | 제거 | ○ |

→ [premium/plans.md](./premium/plans.md)

## 구현 메모

- prefs → `sets[0]` 마이그레이션
- `isPro` + 세트 상한·광고 가드 중앙 정의

## 관련

- [premium/README.md](./premium/README.md)
- [ads-management.md](./ads-management.md) — AdSense 운영
- [plan.md](../plan.md)
