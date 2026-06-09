import type { CalcMessageCode } from './i18n/calcMessages'

export type PositionSide = 'long' | 'short'
export type CalculatorMode = 'evaluate' | 'order'
export type MaintenanceMarginSource = 'direct' | 'rate'

export interface CalculatorInputs {
  mode: CalculatorMode
  accountEval: number
  maintenanceMarginRate: number
  /** 증권사 앱에서 직접 가져온 유지증거금 — 입력 시 비율 산출값보다 우선 */
  maintenanceMargin?: number
  entrustedMarginRate: number
  contracts: number
  contractAmount: number
  currentPrice: number
  contractMultiplier: number
  positionSide: PositionSide
  orderContracts: number
}

export interface MarginAmounts {
  contractNotional: number
  maintenanceMargin: number
  maintenanceMarginSource: MaintenanceMarginSource
  entrustedMargin: number
  /** 위탁증거금 − 유지증거금 */
  availableMargin: number
  perContractEntrusted: number
  perContractMaintenance: number
}

export interface EvaluateResult {
  liquidationPrice: number | null
  liquidationMessage: CalcMessageCode | null
  toleranceRate: number | null
  toleranceDelta: number | null
  isAtRisk: boolean
  margins: MarginAmounts | null
  maxBuyable: number | null
  maxBuyableMessage: CalcMessageCode | null
  pointValue: number | null
}

export interface OrderResult {
  beforeLiquidation: number | null
  afterLiquidation: number | null
  beforeTolerance: number | null
  afterTolerance: number | null
  beforeToleranceDelta: number | null
  afterToleranceDelta: number | null
  beforeMargins: MarginAmounts | null
  afterMargins: MarginAmounts | null
  liquidationDelta: number | null
  isAtRiskBefore: boolean
  isAtRiskAfter: boolean
  orderMessage: CalcMessageCode | null
  pointValue: number | null
}

export const defaultInputs: CalculatorInputs = {
  mode: 'evaluate',
  accountEval: 10000000,
  maintenanceMarginRate: 0.05,
  maintenanceMargin: undefined,
  entrustedMarginRate: 0.1,
  contracts: 2,
  contractAmount: 250000,
  currentPrice: 350,
  contractMultiplier: 1,
  positionSide: 'long',
  orderContracts: 1,
}
