import type { CalculatorInputs } from '../types'
import { calcTotalQuantity } from './liquidation/common'

/** 앵커 가격 대비 newPrice에서의 연동 계좌 평가금액 — Key_Formula Q = N × M */
export function calcLinkedEquity(
  inputs: CalculatorInputs,
  newPrice: number,
): number | null {
  const anchorEquity = inputs.mtmAnchorEquity ?? inputs.accountEval
  const anchorPrice = inputs.mtmAnchorPrice ?? inputs.currentPrice
  if (anchorEquity == null || anchorPrice == null) return null

  const contracts = inputs.contracts
  if (contracts == null || contracts <= 0) return anchorEquity

  const Q = calcTotalQuantity(inputs, contracts)
  if (Q == null) return anchorEquity

  const delta = (newPrice - anchorPrice) * Q
  const pnl = inputs.positionSide === 'long' ? delta : -delta
  return anchorEquity + pnl
}

function mtmAnchorPatch(inputs: CalculatorInputs): Partial<CalculatorInputs> {
  return {
    mtmAnchorEquity: inputs.accountEval,
    mtmAnchorPrice: inputs.currentPrice,
  }
}

/** 단일 종목 MTM 연동 시 입력 패치 보정 */
export function applyInputPatch(
  prev: CalculatorInputs,
  patch: Partial<CalculatorInputs>,
): CalculatorInputs {
  if (patch.singleInstrument === true && !prev.singleInstrument) {
    return {
      ...prev,
      ...patch,
      ...mtmAnchorPatch({ ...prev, ...patch }),
    }
  }

  if (patch.singleInstrument === false) {
    return {
      ...prev,
      ...patch,
      mtmAnchorPrice: undefined,
      mtmAnchorEquity: undefined,
    }
  }

  const next = { ...prev, ...patch }
  if (!next.singleInstrument) return next

  if (
    patch.accountEval !== undefined &&
    patch.currentPrice === undefined &&
    patch.accountEval !== prev.accountEval
  ) {
    return {
      ...next,
      mtmAnchorEquity: patch.accountEval,
      mtmAnchorPrice: prev.currentPrice ?? next.currentPrice,
    }
  }

  if (
    patch.currentPrice !== undefined &&
    patch.currentPrice !== prev.currentPrice
  ) {
    const linked = calcLinkedEquity(prev, patch.currentPrice)
    if (linked != null) {
      return {
        ...next,
        accountEval: linked,
        evalSnapshotSide: next.positionSide,
      }
    }
  }

  const reanchorKeys = ['contracts', 'contractMultiplier', 'positionSide'] as const
  if (reanchorKeys.some((key) => patch[key] !== undefined && patch[key] !== prev[key])) {
    return { ...next, ...mtmAnchorPatch(next) }
  }

  return next
}
