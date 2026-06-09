import type { CalcMessageCode } from '../i18n/calcMessages'
import type {
  CalculatorInputs,
  EvaluateResult,
  MarginAmounts,
  OrderResult,
} from '../types'
import {
  calcMargins,
  inputsReadyForEvaluate,
  validateLiquidationInputs,
  validateMarginRates,
} from './margins'

export { getPointValue, resolvePointValue } from './pointValue'

/**
 * 청산 조건: 계좌 평가금액 + 포지션 손익변동 = 유지증거금
 * 롱: 가격 하락 시 손실 → accountEval + Δ < maintenance
 * 숏: 가격 상승 시 손실 → accountEval + Δ < maintenance
 */
export function calcLiquidationPrice(
  accountEval: number,
  maintenanceMargin: number,
  contracts: number,
  currentPrice: number,
  pointValue: number,
  side: 'long' | 'short',
): number | null {
  if (contracts === 0 || pointValue === 0) return null

  const buffer = accountEval - maintenanceMargin
  const pnlPerPoint = contracts * pointValue
  const delta = buffer / pnlPerPoint

  return side === 'long' ? currentPrice - delta : currentPrice + delta
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

/** 레버리지 = 약정가치 ÷ 계좌 평가금액 */
export function calcLeverageRatio(
  contractNotional: number,
  accountEval: number,
): number | null {
  if (contractNotional <= 0 || accountEval <= 0) return null
  const ratio = contractNotional / accountEval
  return Number.isFinite(ratio) ? ratio : null
}

/** 가용 증거금 = 계좌 평가금액 − 현재 위탁증거금 */
export function calcMaxBuyable(
  accountEval: number,
  entrustedMargin: number,
  perContractEntrusted: number,
): { value: number | null; message: CalcMessageCode | null } {
  const available = accountEval - entrustedMargin
  if (available <= 0) {
    return { value: 0, message: 'no_available_margin' }
  }
  if (perContractEntrusted <= 0) {
    return { value: null, message: 'cannot_calc_per_contract_entrusted' }
  }
  // 부동소수 나눗셈으로 119.999… → 118이 되는 경우 방지
  const count = Math.floor(available / perContractEntrusted + 1e-9)
  if (!Number.isFinite(count)) {
    return { value: null, message: 'cannot_calc_per_contract_entrusted' }
  }
  return { value: count, message: null }
}

/** 주문 계약 수가 가용 증거금 기준 추가 매수 한도를 초과하는지 검사 */
export function checkOrderExceedsMaxBuyable(
  orderContracts: number | undefined,
  accountEval: number,
  beforeMargins: MarginAmounts,
): CalcMessageCode | null {
  if (!orderContracts || orderContracts <= 0) return null

  const { value: maxBuyable } = calcMaxBuyable(
    accountEval,
    beforeMargins.entrustedMargin,
    beforeMargins.perContractEntrusted,
  )

  if (maxBuyable === null) return null
  if (orderContracts > maxBuyable) return 'order_exceeds_max_buyable'
  return null
}

function calcAfterOrderLiquidation(
  inputs: CalculatorInputs,
  orderContracts: number | undefined,
): { price: number | null; afterMargins: MarginAmounts | null; message: CalcMessageCode | null } {
  if (!orderContracts) {
    return { price: null, afterMargins: null, message: 'order_contracts_zero' }
  }

  const heldContracts = inputs.contracts ?? 0
  const newContracts = heldContracts > 0 ? heldContracts + orderContracts : orderContracts

  if (newContracts < 0) {
    return { price: null, afterMargins: null, message: 'order_exceeds_position' }
  }

  const result = calcMargins(inputs, newContracts)
  if (!result) {
    return { price: null, afterMargins: null, message: 'multiplier_zero' }
  }

  const accountEval = inputs.accountEval!
  const currentPrice = inputs.currentPrice!

  const inputError = validateLiquidationInputs(
    accountEval,
    result.margins.maintenanceMargin,
    newContracts,
  )
  if (inputError) {
    return { price: null, afterMargins: result.margins, message: inputError }
  }

  const price = calcLiquidationPrice(
    accountEval,
    result.margins.maintenanceMargin,
    newContracts,
    currentPrice,
    result.pointValue,
    inputs.positionSide,
  )

  return { price, afterMargins: result.margins, message: null }
}

export function calculateEvaluate(inputs: CalculatorInputs): EvaluateResult {
  const rateWarning = validateMarginRates(inputs)

  if (inputs.contracts === 0) {
    return {
      liquidationPrice: null,
      liquidationMessage: 'contracts_zero',
      toleranceRate: null,
      toleranceDelta: null,
      isAtRisk: true,
      margins: null,
      maxBuyable: null,
      maxBuyableMessage: null,
      leverageRatio: null,
    }
  }

  if (!inputsReadyForEvaluate(inputs)) {
    return {
      liquidationPrice: null,
      liquidationMessage: rateWarning,
      toleranceRate: null,
      toleranceDelta: null,
      isAtRisk: false,
      margins: null,
      maxBuyable: null,
      maxBuyableMessage: null,
      leverageRatio: null,
    }
  }

  const marginResult = calcMargins(inputs, inputs.contracts)
  if (!marginResult) {
    return {
      liquidationPrice: null,
      liquidationMessage: 'multiplier_zero',
      toleranceRate: null,
      toleranceDelta: null,
      isAtRisk: true,
      margins: null,
      maxBuyable: null,
      maxBuyableMessage: null,
      leverageRatio: null,
    }
  }

  const { margins, pointValue: marginPointValue } = marginResult

  const accountEval = inputs.accountEval!
  const contracts = inputs.contracts!
  const currentPrice = inputs.currentPrice!

  const inputError = validateLiquidationInputs(
    accountEval,
    margins.maintenanceMargin,
    contracts,
  )

  const liquidationPrice =
    inputError === null && marginPointValue !== null
      ? calcLiquidationPrice(
          accountEval,
          margins.maintenanceMargin,
          contracts,
          currentPrice,
          marginPointValue,
          inputs.positionSide,
        )
      : null

  const toleranceRate = calcToleranceRate(
    currentPrice,
    liquidationPrice,
    inputs.positionSide,
  )
  const toleranceDelta = calcToleranceDelta(
    currentPrice,
    liquidationPrice,
    inputs.positionSide,
  )
  const isAtRisk =
    inputError !== null || (toleranceRate !== null && toleranceRate <= 0)

  const { value: maxBuyable, message: maxBuyableMessage } = calcMaxBuyable(
    accountEval,
    margins.entrustedMargin,
    margins.perContractEntrusted,
  )
  const leverageRatio = calcLeverageRatio(margins.contractNotional, accountEval)

  return {
    liquidationPrice,
    liquidationMessage: inputError ?? rateWarning,
    toleranceRate,
    toleranceDelta,
    isAtRisk,
    margins,
    maxBuyable,
    maxBuyableMessage,
    leverageRatio,
  }
}

function emptyOrderResult(
  overrides: Partial<OrderResult> = {},
): OrderResult {
  return {
    beforeLiquidation: null,
    afterLiquidation: null,
    beforeTolerance: null,
    afterTolerance: null,
    beforeToleranceDelta: null,
    afterToleranceDelta: null,
    beforeMargins: null,
    afterMargins: null,
    liquidationDelta: null,
    isAtRiskBefore: false,
    isAtRiskAfter: false,
    orderMessage: null,
    orderCapacityMessage: null,
    beforeLeverageRatio: null,
    afterLeverageRatio: null,
    ...overrides,
  }
}

export function calculateOrder(inputs: CalculatorInputs): OrderResult {
  const rateWarning = validateMarginRates(inputs)

  if (!inputsReadyForEvaluate(inputs)) {
    return emptyOrderResult({ orderMessage: rateWarning })
  }

  const accountEval = inputs.accountEval!
  const contracts = inputs.contracts!
  const currentPrice = inputs.currentPrice!

  const beforeResult = calcMargins(inputs, contracts)
  if (!beforeResult) {
    return emptyOrderResult({
      orderMessage: 'multiplier_zero',
      isAtRiskBefore: true,
      isAtRiskAfter: true,
    })
  }

  const { margins: beforeMargins, pointValue: beforePointValue } = beforeResult

  const orderCapacityMessage = checkOrderExceedsMaxBuyable(
    inputs.orderContracts,
    accountEval,
    beforeMargins,
  )

  const beforeInputError =
    contracts > 0
      ? validateLiquidationInputs(accountEval, beforeMargins.maintenanceMargin, contracts)
      : null

  const beforeLiquidation =
    beforeInputError === null && contracts > 0 && beforePointValue !== null
      ? calcLiquidationPrice(
          accountEval,
          beforeMargins.maintenanceMargin,
          contracts,
          currentPrice,
          beforePointValue,
          inputs.positionSide,
        )
      : null

  const {
    price: afterLiquidation,
    afterMargins,
    message: afterOrderMessage,
  } = calcAfterOrderLiquidation(inputs, inputs.orderContracts)

  const beforeTolerance = calcToleranceRate(currentPrice, beforeLiquidation, inputs.positionSide)
  const afterTolerance = calcToleranceRate(currentPrice, afterLiquidation, inputs.positionSide)
  const beforeToleranceDelta = calcToleranceDelta(
    currentPrice,
    beforeLiquidation,
    inputs.positionSide,
  )
  const afterToleranceDelta = calcToleranceDelta(
    currentPrice,
    afterLiquidation,
    inputs.positionSide,
  )

  const liquidationDelta =
    beforeLiquidation !== null && afterLiquidation !== null
      ? afterLiquidation - beforeLiquidation
      : null

  const beforeLeverageRatio = beforeMargins
    ? calcLeverageRatio(beforeMargins.contractNotional, accountEval)
    : null
  const afterLeverageRatio = afterMargins
    ? calcLeverageRatio(afterMargins.contractNotional, accountEval)
    : null

  return {
    beforeLiquidation,
    afterLiquidation,
    beforeTolerance,
    afterTolerance,
    beforeToleranceDelta,
    afterToleranceDelta,
    beforeMargins,
    afterMargins,
    liquidationDelta,
    isAtRiskBefore:
      beforeInputError !== null ||
      (beforeTolerance !== null && beforeTolerance <= 0),
    isAtRiskAfter:
      orderCapacityMessage !== null ||
      afterOrderMessage === 'maintenance_exceeds_equity' ||
      (afterTolerance !== null && afterTolerance <= 0),
    orderMessage:
      rateWarning ?? beforeInputError ?? orderCapacityMessage ?? afterOrderMessage,
    orderCapacityMessage,
    beforeLeverageRatio,
    afterLeverageRatio,
  }
}
