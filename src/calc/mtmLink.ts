import type { CalculatorInputs, PositionSide } from '../types'
import { calcTotalQuantity } from './liquidation/common'

export type CalculatorInputPatch = Partial<CalculatorInputs> & {
  /** 시나리오 가격 Enter 확정 — 손익만 반영, 현재가 유지 */
  commitScenarioPrice?: number
  /** 현재가 blur 확정 */
  commitCurrentPrice?: number
  /** 현재가 스테퍼 ±1틱 */
  tickCurrentPrice?: 1 | -1
  /** 시나리오 가격 삭제 및 적용 전 상태 복원 */
  clearScenario?: true
  /** 시나리오 → 현재가 롤링 + 손익 반영 + 시나리오 모드 종료 */
  applyScenarioToMark?: number
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

/** 시나리오 가격 확정 — 손익 반영, 현재가·시나리오 가격 유지 */
export function applyScenarioCommit(
  prev: CalculatorInputs,
  scenarioPrice: number,
): Partial<CalculatorInputs> | null {
  const accountEval = prev.accountEval
  const currentPrice = prev.currentPrice
  if (accountEval == null || currentPrice == null) return null

  const referencePrice = prev.scenarioAppliedPrice ?? currentPrice
  const snapshot: ScenarioRevertSnapshot =
    prev.scenarioRevertSnapshot ?? {
      accountEval: prev.accountEval,
      mtmPriceAnchor: prev.mtmPriceAnchor,
      evalSnapshotSide: prev.evalSnapshotSide,
    }

  const pnl = calcPnlDelta(prev, scenarioPrice - referencePrice)
  const nextAccountEval = accountEval + pnl

  return {
    ...prev,
    accountEval: nextAccountEval,
    scenarioPrice,
    scenarioAppliedPrice: scenarioPrice,
    scenarioRevertSnapshot: snapshot,
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

  if (prev.scenarioRevertSnapshot) {
    const applied = prev.scenarioAppliedPrice
    if (applied != null && targetPrice !== applied) {
      nextEquity += calcPnlDelta(prev, targetPrice - applied)
    }
  } else if (targetPrice !== currentPrice) {
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

export function revertScenarioState(prev: CalculatorInputs): Partial<CalculatorInputs> {
  const snap = prev.scenarioRevertSnapshot
  if (!snap) {
    return {
      scenarioPrice: undefined,
      scenarioAppliedPrice: undefined,
      scenarioRevertSnapshot: undefined,
    }
  }
  return {
    scenarioPrice: undefined,
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
    ...inputPatch
  } = patch

  if (applyScenarioToMark != null) {
    const base = { ...prev, ...inputPatch }
    const rolled = applyScenarioToMarkPrice(base, applyScenarioToMark)
    if (rolled) return { ...base, ...rolled }
    return base
  }

  if (clearScenario) {
    return { ...prev, ...inputPatch, ...revertScenarioState(prev) }
  }

  if (tickCurrentPrice != null) {
    const direction = tickCurrentPrice === 1 ? 1 : -1
    const base = { ...prev, ...inputPatch }
    const moved = applyTickMove(base, direction)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (commitScenarioPrice != null) {
    const committed = applyScenarioCommit({ ...prev, ...inputPatch }, commitScenarioPrice)
    if (committed) return committed as CalculatorInputs
    return { ...prev, ...inputPatch }
  }

  if (commitCurrentPrice != null) {
    const base = { ...prev, ...inputPatch }
    const moved = applyPriceMove(base, commitCurrentPrice)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (inputPatch.accountEval !== undefined) {
    return { ...prev, ...inputPatch, mtmPriceAnchor: inputPatch.currentPrice ?? prev.currentPrice }
  }

  return { ...prev, ...inputPatch }
}
