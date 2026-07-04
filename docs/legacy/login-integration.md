# 로그인 통합관리

> **상태: 1주차 MVP 구현됨** — 이메일/Google 로그인 코드, 프로필 보정, 비로그인 localStorage 저장, 로그인 사용자 로컬/클라우드 저장 선택 흐름이 연결돼 있다. Google OAuth는 대시보드 Client ID/Secret 등록이 필요하다.

로그인·세션·`isPro`를 하나의 정책으로 묶습니다.

## 현재 동작

| 항목 | 동작 |
|------|------|
| 비로그인 | 계산기 사용, 저장 토글 ON 시 `localStorage`에 입력값 저장·복원 |
| 로그인 | 저장 토글 ON 시 `localStorage` 또는 `number_sets` 최신 1세트 중 사용자가 선택 |
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

- 로컬 draft → 클라우드 1세트 마이그레이션 버튼 제공
- 로그인 사용자의 기본 저장 선택권은 유지한다. 로그인했다고 클라우드 저장을 강제하지 않는다.
- 저장값 정규화: `src/utils/storedCalculatorInputs.ts`
- Supabase CRUD: `src/db/numberSets.ts`
- 상태 통합: `src/context/CalculatorContext.tsx`
- `isPro` + 세트 상한·광고 가드 중앙 정의

## 관련

- [premium/README.md](./premium/README.md)
- [ads-management.md](./ads-management.md) — AdSense 운영
- [plan.md](../plan.md)
