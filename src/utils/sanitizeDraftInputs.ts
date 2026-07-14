import type { CalculatorInputs, OrderScenarioBaseline } from '../types.js'

function cleanOptionalNumber(value: number | undefined): number | undefined {
  if (value == null) return value
  return Number.isFinite(value) ? value : undefined
}

function cleanContractAmountRole(value: CalculatorInputs['contractAmountRole']) {
  return value === 'entryPrice' || value === 'fixedSpec' ? value : undefined
}

function cleanSnapshot(snapshot: CalculatorInputs['scenarioRevertSnapshot']) {
  if (!snapshot) return snapshot
  const accountEval = cleanOptionalNumber(snapshot.accountEval)
  if (accountEval === undefined) return undefined
  return { ...snapshot, accountEval }
}

function cleanOrderRevertSnapshot(snapshot: CalculatorInputs['orderScenarioRevertSnapshot']) {
  if (!snapshot) return snapshot
  const accountEval = cleanOptionalNumber(snapshot.accountEval)
  if (accountEval === undefined) return undefined
  return {
    ...snapshot,
    accountEval,
    contracts: cleanOptionalNumber(snapshot.contracts),
    contractAmount: cleanOptionalNumber(snapshot.contractAmount),
    contractAmountRole: cleanContractAmountRole(snapshot.contractAmountRole),
  }
}

function cleanOrderBaseline(baseline: OrderScenarioBaseline | undefined) {
  if (!baseline) return baseline
  const contractAmount =
    typeof baseline.contractAmount === 'number' && Number.isFinite(baseline.contractAmount)
      ? baseline.contractAmount
      : null
  return { ...baseline, contractAmount }
}

function cleanOrderApplyUndoSnapshot(snapshot: CalculatorInputs['orderApplyUndoSnapshot']) {
  if (!snapshot) return snapshot
  const accountEval = cleanOptionalNumber(snapshot.accountEval)
  const orderContracts = cleanOptionalNumber(snapshot.orderContracts)
  const orderPrice = cleanOptionalNumber(snapshot.orderPrice)
  const orderScenarioRevertSnapshot = cleanOrderRevertSnapshot(snapshot.orderScenarioRevertSnapshot)
  const orderScenarioBeforeBaseline = cleanOrderBaseline(snapshot.orderScenarioBeforeBaseline)
  if (
    accountEval === undefined ||
    orderContracts === undefined ||
    orderPrice === undefined ||
    !orderScenarioRevertSnapshot ||
    !orderScenarioBeforeBaseline
  ) {
    return undefined
  }
  return {
    ...snapshot,
    accountEval,
    contracts: cleanOptionalNumber(snapshot.contracts),
    contractAmount: cleanOptionalNumber(snapshot.contractAmount),
    contractAmountRole: cleanContractAmountRole(snapshot.contractAmountRole),
    orderContracts,
    orderPrice,
    orderScenarioRevertSnapshot,
    orderScenarioBeforeBaseline,
  }
}

function cleanApplyUndoSnapshot(snapshot: CalculatorInputs['scenarioApplyUndoSnapshot']) {
  if (!snapshot) return snapshot
  const accountEval = cleanOptionalNumber(snapshot.accountEval)
  const currentPrice = cleanOptionalNumber(snapshot.currentPrice)
  const scenarioPrice = cleanOptionalNumber(snapshot.scenarioPrice)
  const scenarioRevertSnapshot = cleanSnapshot(snapshot.scenarioRevertSnapshot)
  if (
    accountEval === undefined ||
    currentPrice === undefined ||
    scenarioPrice === undefined ||
    !scenarioRevertSnapshot
  ) {
    return undefined
  }
  return {
    ...snapshot,
    accountEval,
    currentPrice,
    scenarioPrice,
    scenarioRevertSnapshot,
  }
}

/**
 * localStorage draft 복원 시 숫자 필드를 정리한다.
 * exceedsSafePrecision 값은 사용자 데이터 보존을 위해 그대로 두고,
 * UI(NumberInput 힌트)에서 입력 경고, precisionWarning 배너는 계산 결과만 검사한다.
 */
export function sanitizeDraftInputs(inputs: CalculatorInputs): CalculatorInputs {
  return {
    ...inputs,
    accountEval: cleanOptionalNumber(inputs.accountEval),
    maintenanceMarginRate: cleanOptionalNumber(inputs.maintenanceMarginRate),
    maintenanceMargin: cleanOptionalNumber(inputs.maintenanceMargin),
    maintenanceMarginPerContract: cleanOptionalNumber(inputs.maintenanceMarginPerContract),
    entrustedMarginRate: cleanOptionalNumber(inputs.entrustedMarginRate),
    entrustedMargin: cleanOptionalNumber(inputs.entrustedMargin),
    entrustedMarginPerContract: cleanOptionalNumber(inputs.entrustedMarginPerContract),
    contracts: cleanOptionalNumber(inputs.contracts),
    contractAmount: cleanOptionalNumber(inputs.contractAmount),
    contractAmountRole: cleanContractAmountRole(inputs.contractAmountRole),
    currentPrice: cleanOptionalNumber(inputs.currentPrice),
    contractMultiplier: cleanOptionalNumber(inputs.contractMultiplier),
    orderContracts: cleanOptionalNumber(inputs.orderContracts),
    orderPrice: cleanOptionalNumber(inputs.orderPrice),
    mtmPriceAnchor: cleanOptionalNumber(inputs.mtmPriceAnchor),
    scenarioPrice: cleanOptionalNumber(inputs.scenarioPrice),
    scenarioAppliedPrice: cleanOptionalNumber(inputs.scenarioAppliedPrice),
    tickSize: cleanOptionalNumber(inputs.tickSize),
    scenarioRevertSnapshot: cleanSnapshot(inputs.scenarioRevertSnapshot),
    scenarioApplyUndoSnapshot: cleanApplyUndoSnapshot(inputs.scenarioApplyUndoSnapshot),
    orderScenarioRevertSnapshot: cleanOrderRevertSnapshot(inputs.orderScenarioRevertSnapshot),
    orderScenarioBeforeBaseline: cleanOrderBaseline(inputs.orderScenarioBeforeBaseline),
    orderApplyUndoSnapshot: cleanOrderApplyUndoSnapshot(inputs.orderApplyUndoSnapshot),
  }
}
