import type { CalculatorInputs, PositionSide } from '../types'
import { calcTotalQuantity } from './liquidation/common'

export type CalculatorInputPatch = Partial<CalculatorInputs> & {
  /** 시나리오 가격 Enter — 시나리오 모드 진입 (손익·현재가 유지) */
  commitScenarioPrice?: number
  /** 현재가 blur 확정 */
  commitCurrentPrice?: number
  /** 현재가 스테퍼 ±1틱 */
  tickCurrentPrice?: 1 | -1
  /** 시나리오 가격 삭제 및 적용 전 상태 복원 */
  clearScenario?: true
  /** 시나리오 → 현재가 롤링 + 손익 반영 + 시나리오 모드 종료 */
  applyScenarioToMark?: number
  /** 손익 반영 취소 — 시나리오 미리보기 복원 */
  undoScenarioApply?: true
}

export interface ScenarioRevertSnapshot {
  accountEval: number
  mtmPriceAnchor?: number
  evalSnapshotSide?: PositionSide
}

/** 가격 변화량에 대한 손익 — Key_Formula Q = N × M */
export function calcPnlDelta(inputs: CalculatorInputs, priceDelta: number): number {
  const contracts = inputs.contracts
  if (contracts == null || contracts <= 0) return 0
  const Q = calcTotalQuantity(inputs, contracts)
  if (Q == null) return 0
  const delta = priceDelta * Q
  return inputs.positionSide === 'long' ? delta : -delta
}

/** 기준 현재가 → newPrice 이동 후 롤링 갱신 (현재가 스테퍼용) */
export function applyPriceMove(
  prev: CalculatorInputs,
  newPrice: number,
): Partial<CalculatorInputs> | null {
  const currentPrice = prev.currentPrice
  const accountEval = prev.accountEval
  if (currentPrice == null || accountEval == null) return null

  if (newPrice === currentPrice) {
    return { currentPrice: newPrice }
  }

  const pnl = calcPnlDelta(prev, newPrice - currentPrice)
  return {
    accountEval: accountEval + pnl,
    currentPrice: newPrice,
    evalSnapshotSide: prev.positionSide,
    mtmPriceAnchor: newPrice,
  }
}

/** 시나리오 모드 진입 — 손익·현재가 유지, 결과만 시나리오 가격 기준 미리보기 */
export function enterScenarioPreview(
  prev: CalculatorInputs,
  scenarioPrice: number,
): Partial<CalculatorInputs> | null {
  const accountEval = prev.accountEval
  const currentPrice = prev.currentPrice
  if (accountEval == null || currentPrice == null) return null

  return {
    scenarioPrice,
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: {
      accountEval,
      mtmPriceAnchor: prev.mtmPriceAnchor,
      evalSnapshotSide: prev.evalSnapshotSide,
    },
    evalSnapshotSide: prev.positionSide,
  }
}

/** 시나리오 가격 Enter 확정 후 — 결과·UI 시나리오 모드 */
export function isScenarioModeActive(inputs: CalculatorInputs): boolean {
  return inputs.scenarioRevertSnapshot != null
}

/** 시나리오 가격을 현재가로 확정 — 손익 반영 후 시나리오 모드 종료 */
export function applyScenarioToMarkPrice(
  prev: CalculatorInputs,
  targetPrice: number,
): Partial<CalculatorInputs> | null {
  const currentPrice = prev.currentPrice
  const accountEval = prev.accountEval
  if (currentPrice == null || accountEval == null) return null

  let nextEquity = accountEval

  if (targetPrice !== currentPrice) {
    nextEquity += calcPnlDelta(prev, targetPrice - currentPrice)
  }

  return {
    accountEval: nextEquity,
    currentPrice: targetPrice,
    mtmPriceAnchor: targetPrice,
    scenarioPrice: undefined,
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: undefined,
    evalSnapshotSide: prev.positionSide,
  }
}

export function hasScenarioApplyUndo(inputs: CalculatorInputs): boolean {
  return inputs.scenarioApplyUndoSnapshot != null
}

export function revertScenarioApply(prev: CalculatorInputs): Partial<CalculatorInputs> | null {
  const snap = prev.scenarioApplyUndoSnapshot
  if (!snap) return null

  return {
    accountEval: snap.accountEval,
    currentPrice: snap.currentPrice,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
    scenarioPrice: snap.scenarioPrice,
    scenarioRevertSnapshot: snap.scenarioRevertSnapshot,
    scenarioAppliedPrice: undefined,
    scenarioApplyUndoSnapshot: undefined,
  }
}

export function revertScenarioState(prev: CalculatorInputs): Partial<CalculatorInputs> {
  const snap = prev.scenarioRevertSnapshot
  if (!snap) {
    return {
      scenarioAppliedPrice: undefined,
      scenarioRevertSnapshot: undefined,
    }
  }
  return {
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: undefined,
    accountEval: snap.accountEval,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
  }
}

/** 결과 증거금·레버리지에 쓸 계좌 평가금액 */
export function resolveMarginEquity(inputs: CalculatorInputs): number {
  return inputs.accountEval ?? 0
}

/** 시나리오 모드 미리보기 평가금액 — 스냅샷 + 미실현 손익 (저장값은 유지) */
export function resolveScenarioPreviewEquity(inputs: CalculatorInputs): number | null {
  if (!isScenarioModeActive(inputs)) return null

  const scenarioMark = inputs.scenarioAppliedPrice ?? inputs.scenarioPrice
  const currentPrice = inputs.currentPrice
  const snap = inputs.scenarioRevertSnapshot
  if (scenarioMark == null || currentPrice == null || snap == null) return null

  if (scenarioMark === currentPrice) return snap.accountEval
  return snap.accountEval + calcPnlDelta(inputs, scenarioMark - currentPrice)
}

/**
 * 결과·주문 계산용 입력.
 * 시나리오 모드: 시나리오 가격·미실현 손익 반영 평가금액으로 미리보기.
 * 입력란에 저장된 currentPrice·accountEval은 「반영」 전까지 유지된다.
 */
export function resolveEvaluationInputs(inputs: CalculatorInputs): CalculatorInputs {
  if (!isScenarioModeActive(inputs)) return inputs

  const scenarioMark = inputs.scenarioAppliedPrice ?? inputs.scenarioPrice
  const currentPrice = inputs.currentPrice
  if (scenarioMark == null || currentPrice == null) return inputs

  const previewEquity = resolveScenarioPreviewEquity(inputs)
  if (previewEquity == null) return inputs

  if (scenarioMark === currentPrice && previewEquity === inputs.accountEval) {
    return inputs
  }

  return {
    ...inputs,
    currentPrice: scenarioMark,
    accountEval: previewEquity,
  }
}

/**
 * 유지·위탁 증거금 명목 산출용 — 시나리오 모드에서는 진입 시점 입력(실제 현재가) 기준 고정.
 * 약정금액·비율·1계약당 증거금이 시나리오 가격으로 흔들리지 않게 한다.
 */
export function resolveMarginCalculationInputs(inputs: CalculatorInputs): CalculatorInputs {
  if (!isScenarioModeActive(inputs)) return inputs
  return inputs
}

/** 현재가 ±1틱 MTM 이동 */
export function applyTickMove(
  prev: CalculatorInputs,
  direction: 1 | -1,
): Partial<CalculatorInputs> | null {
  const tickSize = prev.tickSize
  const currentPrice = prev.currentPrice
  if (tickSize == null || tickSize <= 0 || currentPrice == null) return null
  return applyPriceMove(prev, currentPrice + direction * tickSize)
}

/** 시나리오·가격 입력 패치 보정 */
export function applyInputPatch(
  prev: CalculatorInputs,
  patch: CalculatorInputPatch,
): CalculatorInputs {
  const {
    commitScenarioPrice,
    commitCurrentPrice,
    tickCurrentPrice,
    clearScenario,
    applyScenarioToMark,
    undoScenarioApply,
    ...inputPatch
  } = patch

  const scenarioLocked = isScenarioModeActive(prev)

  if (undoScenarioApply) {
    const undone = revertScenarioApply(prev)
    if (undone) return { ...prev, ...inputPatch, ...undone }
    return { ...prev, ...inputPatch }
  }

  if (applyScenarioToMark != null) {
    const base = { ...prev, ...inputPatch }
    const rolled = applyScenarioToMarkPrice(base, applyScenarioToMark)
    if (rolled) {
      const undoSnapshot =
        isScenarioModeActive(base) &&
        base.accountEval != null &&
        base.currentPrice != null &&
        base.scenarioRevertSnapshot != null
          ? {
              accountEval: base.accountEval,
              currentPrice: base.currentPrice,
              mtmPriceAnchor: base.mtmPriceAnchor,
              evalSnapshotSide: base.evalSnapshotSide,
              scenarioPrice: applyScenarioToMark,
              scenarioRevertSnapshot: base.scenarioRevertSnapshot,
            }
          : undefined
      return { ...base, ...rolled, scenarioApplyUndoSnapshot: undoSnapshot }
    }
    return base
  }

  if (clearScenario) {
    return { ...prev, ...inputPatch, ...revertScenarioState(prev) }
  }

  if (scenarioLocked && tickCurrentPrice != null) {
    return prev
  }

  if (scenarioLocked && commitCurrentPrice != null) {
    return prev
  }

  const sanitizedPatch = scenarioLocked
    ? 'scenarioPrice' in inputPatch
      ? { scenarioPrice: inputPatch.scenarioPrice }
      : {}
    : inputPatch

  if (tickCurrentPrice != null) {
    const direction = tickCurrentPrice === 1 ? 1 : -1
    const base = { ...prev, ...sanitizedPatch }
    const moved = applyTickMove(base, direction)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (commitScenarioPrice != null) {
    const base = { ...prev, ...sanitizedPatch }
    const entered = enterScenarioPreview(base, commitScenarioPrice)
    if (entered) return { ...base, ...entered }
    return base
  }

  if (commitCurrentPrice != null) {
    const base = { ...prev, ...sanitizedPatch }
    const moved = applyPriceMove(base, commitCurrentPrice)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (sanitizedPatch.accountEval !== undefined) {
    return {
      ...prev,
      ...sanitizedPatch,
      mtmPriceAnchor: inputPatch.currentPrice ?? prev.currentPrice,
    }
  }

  return { ...prev, ...sanitizedPatch }
}
