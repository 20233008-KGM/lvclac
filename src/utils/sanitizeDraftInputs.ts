import type { CalculatorInputs } from '../types'

function cleanOptionalNumber(value: number | undefined): number | undefined {
  if (value == null) return value
  return Number.isFinite(value) ? value : undefined
}

function cleanSnapshot(snapshot: CalculatorInputs['scenarioRevertSnapshot']) {
  if (!snapshot) return snapshot
  const accountEval = cleanOptionalNumber(snapshot.accountEval)
  if (accountEval === undefined) return undefined
  return { ...snapshot, accountEval }
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
  }
}
