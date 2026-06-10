import type { CalculatorInputs } from '../types'
import { calcTotalQuantity } from './liquidation/common'

export type CalculatorInputPatch = Partial<CalculatorInputs> & {
  /** 시나리오 가격 blur 확정 */
  commitScenarioPrice?: number
  /** 현재가 blur 확정 (단일 종목 ON) */
  commitCurrentPrice?: number
  /** 현재가 스테퍼 ±1틱 */
  tickCurrentPrice?: 1 | -1
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

/** 기준 현재가 → newPrice 이동 후 롤링 갱신 */
export function applyPriceMove(
  prev: CalculatorInputs,
  newPrice: number,
): Partial<CalculatorInputs> | null {
  const currentPrice = prev.currentPrice
  const accountEval = prev.accountEval
  if (currentPrice == null || accountEval == null) return null

  if (newPrice === currentPrice) {
    return { currentPrice: newPrice, scenarioPrice: undefined }
  }

  const pnl = calcPnlDelta(prev, newPrice - currentPrice)
  return {
    accountEval: accountEval + pnl,
    currentPrice: newPrice,
    scenarioPrice: undefined,
    evalSnapshotSide: prev.positionSide,
  }
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

/** 단일 종목 MTM 연동 시 입력 패치 보정 */
export function applyInputPatch(
  prev: CalculatorInputs,
  patch: CalculatorInputPatch,
): CalculatorInputs {
  const {
    commitScenarioPrice,
    commitCurrentPrice,
    tickCurrentPrice,
    ...inputPatch
  } = patch

  if (tickCurrentPrice != null) {
    const direction = tickCurrentPrice === 1 ? 1 : -1
    const base = { ...prev, ...inputPatch }
    const moved = applyTickMove(base, direction)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (commitScenarioPrice != null) {
    const base = { ...prev, ...inputPatch }
    const moved = applyPriceMove(base, commitScenarioPrice)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (commitCurrentPrice != null) {
    const base = { ...prev, ...inputPatch }
    const moved = applyPriceMove(base, commitCurrentPrice)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (patch.singleInstrument === false) {
    return {
      ...prev,
      ...inputPatch,
      singleInstrument: false,
      scenarioPrice: undefined,
      tickSize: undefined,
    }
  }

  const next = { ...prev, ...inputPatch }

  if (next.singleInstrument && inputPatch.currentPrice !== undefined) {
    const { currentPrice: _ignored, ...rest } = inputPatch
    return { ...prev, ...rest }
  }

  return next
}
