import type { CalcMessageCode } from '../i18n/calcMessages'
import type {
  CalculatorInputs,
  EvaluateResult,
  MarginAmounts,
  OrderResult,
  OrderScenarioBaseline,
  PositionSide,
} from '../types'
import {
  resolveEvaluationInputs,
  resolveMarginCalculationInputs,
  resolveMarginEquity,
} from './mtmLink'
import {
  calcMargins,
  inputsReadyForEvaluate,
  inputsReadyForOrderSim,
  withReferencePrice,
  validateLiquidationInputs,
  validateMarginRates,
} from './margins'
import {
  buildLiquidationParams,
  calcLiquidationPriceFromParams,
  calcToleranceDelta,
  calcToleranceRate,
  calcTotalQuantity,
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
  const equity = resolveMarginEquity(inputs)
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

/** 주문 체결 가격 — 미입력 시 현재가 */
export function resolveOrderPrice(inputs: CalculatorInputs): number | undefined {
  return inputs.orderPrice ?? inputs.currentPrice
}

/** 주문 체결가와 현재가 차이에 따른 평가금액 변동 (신규·축소 계약분) — calcPnlDelta와 동일 Q */
export function calcOrderFillPnl(
  inputs: CalculatorInputs,
  orderContracts: number,
  orderPrice: number,
): number {
  const currentPrice = inputs.currentPrice
  if (currentPrice == null || orderContracts === 0 || orderPrice === currentPrice) return 0

  const Q =
    orderContracts > 0
      ? calcTotalQuantity(inputs, orderContracts)
      : orderContracts * (inputs.contractMultiplier ?? 1)
  if (Q == null || Q === 0) return 0

  const priceDelta = currentPrice - orderPrice
  return inputs.positionSide === 'long' ? priceDelta * Q : -priceDelta * Q
}

function resolveAfterOrderContractAmount(
  inputs: CalculatorInputs,
  newContracts: number,
  orderContracts: number,
  orderPrice: number | undefined,
): number | undefined {
  if (newContracts === 0) {
    return 0
  }

  const previousAmount = inputs.contractAmount
  const heldContracts = inputs.contracts ?? 0

  if (inputs.contractAmountRole !== 'entryPrice') {
    return previousAmount
  }

  if (
    orderPrice == null ||
    !Number.isFinite(orderPrice) ||
    orderPrice <= 0 ||
    orderContracts <= 0 ||
    newContracts <= 0
  ) {
    return previousAmount
  }

  if (heldContracts <= 0 || previousAmount == null) {
    return orderPrice
  }

  return ((previousAmount * heldContracts) + (orderPrice * orderContracts)) / newContracts
}

export function buildAfterOrderInputs(
  inputs: CalculatorInputs,
  newContracts: number,
  orderContracts: number,
): CalculatorInputs {
  const orderPrice = resolveOrderPrice(inputs)
  const fillPnl =
    orderPrice != null ? calcOrderFillPnl(inputs, orderContracts, orderPrice) : 0
  const contractAmount = resolveAfterOrderContractAmount(
    inputs,
    newContracts,
    orderContracts,
    orderPrice,
  )

  return {
    ...inputs,
    contracts: newContracts,
    contractAmount,
    accountEval: resolveMarginEquity(inputs) + fillPnl,
    evalSnapshotSide: inputs.positionSide,
  }
}

function calcAfterOrderLiquidation(
  inputs: CalculatorInputs,
  orderContracts: number | undefined,
): {
  price: number | null
  afterMargins: MarginAmounts | null
  afterInputs: CalculatorInputs | null
  message: CalcMessageCode | null
} {
  if (!orderContracts) {
    return { price: null, afterMargins: null, afterInputs: null, message: 'order_contracts_zero' }
  }

  const heldContracts = inputs.contracts ?? 0
  const newContracts = heldContracts > 0 ? heldContracts + orderContracts : orderContracts

  if (newContracts < 0) {
    return { price: null, afterMargins: null, afterInputs: null, message: 'order_exceeds_position' }
  }

  const afterInputs = buildAfterOrderInputs(inputs, newContracts, orderContracts)
  const result = calcMargins(afterInputs, newContracts)
  if (!result) {
    return { price: null, afterMargins: null, afterInputs: null, message: 'multiplier_zero' }
  }

  const { liquidationPrice, inputError } = resolveLiquidation(afterInputs, newContracts)

  if (inputError) {
    return { price: null, afterMargins: result.margins, afterInputs, message: inputError }
  }

  return { price: liquidationPrice, afterMargins: result.margins, afterInputs, message: null }
}

export function calculateEvaluate(inputs: CalculatorInputs): EvaluateResult {
  const evalInputs = withReferencePrice(resolveEvaluationInputs(inputs))
  const marginInputs = withReferencePrice(resolveMarginCalculationInputs(inputs))
  const rateWarning = validateMarginRates(marginInputs)
  const positionSide = evalInputs.positionSide
  const heldContracts = evalInputs.contracts ?? 0

  const canCalcCapacity = inputsReadyForOrderSim(evalInputs)
  const canCalcFull = inputsReadyForEvaluate(evalInputs)

  if (!canCalcCapacity && !canCalcFull) {
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

  const marginResult = calcMargins(marginInputs, heldContracts)
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

  const margins = withEffectiveAvailableMargin(evalInputs, marginResult.margins)
  const marginEquity = resolveMarginEquity(evalInputs)
  const { value: maxBuyable, message: maxBuyableMessage } = calcMaxBuyable(
    marginEquity,
    margins.entrustedMargin,
    margins.perContractEntrusted,
  )

  if (!canCalcFull) {
    return {
      positionSide,
      liquidationPrice: null,
      liquidationMessage: rateWarning,
      toleranceRate: null,
      toleranceDelta: null,
      isAtRisk: false,
      margins,
      maxBuyable,
      maxBuyableMessage,
      leverageRatio: null,
    }
  }

  const contracts = heldContracts
  const currentPrice = evalInputs.currentPrice!

  const { liquidationPrice, inputError } = resolveLiquidation(evalInputs, contracts)

  const toleranceRate = calcToleranceRate(
    currentPrice,
    liquidationPrice,
    evalInputs.positionSide,
  )
  const toleranceDelta = calcToleranceDelta(
    currentPrice,
    liquidationPrice,
    evalInputs.positionSide,
  )
  const isAtRisk =
    inputError !== null || (toleranceRate !== null && toleranceRate <= 0)

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
    beforeContractAmount: null,
    afterContractAmount: null,
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

export function captureOrderScenarioBaseline(result: OrderResult): OrderScenarioBaseline {
  return {
    contractAmount: result.afterContractAmount,
    liquidation: result.afterLiquidation,
    tolerance: result.afterTolerance,
    toleranceDelta: result.afterToleranceDelta,
    margins: result.afterMargins,
    leverageRatio: result.afterLeverageRatio,
    isAtRisk: result.isAtRiskAfter,
  }
}

function orderInputsFromRevertSnapshot(inputs: CalculatorInputs): CalculatorInputs {
  const snap = inputs.orderScenarioRevertSnapshot
  if (!snap) return inputs
  return {
    ...inputs,
    accountEval: snap.accountEval,
    contracts: snap.contracts,
    contractAmount: snap.contractAmount,
    contractAmountRole: snap.contractAmountRole,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
  }
}

export function calculateOrder(inputs: CalculatorInputs): OrderResult {
  const orderScenarioActive = inputs.orderScenarioRevertSnapshot != null
  const baseline = inputs.orderScenarioBeforeBaseline

  const evalInputs = withReferencePrice(resolveEvaluationInputs(inputs))
  const marginInputs = withReferencePrice(resolveMarginCalculationInputs(inputs))
  const rateWarning = validateMarginRates(marginInputs)
  const positionSide = evalInputs.positionSide

  if (!inputsReadyForOrderSim(evalInputs)) {
    return emptyOrderResult(positionSide, { orderMessage: rateWarning })
  }

  const orderCalcBase = orderScenarioActive
    ? withReferencePrice(orderInputsFromRevertSnapshot(inputs))
    : evalInputs

  const marginEquity = resolveMarginEquity(orderCalcBase)
  const heldContracts = orderCalcBase.contracts ?? 0
  const currentPrice = orderCalcBase.currentPrice!

  const beforeResult = calcMargins(marginInputs, heldContracts)
  if (!beforeResult) {
    return emptyOrderResult(positionSide, {
      orderMessage: 'multiplier_zero',
      isAtRiskBefore: true,
      isAtRiskAfter: true,
    })
  }

  const beforeMargins = withEffectiveAvailableMargin(orderCalcBase, beforeResult.margins)

  const orderCapacityMessage = checkOrderExceedsMaxBuyable(
    orderCalcBase.orderContracts,
    marginEquity,
    beforeMargins,
    orderCalcBase.positionSide,
  )

  const {
    price: afterLiquidation,
    afterMargins: rawAfterMargins,
    afterInputs,
    message: afterOrderMessage,
  } = calcAfterOrderLiquidation(orderCalcBase, orderCalcBase.orderContracts)
  const afterMargins = rawAfterMargins
    ? withEffectiveAvailableMargin(afterInputs ?? orderCalcBase, rawAfterMargins)
    : null
  const beforeContractAmount = orderCalcBase.contractAmount ?? null
  const afterContractAmount = afterInputs?.contractAmount ?? null

  const afterTolerance = calcToleranceRate(currentPrice, afterLiquidation, orderCalcBase.positionSide)
  const afterToleranceDelta = calcToleranceDelta(
    currentPrice,
    afterLiquidation,
    orderCalcBase.positionSide,
  )
  const afterEquity = afterInputs?.accountEval ?? marginEquity
  const afterLeverageRatio = afterMargins
    ? calcLeverageRatio(afterMargins.contractNotional, afterEquity)
    : null
  const isAtRiskAfter =
    orderCapacityMessage !== null ||
    afterOrderMessage === 'maintenance_exceeds_equity' ||
    (afterTolerance !== null && afterTolerance <= 0)

  if (orderScenarioActive && baseline) {
    const beforeLiquidation = baseline.liquidation
    const liquidationDelta =
      beforeLiquidation !== null && afterLiquidation !== null
        ? afterLiquidation - beforeLiquidation
        : null

    return {
      positionSide,
      beforeContractAmount: baseline.contractAmount,
      afterContractAmount,
      beforeLiquidation,
      afterLiquidation,
      beforeTolerance: baseline.tolerance,
      afterTolerance,
      beforeToleranceDelta: baseline.toleranceDelta,
      afterToleranceDelta,
      beforeMargins: baseline.margins,
      afterMargins,
      liquidationDelta,
      isAtRiskBefore: baseline.isAtRisk,
      isAtRiskAfter,
      orderMessage:
        rateWarning ?? orderCapacityMessage ?? afterOrderMessage,
      orderCapacityMessage,
      beforeLeverageRatio: baseline.leverageRatio,
      afterLeverageRatio,
    }
  }

  const { liquidationPrice: beforeLiquidation, inputError: beforeInputError } =
    heldContracts > 0
      ? resolveLiquidation(orderCalcBase, heldContracts)
      : { liquidationPrice: null, inputError: null }

  const beforeTolerance = calcToleranceRate(currentPrice, beforeLiquidation, orderCalcBase.positionSide)
  const beforeToleranceDelta = calcToleranceDelta(
    currentPrice,
    beforeLiquidation,
    orderCalcBase.positionSide,
  )

  const liquidationDelta =
    beforeLiquidation !== null && afterLiquidation !== null
      ? afterLiquidation - beforeLiquidation
      : null

  const beforeLeverageRatio = beforeMargins
    ? calcLeverageRatio(beforeMargins.contractNotional, marginEquity)
    : null

  return {
    positionSide,
    beforeContractAmount,
    afterContractAmount,
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
    isAtRiskAfter,
    orderMessage:
      rateWarning ?? beforeInputError ?? orderCapacityMessage ?? afterOrderMessage,
    orderCapacityMessage,
    beforeLeverageRatio,
    afterLeverageRatio,
  }
}
