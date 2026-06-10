import type { CalcMessageCode } from './i18n/calcMessages'

export type PositionSide = 'long' | 'short'
export type CalculatorMode = 'evaluate' | 'order'
export type MaintenanceMarginSource = 'direct' | 'rate'
export type EntrustedMarginSource = 'direct' | 'rate'

export interface CalculatorInputs {
  mode: CalculatorMode
  accountEval?: number
  maintenanceMarginRate?: number
  /** 증권사 앱에서 직접 가져온 유지증거금 — 입력 시 비율 산출값보다 우선 */
  maintenanceMargin?: number
  entrustedMarginRate?: number
  /** 증권사 앱에서 직접 가져온 개시·위탁증거금 — 입력 시 비율 산출값보다 우선 */
  entrustedMargin?: number
  contracts?: number
  contractAmount?: number
  currentPrice?: number
  contractMultiplier?: number
  positionSide: PositionSide
  orderContracts?: number
  /** accountEval 입력 시점의 포지션 — 탭 전환 MTM 보정용 */
  evalSnapshotSide?: PositionSide
}

export interface MarginAmounts {
  contractNotional: number
  maintenanceMargin: number
  maintenanceMarginSource: MaintenanceMarginSource
  entrustedMargin: number
  entrustedMarginSource: EntrustedMarginSource
  /** 계좌 평가금액 − 위탁증거금 */
  availableMargin: number
  /** 계좌 평가금액 − 유지증거금 */
  maintenanceExcess: number
  perContractEntrusted: number
  perContractMaintenance: number
}

export interface EvaluateResult {
  /** 계산에 사용된 포지션 방향 — UI 표시와 항상 동기화 */
  positionSide: PositionSide
  liquidationPrice: number | null
  liquidationMessage: CalcMessageCode | null
  toleranceRate: number | null
  toleranceDelta: number | null
  isAtRisk: boolean
  margins: MarginAmounts | null
  maxBuyable: number | null
  maxBuyableMessage: CalcMessageCode | null
  leverageRatio: number | null
}

export interface OrderResult {
  positionSide: PositionSide
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
  orderCapacityMessage: CalcMessageCode | null
  beforeLeverageRatio: number | null
  afterLeverageRatio: number | null
}

export const defaultInputs: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
}

/** 직접 증거금 테스트용 — ES: 약정금액 = 50×5000 */
export const directMarginSampleInputs: CalculatorInputs = {
  mode: 'evaluate',
  accountEval: 50_000,
  maintenanceMargin: 2_000,
  entrustedMargin: 12_000,
  contracts: 2,
  contractAmount: 250_000,
  contractMultiplier: 1,
  currentPrice: 5_000,
  positionSide: 'long',
  orderContracts: 1,
}

/** 계산 로직 테스트용 샘플 값 */
export const sampleInputs: CalculatorInputs = {
  mode: 'evaluate',
  accountEval: 10_000_000,
  maintenanceMarginRate: 0.05,
  entrustedMarginRate: 0.1,
  contracts: 2,
  contractAmount: 250_000,
  currentPrice: 350,
  contractMultiplier: 1,
  positionSide: 'long',
  orderContracts: 1,
}
