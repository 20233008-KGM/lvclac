import type { CalcMessageCode } from '../i18n/calcMessages'
import type { CalculatorInputs, EvaluateResult, MarginAmounts, OrderResult } from '../types'
import {
  calcMargins,
  validateLiquidationInputs,
  validateMarginRates,
} from './margins'

/** 가격 1 변동 시 1계약 손익 — 약정금액×계약승수를 현재가로 나눈 값 */
export function getPointValue(
  contractAmount: number,
  contractMultiplier: number,
  currentPrice: number,
): number | null {
  if (contractMultiplier === 0 || currentPrice === 0) return null
  return (contractAmount * contractMultiplier) / currentPrice
}

/**
 * 청산 조건: 순자산(총평가금액) + 포지션 손익변동 = 유지증거금
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

/** 가용 증거금 = 순자산(총평가금액) − 현재 위탁증거금 */
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
  return { value: Math.floor(available / perContractEntrusted), message: null }
}

function calcAfterOrderLiquidation(
  inputs: CalculatorInputs,
  orderContracts: number,
): { price: number | null; afterMargins: MarginAmounts | null; message: CalcMessageCode | null } {
  if (orderContracts <= 0) {
    return { price: null, afterMargins: null, message: 'order_contracts_zero' }
  }

  const newContracts =
    inputs.contracts > 0 ? inputs.contracts + orderContracts : orderContracts

  const result = calcMargins(inputs, newContracts)
  if (!result) {
    return { price: null, afterMargins: null, message: 'multiplier_zero' }
  }

  const inputError = validateLiquidationInputs(
    inputs.accountEval,
    result.margins.maintenanceMargin,
    newContracts,
  )
  if (inputError) {
    return { price: null, afterMargins: result.margins, message: inputError }
  }

  const price = calcLiquidationPrice(
    inputs.accountEval,
    result.margins.maintenanceMargin,
    newContracts,
    inputs.currentPrice,
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
      pointValue: getPointValue(
        inputs.contractAmount,
        inputs.contractMultiplier,
        inputs.currentPrice,
      ),
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
      pointValue: null,
    }
  }

  const { margins, pointValue } = marginResult

  const inputError = validateLiquidationInputs(
    inputs.accountEval,
    margins.maintenanceMargin,
    inputs.contracts,
  )

  const liquidationPrice =
    inputError === null
      ? calcLiquidationPrice(
          inputs.accountEval,
          margins.maintenanceMargin,
          inputs.contracts,
          inputs.currentPrice,
          pointValue,
          inputs.positionSide,
        )
      : null

  const toleranceRate = calcToleranceRate(
    inputs.currentPrice,
    liquidationPrice,
    inputs.positionSide,
  )
  const toleranceDelta = calcToleranceDelta(
    inputs.currentPrice,
    liquidationPrice,
    inputs.positionSide,
  )
  const isAtRisk =
    inputError !== null || (toleranceRate !== null && toleranceRate <= 0)

  const { value: maxBuyable, message: maxBuyableMessage } = calcMaxBuyable(
    inputs.accountEval,
    margins.entrustedMargin,
    margins.perContractEntrusted,
  )

  return {
    liquidationPrice,
    liquidationMessage: inputError ?? rateWarning,
    toleranceRate,
    toleranceDelta,
    isAtRisk,
    margins,
    maxBuyable,
    maxBuyableMessage,
    pointValue,
  }
}

export function calculateOrder(inputs: CalculatorInputs): OrderResult {
  const rateWarning = validateMarginRates(inputs)

  const beforeResult = calcMargins(inputs, inputs.contracts)
  if (!beforeResult) {
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
      isAtRiskBefore: true,
      isAtRiskAfter: true,
      orderMessage: 'multiplier_zero',
      pointValue: null,
    }
  }

  const { margins: beforeMargins, pointValue } = beforeResult

  const beforeInputError =
    inputs.contracts > 0
      ? validateLiquidationInputs(
          inputs.accountEval,
          beforeMargins.maintenanceMargin,
          inputs.contracts,
        )
      : null

  const beforeLiquidation =
    beforeInputError === null && inputs.contracts > 0
      ? calcLiquidationPrice(
          inputs.accountEval,
          beforeMargins.maintenanceMargin,
          inputs.contracts,
          inputs.currentPrice,
          pointValue,
          inputs.positionSide,
        )
      : null

  const {
    price: afterLiquidation,
    afterMargins,
    message: orderMessage,
  } = calcAfterOrderLiquidation(inputs, inputs.orderContracts)

  const beforeTolerance = calcToleranceRate(
    inputs.currentPrice,
    beforeLiquidation,
    inputs.positionSide,
  )
  const afterTolerance = calcToleranceRate(
    inputs.currentPrice,
    afterLiquidation,
    inputs.positionSide,
  )
  const beforeToleranceDelta = calcToleranceDelta(
    inputs.currentPrice,
    beforeLiquidation,
    inputs.positionSide,
  )
  const afterToleranceDelta = calcToleranceDelta(
    inputs.currentPrice,
    afterLiquidation,
    inputs.positionSide,
  )

  const liquidationDelta =
    beforeLiquidation !== null && afterLiquidation !== null
      ? afterLiquidation - beforeLiquidation
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
    isAtRiskAfter: afterTolerance !== null && afterTolerance <= 0,
    orderMessage: rateWarning ?? beforeInputError ?? orderMessage,
    pointValue,
  }
}
