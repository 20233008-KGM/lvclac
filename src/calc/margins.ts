import type { CalcMessageCode } from '../i18n/calcMessages'
import type {
  CalculatorInputs,
  EntrustedMarginSource,
  MaintenanceMarginSource,
  MarginAmounts,
} from '../types'
import {
  calcIndexNotionalWon,
  isWonAccountIndexFieldMismatch,
} from './indexNotional'
import { resolveMarginEquity } from './mtmLink'
import { hasContractSpec, resolvePointValue } from './pointValue'

type NotionalInputs = Pick<
  CalculatorInputs,
  'accountEval' | 'contractAmount' | 'contractMultiplier' | 'currentPrice'
>

/** 주문·청산 계산 기준가 — 현재가 우선, 없으면 주문가 */
export function resolveReferencePrice(
  inputs: Pick<CalculatorInputs, 'currentPrice' | 'orderPrice'>,
): number | undefined {
  return inputs.currentPrice ?? inputs.orderPrice
}

/** 약정금액 없이 증거금률만 있을 때 명목: C0 × N × M (청산 엔진과 동일) */
export function calcRateBasedNotional(
  price: number,
  contracts: number,
  multiplier: number | undefined,
): number {
  return price * contracts * (multiplier ?? 1)
}

export function hasMarginSpec(inputs: CalculatorInputs): boolean {
  const hasMaintenance =
    hasDirectMaintenance(inputs) || inputs.maintenanceMarginRate != null
  const hasEntrusted = hasDirectEntrusted(inputs) || inputs.entrustedMarginRate != null
  return hasMaintenance && hasEntrusted
}

export function canUseRateBasedNotional(inputs: CalculatorInputs): boolean {
  return (
    !hasContractSpec(inputs) &&
    resolveReferencePrice(inputs) != null &&
    (inputs.maintenanceMarginRate != null || inputs.entrustedMarginRate != null)
  )
}

/** 주문 시뮬 — 보유 0·약정금액 없이도 증거금률+기준가만으로 가능 */
export function inputsReadyForOrderSim(inputs: CalculatorInputs): boolean {
  if (inputs.accountEval == null) return false
  if (!hasMarginSpec(inputs)) return false

  if (hasContractSpec(inputs)) {
    return inputs.currentPrice != null
  }

  return resolveReferencePrice(inputs) != null
}

/** 기준가가 주문가뿐일 때 청산·증거금 산출용 입력 */
export function withReferencePrice(inputs: CalculatorInputs): CalculatorInputs {
  const price = resolveReferencePrice(inputs)
  if (price == null || inputs.currentPrice != null) return inputs
  return { ...inputs, currentPrice: price }
}

export function calcPositionNotional(inputs: NotionalInputs, contracts: number): number {
  const multiplier = inputs.contractMultiplier ?? 1
  if (
    inputs.contractAmount != null &&
    inputs.currentPrice != null &&
    isWonAccountIndexFieldMismatch(inputs as CalculatorInputs)
  ) {
    return calcIndexNotionalWon(inputs.currentPrice, contracts, inputs.contractMultiplier)
  }
  // 약정금액 경로: price×pointValue와 동치이나 부동소수 취소 오차 방지
  if (inputs.contractAmount != null) {
    return contracts * inputs.contractAmount * multiplier
  }
  const pointValue = resolvePointValue(inputs)
  if (
    pointValue != null &&
    inputs.currentPrice != null &&
    inputs.currentPrice > 0
  ) {
    return contracts * inputs.currentPrice * pointValue
  }
  if (canUseRateBasedNotional(inputs as CalculatorInputs)) {
    return calcRateBasedNotional(
      resolveReferencePrice(inputs as CalculatorInputs)!,
      contracts,
      inputs.contractMultiplier,
    )
  }
  return 0
}

/** @deprecated calcPositionNotional 사용 권장 */
export function calcContractNotional(
  contracts: number | undefined,
  contractAmount: number | undefined,
  contractMultiplier: number | undefined,
): number {
  return (contracts ?? 0) * (contractAmount ?? 0) * (contractMultiplier ?? 0)
}

export function hasDirectMaintenance(inputs: CalculatorInputs): boolean {
  return inputs.maintenanceMargin != null && inputs.maintenanceMargin > 0
}

export function hasDirectEntrusted(inputs: CalculatorInputs): boolean {
  return inputs.entrustedMargin != null && inputs.entrustedMargin > 0
}

export function inputsReadyForEvaluate(inputs: CalculatorInputs): boolean {
  if (inputs.contracts == null || inputs.contracts <= 0) return false
  if (inputs.accountEval == null) return false
  if (!hasMarginSpec(inputs)) return false

  if (hasContractSpec(inputs)) {
    return inputs.currentPrice != null
  }

  return canUseRateBasedNotional(inputs)
}

/** rate: 소수 비율 (예: 0.247) — 포지션 명목가치 기준 */
export function calcMarginFromNotional(notional: number, rate: number): number {
  return notional * rate
}

function scaleDirectMargin(
  base: number,
  baseContracts: number,
  contracts: number,
): number {
  if (baseContracts > 0 && contracts !== baseContracts) {
    return base * (contracts / baseContracts)
  }
  return base
}

export function resolveMaintenanceMargin(
  inputs: CalculatorInputs,
  contracts: number,
): { amount: number; source: MaintenanceMarginSource } {
  if (hasDirectMaintenance(inputs)) {
    return {
      amount: scaleDirectMargin(
        inputs.maintenanceMargin!,
        inputs.contracts ?? 0,
        contracts,
      ),
      source: 'direct',
    }
  }

  if (contracts === 0) {
    return { amount: 0, source: 'rate' }
  }

  const notional = calcPositionNotional(inputs, contracts)
  return {
    amount: calcMarginFromNotional(notional, inputs.maintenanceMarginRate ?? 0),
    source: 'rate',
  }
}

export function resolveEntrustedMargin(
  inputs: CalculatorInputs,
  contracts: number,
): { amount: number; source: EntrustedMarginSource } {
  if (hasDirectEntrusted(inputs)) {
    return {
      amount: scaleDirectMargin(
        inputs.entrustedMargin!,
        inputs.contracts ?? 0,
        contracts,
      ),
      source: 'direct',
    }
  }

  if (contracts === 0) {
    return { amount: 0, source: 'rate' }
  }

  const notional = calcPositionNotional(inputs, contracts)
  return {
    amount: calcMarginFromNotional(notional, inputs.entrustedMarginRate ?? 0),
    source: 'rate',
  }
}

export function calcMargins(
  inputs: CalculatorInputs,
  contracts: number | undefined,
): { margins: MarginAmounts; pointValue: number } | null {
  const heldContracts = contracts ?? 0
  if (heldContracts < 0) return null

  const pointValue = resolvePointValue(inputs)
  const marginReady =
    pointValue != null ||
    canUseRateBasedNotional(inputs) ||
    hasDirectMaintenance(inputs) ||
    hasDirectEntrusted(inputs)
  if (!marginReady) return null

  const contractNotional = calcPositionNotional(inputs, heldContracts)
  const { amount: maintenanceMargin, source: maintenanceMarginSource } =
    resolveMaintenanceMargin(inputs, heldContracts)
  const { amount: entrustedMargin, source: entrustedMarginSource } =
    resolveEntrustedMargin(inputs, heldContracts)

  const perContractMaintenance =
    heldContracts > 0 ? maintenanceMargin / heldContracts : 0
  const perContractEntrusted =
    heldContracts > 0
      ? entrustedMargin / heldContracts
      : resolveEntrustedMargin(inputs, 1).amount

  const marginEquity = resolveMarginEquity(inputs)

  return {
    pointValue: pointValue ?? 0,
    margins: {
      contractNotional,
      maintenanceMargin,
      maintenanceMarginSource,
      entrustedMargin,
      entrustedMarginSource,
      availableMargin: marginEquity - entrustedMargin,
      maintenanceExcess: marginEquity - maintenanceMargin,
      perContractMaintenance,
      perContractEntrusted,
    },
  }
}

export function validateMarginRates(inputs: CalculatorInputs): CalcMessageCode | null {
  if (hasDirectMaintenance(inputs) && hasDirectEntrusted(inputs)) {
    if (inputs.maintenanceMargin! > inputs.entrustedMargin!) {
      return 'maintenance_rate_exceeds_entrusted'
    }
    return null
  }

  if (
    !hasDirectMaintenance(inputs) &&
    !hasDirectEntrusted(inputs) &&
    inputs.maintenanceMarginRate != null &&
    inputs.entrustedMarginRate != null &&
    inputs.maintenanceMarginRate > inputs.entrustedMarginRate
  ) {
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
