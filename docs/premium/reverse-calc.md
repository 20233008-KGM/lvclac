# 역산 시스템 (Pro)

> **상태: 계획 확정 · 미구현** — Phase 2. 논의: 2026-06-09

## 배경

**「이 청산 여유·레버리지를 맞추려면 몇 계약을 정리해야 하지?」** — 목표 지표를 주문 후 열에 입력하면 **정리 계약수**를 역산하고 `orderContracts`에 **음수로 자동 반영**합니다.

기본 청산가 계산은 Free ([features.md](./features.md) 원칙).

---

## UI (최소 변경)

**주문** 패널 `ResultSheet` — 「주문 후」 **상단 4행**만 Pro에서 입력 가능.

| 행 | 지표 | 주문 후 (Pro) |
|----|------|---------------|
| 1 | 청산가격 | 목표값 입력 |
| 2 | 청산 여유(%) | 목표값 입력 |
| 3 | 하락/상승폭 | 목표값 입력 |
| 4 | 레버리지 | 목표값 입력 |
| 5~ | 증거금 | 정산 결과 (읽기 전용) |

좌측 입력·상단 「결과」 패널은 변경 없음.

## 사용자 흐름

1. 기존 입력 확정
2. Pro: 주문 후 4개 중 **하나**에 목표 입력 (마지막 편집 필드 기준)
3. 역산 → `orderContracts` 음수 자동
4. `calculateOrder`로 주문 후 열 갱신

스테퍼로 `orderContracts` 직접 변경 시 역산 모드 해제.

---

## 레버리지

```
레버리지 = 약정가치 ÷ 계좌 평가금액
```

[`src/calc/leverage.ts`](../../src/calc/leverage.ts) 와 동일.

---

## 역산 수식 (`src/calc/reverse.ts`)

### A. 청산가·버퍼 (행 1~3)

```
delta_target = |currentPrice − liq_target|  (또는 여유%/하락·상승폭)
Ct = accountEval / (perContractMaintenance + delta_target × pointValue)
```

### B. 레버리지 (행 4)

```
Ct = targetLeverage × accountEval / (contractAmount × contractMultiplier)
```

목표 레버리지 > 현재 → 추가 매수 필요 → 역산 불가.

### C. 정리 계약수

```
closeContracts = max(0, currentContracts − floor(Ct))
orderContracts = −closeContracts
```

---

## Pro 게이트

[plans.md](./plans.md) · [implementation.md](./implementation.md) — `isPro` 후 `editableAfterRowCount={4}`.

## 구현 체크리스트

| 파일 | 작업 |
|------|------|
| `src/calc/reverse.ts` | `solveCloseContracts` |
| `src/calc/reverse.test.ts` | round-trip |
| `src/components/ResultPanel.tsx` | 주문 후 4셀 입력 |
| i18n | 역산·잠금 문구 |

## 관련

- [features.md](./features.md)
- [../calculator-fields.md](../calculator-fields.md)
