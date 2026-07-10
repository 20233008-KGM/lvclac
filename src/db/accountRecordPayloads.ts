import type {
  CalculatorInputs,
  EvaluateResult,
  OrderResult,
  PositionSide,
} from '../types'

const DEFAULT_SNAPSHOT_TITLE = 'Account snapshot'

export type AccountSnapshotSource = 'manual' | 'auto'

export interface AccountRecordSummary {
  liquidationPrice: number | null
  toleranceRate: number | null
  toleranceDelta: number | null
  leverageRatio: number | null
  maintenanceMargin: number | null
  availableMargin: number | null
  isAtRisk: boolean
}

export interface OrderHistoryPayload {
  positionSide: PositionSide
  orderContracts: number
  orderPrice: number
  beforeInputs: CalculatorInputs
  afterInputs: CalculatorInputs
  beforeResult: AccountRecordSummary
  afterResult: AccountRecordSummary
}

export interface AccountSnapshotPayload {
  title: string
  inputs: CalculatorInputs
  result: AccountRecordSummary
  source: AccountSnapshotSource
  sourceLocalDate: string | null
}

function cloneInputs(inputs: CalculatorInputs): CalculatorInputs {
  return { ...inputs }
}

export function summarizeEvaluateResult(result: EvaluateResult): AccountRecordSummary {
  return {
    liquidationPrice: result.liquidationPrice,
    toleranceRate: result.toleranceRate,
    toleranceDelta: result.toleranceDelta,
    leverageRatio: result.leverageRatio,
    maintenanceMargin: result.margins?.maintenanceMargin ?? null,
    availableMargin: result.margins?.availableMargin ?? null,
    isAtRisk: result.isAtRisk,
  }
}

export function summarizeOrderBeforeResult(result: OrderResult): AccountRecordSummary {
  return {
    liquidationPrice: result.beforeLiquidation,
    toleranceRate: result.beforeTolerance,
    toleranceDelta: result.beforeToleranceDelta,
    leverageRatio: result.beforeLeverageRatio,
    maintenanceMargin: result.beforeMargins?.maintenanceMargin ?? null,
    availableMargin: result.beforeMargins?.availableMargin ?? null,
    isAtRisk: result.isAtRiskBefore,
  }
}

export function summarizeOrderAfterResult(result: OrderResult): AccountRecordSummary {
  return {
    liquidationPrice: result.afterLiquidation,
    toleranceRate: result.afterTolerance,
    toleranceDelta: result.afterToleranceDelta,
    leverageRatio: result.afterLeverageRatio,
    maintenanceMargin: result.afterMargins?.maintenanceMargin ?? null,
    availableMargin: result.afterMargins?.availableMargin ?? null,
    isAtRisk: result.isAtRiskAfter,
  }
}

export function buildAccountSnapshotPayload(
  inputs: CalculatorInputs,
  result: EvaluateResult,
  title = DEFAULT_SNAPSHOT_TITLE,
  options: {
    source?: AccountSnapshotSource
    sourceLocalDate?: string | null
  } = {},
): AccountSnapshotPayload {
  return {
    title: title.trim() || DEFAULT_SNAPSHOT_TITLE,
    inputs: cloneInputs(inputs),
    result: summarizeEvaluateResult(result),
    source: options.source ?? 'manual',
    sourceLocalDate: options.sourceLocalDate ?? null,
  }
}

export function buildOrderHistoryPayload(
  beforeInputs: CalculatorInputs,
  afterInputs: CalculatorInputs,
  orderResult: OrderResult,
): OrderHistoryPayload {
  return {
    positionSide: beforeInputs.positionSide,
    orderContracts: beforeInputs.orderContracts ?? 0,
    orderPrice: beforeInputs.orderPrice ?? beforeInputs.currentPrice ?? 0,
    beforeInputs: cloneInputs(beforeInputs),
    afterInputs: cloneInputs(afterInputs),
    beforeResult: summarizeOrderBeforeResult(orderResult),
    afterResult: summarizeOrderAfterResult(orderResult),
  }
}
