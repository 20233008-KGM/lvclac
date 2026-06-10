import type { CalcMessageCode } from '../i18n/calcMessages'
import type {
  CalculatorInputs,
  EvaluateResult,
  MarginAmounts,
  OrderResult,
  PositionSide,
} from '../types'
import {
  calcMargins,
  inputsReadyForEvaluate,
  validateLiquidationInputs,
  validateMarginRates,
} from './margins'
import {
  buildLiquidationParams,
  calcLiquidationPriceFromParams,
  calcToleranceDelta,
  calcToleranceRate,
} from './liquidation'

export { getPointValue, resolvePointValue } from './pointValue'
export {
  buildLiquidationParams,
  calcLongLiquidationPrice,
  calcShortLiquidationPrice,
  calcTotalQuantity,
  calcToleranceDelta,
  calcToleranceRate,
} from './liquidation'

/** @deprecated calcLiquidationPriceForInputs 또는 calcLiquidationPriceFromParams 사용 */
export function calcLiquidationPrice(
  accountEval: number,
  maintenanceMargin: number,
  contracts: number,
  currentPrice: number,
  pointValue: number,
  side: 'long' | 'short',
): number | null {
  const Q = contracts * pointValue
  const params = {
    equity: accountEval,
    currentPrice,
    totalQuantity: Q,
    maintenanceAtCurrent: maintenanceMargin,
  }
  return calcLiquidationPriceFromParams(params, side)
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
  const count = Math.floor(available / perContractEntrusted + 1e-9)
  if (!Number.isFinite(count)) {
    return { value: null, message: 'cannot_calc_per_contract_entrusted' }
  }
  return { value: count, message: null }
}

function withEffectiveAvailableMargin(
  inputs: CalculatorInputs,
  margins: MarginAmounts,
): MarginAmounts {
  // 가용증거금은 HTS 입력값(원) 기준 — 탭 전환 MTM 보정은 청산가 계산에만 사용
  const equity = inputs.accountEval ?? 0
  return {
    ...margins,
    availableMargin: equity - margins.entrustedMargin,
    maintenanceExcess: equity - margins.maintenanceMargin,
  }
}

export function checkOrderExceedsMaxBuyable(
  orderContracts: number | undefined,
  accountEval: number,
  beforeMargins: MarginAmounts,
  positionSide: PositionSide,
): CalcMessageCode | null {
  if (!orderContracts || orderContracts <= 0) return null

  const { value: maxBuyable } = calcMaxBuyable(
    accountEval,
    beforeMargins.entrustedMargin,
    beforeMargins.perContractEntrusted,
  )

  if (maxBuyable === null) return null
  if (orderContracts > maxBuyable) {
    return positionSide === 'short'
      ? 'order_exceeds_max_sellable'
      : 'order_exceeds_max_buyable'
  }
  return null
}

function resolveLiquidation(
  inputs: CalculatorInputs,
  contracts: number,
): {
  liquidationPrice: number | null
  inputError: CalcMessageCode | null
} {
  const params = buildLiquidationParams(inputs, contracts)
  if (!params) {
    return { liquidationPrice: null, inputError: 'multiplier_zero' }
  }

  const inputError = validateLiquidationInputs(
    params.equity,
    params.maintenanceAtCurrent,
    contracts,
  )
  if (inputError) {
    return { liquidationPrice: null, inputError }
  }

  const liquidationPrice = calcLiquidationPriceFromParams(params, inputs.positionSide)
  return { liquidationPrice, inputError: null }
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

  const afterInputs: CalculatorInputs = { ...inputs, contracts: newContracts }
  const { liquidationPrice, inputError } = resolveLiquidation(afterInputs, newContracts)

  if (inputError) {
    return { price: null, afterMargins: result.margins, message: inputError }
  }

  return { price: liquidationPrice, afterMargins: result.margins, message: null }
}

export function calculateEvaluate(inputs: CalculatorInputs): EvaluateResult {
  const rateWarning = validateMarginRates(inputs)
  const positionSide = inputs.positionSide

  if (inputs.contracts === 0) {
    return {
      positionSide,
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
      positionSide,
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
      positionSide,
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

  const contracts = inputs.contracts!
  const currentPrice = inputs.currentPrice!
  const margins = withEffectiveAvailableMargin(inputs, marginResult.margins)

  const { liquidationPrice, inputError } = resolveLiquidation(inputs, contracts)

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

  const marginEquity = inputs.accountEval!
  const { value: maxBuyable, message: maxBuyableMessage } = calcMaxBuyable(
    marginEquity,
    margins.entrustedMargin,
    margins.perContractEntrusted,
  )
  const leverageRatio = calcLeverageRatio(margins.contractNotional, marginEquity)

  return {
    positionSide,
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
  positionSide: PositionSide,
  overrides: Partial<OrderResult> = {},
): OrderResult {
  return {
    positionSide,
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
  const positionSide = inputs.positionSide

  if (!inputsReadyForEvaluate(inputs)) {
    return emptyOrderResult(positionSide, { orderMessage: rateWarning })
  }

  const marginEquity = inputs.accountEval!
  const contracts = inputs.contracts!
  const currentPrice = inputs.currentPrice!

  const beforeResult = calcMargins(inputs, contracts)
  if (!beforeResult) {
    return emptyOrderResult(positionSide, {
      orderMessage: 'multiplier_zero',
      isAtRiskBefore: true,
      isAtRiskAfter: true,
    })
  }

  const beforeMargins = withEffectiveAvailableMargin(inputs, beforeResult.margins)

  const orderCapacityMessage = checkOrderExceedsMaxBuyable(
    inputs.orderContracts,
    marginEquity,
    beforeMargins,
    inputs.positionSide,
  )

  const { liquidationPrice: beforeLiquidation, inputError: beforeInputError } =
    contracts > 0
      ? resolveLiquidation(inputs, contracts)
      : { liquidationPrice: null, inputError: null }

  const {
    price: afterLiquidation,
    afterMargins: rawAfterMargins,
    message: afterOrderMessage,
  } = calcAfterOrderLiquidation(inputs, inputs.orderContracts)
  const afterMargins = rawAfterMargins
    ? withEffectiveAvailableMargin(inputs, rawAfterMargins)
    : null

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
    ? calcLeverageRatio(beforeMargins.contractNotional, marginEquity)
    : null
  const afterLeverageRatio = afterMargins
    ? calcLeverageRatio(afterMargins.contractNotional, marginEquity)
    : null

  return {
    positionSide,
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
