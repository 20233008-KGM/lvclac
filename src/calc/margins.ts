import type { CalcMessageCode } from '../i18n/calcMessages'
import type {
  CalculatorInputs,
  EntrustedMarginSource,
  MaintenanceMarginSource,
  MarginAmounts,
  MarginInputMode,
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

/**
 * 유지증거금 입력 방식 — 명시 모드 우선, 미설정 시 구버전 추론(직접 총액 있으면 total).
 * 전역 토글이 둘 다 같은 모드를 지정하므로 보통 유지·개시가 일치하나,
 * 구버전 입력(직접 한쪽만)을 위해 필드별로 추론한다.
 */
export function maintenanceMarginMode(inputs: CalculatorInputs): MarginInputMode {
  return inputs.marginInputMode ?? (hasDirectMaintenance(inputs) ? 'total' : 'rate')
}

export function entrustedMarginMode(inputs: CalculatorInputs): MarginInputMode {
  return inputs.marginInputMode ?? (hasDirectEntrusted(inputs) ? 'total' : 'rate')
}

/** perContract 모드: 유지증거금이 가격과 무관한 고정금액 → 청산식 분기 신호 */
export function isMaintenanceFixed(inputs: CalculatorInputs): boolean {
  return maintenanceMarginMode(inputs) === 'perContract'
}

function hasMaintenanceSpec(inputs: CalculatorInputs): boolean {
  switch (maintenanceMarginMode(inputs)) {
    case 'perContract':
      return (inputs.maintenanceMarginPerContract ?? 0) > 0
    case 'total':
      return hasDirectMaintenance(inputs)
    default:
      return inputs.maintenanceMarginRate != null
  }
}

function hasEntrustedSpec(inputs: CalculatorInputs): boolean {
  switch (entrustedMarginMode(inputs)) {
    case 'perContract':
      return (inputs.entrustedMarginPerContract ?? 0) > 0
    case 'total':
      return hasDirectEntrusted(inputs)
    default:
      return inputs.entrustedMarginRate != null
  }
}

export function hasMarginSpec(inputs: CalculatorInputs): boolean {
  return hasMaintenanceSpec(inputs) && hasEntrustedSpec(inputs)
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
  const contractAmount = inputs.contractAmount
  if (
    contractAmount != null &&
    contractAmount > 0 &&
    inputs.currentPrice != null &&
    isWonAccountIndexFieldMismatch(inputs as CalculatorInputs)
  ) {
    return calcIndexNotionalWon(inputs.currentPrice, contracts, inputs.contractMultiplier)
  }
  // 약정금액 경로: price×pointValue와 동치이나 부동소수 취소 오차 방지
  if (contractAmount != null && contractAmount > 0) {
    return contracts * contractAmount * multiplier
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

  // 고정 유지증거금(perContract/total)은 약정금액 없이 현재가+계약수만으로 청산 가능
  if (maintenanceMarginMode(inputs) !== 'rate') {
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
  switch (maintenanceMarginMode(inputs)) {
    case 'perContract':
      return {
        amount: (inputs.maintenanceMarginPerContract ?? 0) * contracts,
        source: 'direct',
      }
    case 'total':
      return {
        amount: scaleDirectMargin(
          inputs.maintenanceMargin ?? 0,
          inputs.contracts ?? 0,
          contracts,
        ),
        source: 'direct',
      }
    default: {
      if (contracts === 0) {
        return { amount: 0, source: 'rate' }
      }
      const notional = calcPositionNotional(inputs, contracts)
      return {
        amount: calcMarginFromNotional(notional, inputs.maintenanceMarginRate ?? 0),
        source: 'rate',
      }
    }
  }
}

export function resolveEntrustedMargin(
  inputs: CalculatorInputs,
  contracts: number,
): { amount: number; source: EntrustedMarginSource } {
  switch (entrustedMarginMode(inputs)) {
    case 'perContract':
      return {
        amount: (inputs.entrustedMarginPerContract ?? 0) * contracts,
        source: 'direct',
      }
    case 'total':
      return {
        amount: scaleDirectMargin(
          inputs.entrustedMargin ?? 0,
          inputs.contracts ?? 0,
          contracts,
        ),
        source: 'direct',
      }
    default: {
      if (contracts === 0) {
        return { amount: 0, source: 'rate' }
      }
      const notional = calcPositionNotional(inputs, contracts)
      return {
        amount: calcMarginFromNotional(notional, inputs.entrustedMarginRate ?? 0),
        source: 'rate',
      }
    }
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
    hasMaintenanceSpec(inputs) ||
    hasEntrustedSpec(inputs)
  if (!marginReady) return null

  const contractNotional = calcPositionNotional(inputs, heldContracts)
  const { amount: maintenanceMargin, source: maintenanceMarginSource } =
    resolveMaintenanceMargin(inputs, heldContracts)
  const { amount: entrustedMargin, source: entrustedMarginSource } =
    resolveEntrustedMargin(inputs, heldContracts)

  const perContractMaintenance =
    heldContracts > 0
      ? maintenanceMargin / heldContracts
      : resolveMaintenanceMargin(inputs, 1).amount
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
  const maintenanceMode = maintenanceMarginMode(inputs)
  const entrustedMode = entrustedMarginMode(inputs)

  // 유지·개시 입력 방식이 같을 때만 직접 비교 (혼용 시 명목 산식이 달라 비교 불가)
  if (maintenanceMode !== entrustedMode) return null

  if (maintenanceMode === 'perContract') {
    if (
      inputs.maintenanceMarginPerContract != null &&
      inputs.entrustedMarginPerContract != null &&
      inputs.maintenanceMarginPerContract > inputs.entrustedMarginPerContract
    ) {
      return 'maintenance_rate_exceeds_entrusted'
    }
    return null
  }

  if (maintenanceMode === 'total') {
    if (
      inputs.maintenanceMargin != null &&
      inputs.entrustedMargin != null &&
      inputs.maintenanceMargin > inputs.entrustedMargin
    ) {
      return 'maintenance_rate_exceeds_entrusted'
    }
    return null
  }

  if (
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
