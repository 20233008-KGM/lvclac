# 입력값 세트 저장 (Pro)

> **상태: 1주차 MVP 구현됨** — 현재는 로그인 Free 사용자에게 로컬 저장 또는 클라우드 **1세트** 저장·복원·삭제 선택지를 제공한다. 다중 세트는 Pro 단계에서 확장한다.

## 목적

트레이더가 종목·포지션별로 자주 쓰는 숫자(계좌평가, 계약수, 증거금, 현재가 등)를 **세트** 단위로 저장·전환합니다.

## 현재 동작 (Free)

| 구분 | 저장 |
|------|------|
| 비로그인 | 저장 토글 ON 시 `localStorage`에 `CalculatorInputs` 저장 |
| 로그인 | 저장 토글 ON 시 `localStorage` 또는 Supabase `number_sets.inputs` **1세트** 저장 중 선택 |

코드: `src/context/AuthContext.tsx`, `src/context/CalculatorContext.tsx`, `src/db/numberSets.ts`

## Pro: 다중 세트 (예정)

| 구분 | 세트 수 |
|------|---------|
| 비로그인 | 0 |
| 로그인 Free | **1** (확장 검토 2) |
| **Pro** | **N+** — [plans.md](./plans.md) |

### 세트 예시

- **세트 1** — KOSPI200 롱
- **세트 2** — ES 숏
- **세트 3+** — Pro 전용

각 세트는 `CalculatorInputs` 전체 스냅샷을 담습니다.

## UI 목표

- 현재 MVP: 저장 토글, 로컬/클라우드 저장 위치 선택, 저장 상태 피드백, 로컬 draft → 클라우드 마이그레이션 버튼
- Pro 확장: 세트 선택·이름 지정·전환
- debounce 저장·`updateInputs` 패턴 유지

## 구현 메모

- 단일 로컬 draft → `number_sets` 최신 1세트 마이그레이션
- 로그인은 클라우드 저장의 전제일 뿐, 클라우드 저장을 강제하는 조건이 아니다.
- 저장 프리셋 다중 CRUD — [features.md](./features.md) Phase 2
- `isPro` 세트 상한 — [implementation.md](./implementation.md)

## 관련

- [features.md](./features.md) — Pro 기능 목록
- [plans.md](./plans.md) — 플랜별 세트 상한
- [../login-integration.md](../login-integration.md) — 통합 정책
