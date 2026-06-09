import type { CalcMessageCode } from '../i18n/calcMessages'
import type { CalculatorInputs, MaintenanceMarginSource, MarginAmounts } from '../types'
import { getPointValue } from './leverage'

/** 약정가치 = 약정금액 × 계약승수 × 총 계약수 (증권사 앱 약정금액 기준) */
export function calcContractNotional(
  contracts: number,
  contractAmount: number,
  contractMultiplier: number,
): number {
  return contracts * contractAmount * contractMultiplier
}

export function hasDirectMaintenance(inputs: CalculatorInputs): boolean {
  return inputs.maintenanceMargin != null && inputs.maintenanceMargin > 0
}

/** rate: 소수 비율 (예: 0.247) — 약정가치 기준 */
export function calcMarginFromNotional(notional: number, rate: number): number {
  return notional * rate
}

/**
 * 유지증거금 결정:
 * 1) 증권사 앱 직접 입력 우선 (주문 시뮬레이션 시 계약 수 비례 확장)
 * 2) 미입력 시 약정가치 × 유지증거금비율
 */
export function resolveMaintenanceMargin(
  inputs: CalculatorInputs,
  contracts: number,
): { amount: number; source: MaintenanceMarginSource } {
  if (hasDirectMaintenance(inputs)) {
    const base = inputs.maintenanceMargin!
    if (inputs.contracts > 0 && contracts !== inputs.contracts) {
      return { amount: base * (contracts / inputs.contracts), source: 'direct' }
    }
    return { amount: base, source: 'direct' }
  }

  if (contracts === 0) {
    return { amount: 0, source: 'rate' }
  }

  const notional = calcContractNotional(
    contracts,
    inputs.contractAmount,
    inputs.contractMultiplier,
  )
  return {
    amount: calcMarginFromNotional(notional, inputs.maintenanceMarginRate),
    source: 'rate',
  }
}

export function calcMargins(
  inputs: CalculatorInputs,
  contracts: number,
): { margins: MarginAmounts; pointValue: number } | null {
  const pointValue = getPointValue(
    inputs.contractAmount,
    inputs.contractMultiplier,
    inputs.currentPrice,
  )
  if (pointValue === null || contracts < 0) return null

  const contractNotional = calcContractNotional(
    contracts,
    inputs.contractAmount,
    inputs.contractMultiplier,
  )
  const { amount: maintenanceMargin, source: maintenanceMarginSource } =
    resolveMaintenanceMargin(inputs, contracts)
  const entrustedMargin = calcMarginFromNotional(
    contractNotional,
    inputs.entrustedMarginRate,
  )

  const perContractNotional =
    contracts > 0
      ? contractNotional / contracts
      : inputs.contractAmount * inputs.contractMultiplier

  const perContractMaintenance =
    contracts > 0 ? maintenanceMargin / contracts : 0

  return {
    pointValue,
    margins: {
      contractNotional,
      maintenanceMargin,
      maintenanceMarginSource,
      entrustedMargin,
      availableMargin: entrustedMargin - maintenanceMargin,
      perContractMaintenance,
      perContractEntrusted: perContractNotional * inputs.entrustedMarginRate,
    },
  }
}

export function validateMarginRates(inputs: CalculatorInputs): CalcMessageCode | null {
  if (inputs.maintenanceMarginRate > inputs.entrustedMarginRate) {
    return 'maintenance_rate_exceeds_entrusted'
  }
  return null
}

export function validateLiquidationInputs(
  accountEval: number,
  maintenanceMargin: number,
  contracts: number,
): CalcMessageCode | null {
  if (contracts === 0) return 'contracts_zero'
  if (maintenanceMargin >= accountEval) {
    return 'maintenance_exceeds_equity'
  }
  return null
}
