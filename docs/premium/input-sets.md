# 입력값 세트 저장 (Pro)

> **상태: 추가 예정** — 현재는 로그인 시 **1세트**만 자동 저장·복원합니다.

## 목적

트레이더가 종목·포지션별로 자주 쓰는 숫자(계좌평가, 계약수, 증거금, 현재가 등)를 **세트** 단위로 저장·전환합니다.

## 현재 동작 (Free)

| 구분 | 저장 |
|------|------|
| 비로그인 | 세션(브라우저) 단위, 영구 저장 없음 |
| 로그인 | `CalculatorInputs` **1세트** — `AuthContext` + `prefsRepo` |

코드: `src/context/AuthContext.tsx`, `src/db/`

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

- 세트 선택·이름 지정·전환
- debounce 저장·`updateInputs` 패턴 유지

## 구현 메모

- 단일 prefs → `sets[0]` 마이그레이션
- 저장 프리셋 CRUD · 클라우드 동기화 — [features.md](./features.md) Phase 2
- `isPro` 세트 상한 — [implementation.md](./implementation.md)

## 관련

- [features.md](./features.md) — Pro 기능 목록
- [plans.md](./plans.md) — 플랜별 세트 상한
- [../login-integration.md](../login-integration.md) — 통합 정책
