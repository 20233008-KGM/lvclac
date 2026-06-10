# 광고 제거 (Pro)

> **상태: 예정** — Free는 6슬롯. Pro·Lifetime·Ad-Free 플랜은 미노출.

## 동작

| 구분 | 광고 |
|------|------|
| Free | 6슬롯 (`PageShell` / `AdSlot`) |
| Pro · Lifetime · Ad-Free | 슬롯 **미렌더** |

Free 슬롯 구성·AdSense 운영: [../ads-management.md](../ads-management.md)

## 구현

```ts
// user.isPro === true → PageShell / AdSlot 스킵
```

| 영역 | 파일 |
|------|------|
| 가드 | `src/components/PageShell.tsx`, `src/components/AdSlot.tsx` |
| 상태 | `src/context/AuthContext.tsx` — `isPro` |
| 결제 | [implementation.md](./implementation.md) |

## 체크리스트

- [ ] `isPro` 시 AdSlot 미렌더
- [ ] Ad-Free 단독 플랜도 동일 가드 (플랜별 플래그 또는 `isPro` / `isAdFree`)

## 관련

- [plans.md](./plans.md) — Ad-Free / Pro / Lifetime
- [features.md](./features.md) — Pro 기능 목록
- [../login-integration.md](../login-integration.md) — `isPro` 통합
