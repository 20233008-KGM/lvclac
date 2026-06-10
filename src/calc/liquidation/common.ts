import type { CalculatorInputs } from '../../types'
import { effectiveAccountEval } from '../accountEval'
import { hasDirectMaintenance } from '../margins'

/** 청산가 계산 입력 — E0, C0, Q, M(C0) */
export interface LiquidationParams {
  /** 현재 계좌 평가금액 E0 */
  equity: number
  /** 현재가 C0 */
  currentPrice: number
  /** 총 민감도 Q = N × 계약승수 (Key_Formula, M=1 포함) */
  totalQuantity: number
  /** 현재가 C0에서의 유지증거금 M(C0) = C0 × Q × R (또는 직접 입력) */
  maintenanceAtCurrent: number
}

/** Q = N × M — N=보유계약수, M=계약승수(미입력·1 포함) */
export function calcTotalQuantity(
  inputs: Pick<CalculatorInputs, 'contractMultiplier'>,
  contracts: number,
): number | null {
  if (contracts <= 0) return null
  const multiplier = inputs.contractMultiplier ?? 1
  if (multiplier <= 0) return null
  return contracts * multiplier
}

/** C0에서의 유지증거금 — M(C0) = C0 × Q × R 또는 직접 입력(계약수 비례) */
export function resolveMaintenanceAtCurrent(
  inputs: CalculatorInputs,
  contracts: number,
  totalQuantity: number,
): number | null {
  const currentPrice = inputs.currentPrice
  if (currentPrice == null || currentPrice <= 0) return null

  if (hasDirectMaintenance(inputs)) {
    const base = inputs.maintenanceMargin!
    const baseContracts = inputs.contracts ?? 0
    if (baseContracts > 0 && contracts !== baseContracts) {
      return base * (contracts / baseContracts)
    }
    return base
  }

  const rate = inputs.maintenanceMarginRate
  if (rate == null) return null
  return currentPrice * totalQuantity * rate
}

export function buildLiquidationParams(
  inputs: CalculatorInputs,
  contracts: number,
): LiquidationParams | null {
  const currentPrice = inputs.currentPrice
  if (inputs.accountEval == null || currentPrice == null || contracts <= 0) return null

  const equity = effectiveAccountEval(inputs)

  const totalQuantity = calcTotalQuantity(inputs, contracts)
  if (totalQuantity == null) return null

  const maintenanceAtCurrent = resolveMaintenanceAtCurrent(
    inputs,
    contracts,
    totalQuantity,
  )
  if (maintenanceAtCurrent == null) return null

  return {
    equity,
    currentPrice,
    totalQuantity,
    maintenanceAtCurrent,
  }
}

export function calcToleranceRate(
  currentPrice: number,
  liquidationPrice: number | null,
  side: 'long' | 'short',
): number | null {
  if (liquidationPrice === null || currentPrice === 0) return null
  if (side === 'long') {
    return ((currentPrice - liquidationPrice) / currentPrice) * 100
  }
  return ((liquidationPrice - currentPrice) / currentPrice) * 100
}

/** 청산까지 허용 가격 변동폭 (롱: 하락폭, 숏: 상승폭) */
export function calcToleranceDelta(
  currentPrice: number,
  liquidationPrice: number | null,
  side: 'long' | 'short',
): number | null {
  if (liquidationPrice === null) return null
  return side === 'long'
    ? currentPrice - liquidationPrice
    : liquidationPrice - currentPrice
}

/** 가격 P에서의 유지증거금 — M(P) = M(C0) × P/C0 */
export function maintenanceAtPrice(
  maintenanceAtCurrent: number,
  price: number,
  currentPrice: number,
): number {
  return maintenanceAtCurrent * (price / currentPrice)
}

/** 롱: Equity(P) = E0 + (P-C0)×Q */
export function longEquityAtPrice(
  params: LiquidationParams,
  price: number,
): number {
  return params.equity + (price - params.currentPrice) * params.totalQuantity
}

/** 숏: Equity(P) = E0 - (P-C0)×Q */
export function shortEquityAtPrice(
  params: LiquidationParams,
  price: number,
): number {
  return params.equity - (price - params.currentPrice) * params.totalQuantity
}
