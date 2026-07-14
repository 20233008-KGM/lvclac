import type { CalcMessageCode } from './i18n/calcMessages.js'

export type PositionSide = 'long' | 'short'
export type CalculatorMode = 'evaluate' | 'order'
export type MaintenanceMarginSource = 'direct' | 'rate'
export type EntrustedMarginSource = 'direct' | 'rate'
export type ContractAmountRole = 'entryPrice' | 'fixedSpec'

/**
 * 증거금 입력 방식 — 셋 중 하나만 선택.
 * - rate: 약정가치 × 증거금률 (국내식, 가격에 비례)
 * - perContract: 1계약당 고정금액 (해외식, 총액 = 입력값 × 계약수, 가격에 비례하지 않음)
 * - total: HTS 표시 총 증거금 직접 입력 (계약수에 비례 조정, 가격에 비례)
 */
export type MarginInputMode = 'rate' | 'perContract' | 'total'

/**
 * 총액(total) 모드 증거금의 가격 민감도 — 주문 시뮬 역산 방식을 가른다.
 * - proportional(기본): 약정금액(명목가치)에 비례 (국내 선물식). 명목 비율로 역산.
 * - fixed: 계약당 고정 (해외선물식). 계약수 비율로 역산.
 * 미설정(undefined) = 아직 사용자에게 안 물어봄 → proportional로 계산하되 주문 시 모달로 확인.
 */
export type TotalMarginKind = 'proportional' | 'fixed'

export interface CalculatorInputs {
  mode: CalculatorMode
  /** 증거금 입력 방식 — 미설정 시 비율(rate)로 간주 */
  marginInputMode?: MarginInputMode
  /** 총액 모드 증거금의 가격 민감도 — 미설정 시 가격 비례로 계산하되 주문 시 모달 확인 */
  totalMarginKind?: TotalMarginKind
  accountEval?: number
  maintenanceMarginRate?: number
  /** 증권사 앱에서 직접 가져온 유지증거금 총액 (total 모드) */
  maintenanceMargin?: number
  /** 1계약당 고정 유지증거금 (perContract 모드) */
  maintenanceMarginPerContract?: number
  entrustedMarginRate?: number
  /** 증권사 앱에서 직접 가져온 개시·위탁증거금 총액 (total 모드) */
  entrustedMargin?: number
  /** 1계약당 고정 개시·위탁증거금 (perContract 모드) */
  entrustedMarginPerContract?: number
  contracts?: number
  contractAmount?: number
  contractAmountRole?: ContractAmountRole
  currentPrice?: number
  contractMultiplier?: number
  positionSide: PositionSide
  orderContracts?: number
  /** 주문 체결 가격 — 미입력 시 현재가와 동일하게 간주 */
  orderPrice?: number
  /** accountEval 입력 시점의 포지션 — 탭 전환 MTM 보정용 */
  evalSnapshotSide?: PositionSide
  /** accountEval·시나리오 롤링 기준 현재가 */
  mtmPriceAnchor?: number
  /** 시나리오 가격 */
  scenarioPrice?: number
  /** 시나리오 손익 반영(Apply) 시 확정가 — 미리보기 모드에서는 미설정 */
  scenarioAppliedPrice?: number
  /** 시나리오 적용 전 스냅샷 — Esc 시 복원 */
  scenarioRevertSnapshot?: {
    accountEval: number
    mtmPriceAnchor?: number
    evalSnapshotSide?: PositionSide
  }
  /** 손익 반영 직전 스냅샷 — Ctrl+Z 시 시나리오 미리보기 복원 */
  scenarioApplyUndoSnapshot?: {
    accountEval: number
    currentPrice: number
    mtmPriceAnchor?: number
    evalSnapshotSide?: PositionSide
    scenarioPrice: number
    scenarioRevertSnapshot: {
      accountEval: number
      mtmPriceAnchor?: number
      evalSnapshotSide?: PositionSide
    }
  }
  /** 주문 시나리오 진입 전 실제 inputs — Esc 시 복원 */
  markPriceUndoSnapshot?: {
    accountEval: number
    currentPrice: number
    mtmPriceAnchor?: number
    evalSnapshotSide?: PositionSide
  }
  orderScenarioRevertSnapshot?: {
    accountEval: number
    contracts?: number
    contractAmount?: number
    contractAmountRole?: ContractAmountRole
    mtmPriceAnchor?: number
    evalSnapshotSide?: PositionSide
  }
  /** Enter 진입 시점의 after-order 기준선 — 모드 중 before 열 고정값 */
  orderScenarioBeforeBaseline?: OrderScenarioBaseline
  /** 주문 반영 직전 스냅샷 — Ctrl+Z */
  orderApplyUndoSnapshot?: {
    accountEval: number
    contracts?: number
    contractAmount?: number
    contractAmountRole?: ContractAmountRole
    mtmPriceAnchor?: number
    evalSnapshotSide?: PositionSide
    orderContracts?: number
    orderPrice?: number
    orderScenarioRevertSnapshot: {
      accountEval: number
      contracts?: number
      contractAmount?: number
      contractAmountRole?: ContractAmountRole
      mtmPriceAnchor?: number
      evalSnapshotSide?: PositionSide
    }
    orderScenarioBeforeBaseline: OrderScenarioBaseline
  }
  /** 가격 스테퍼 1틱 크기 */
  tickSize?: number
}

/** 주문 시나리오 진입 직전 after 열 지표 — 모드 중 before 열에 고정 */
export interface OrderScenarioBaseline {
  contractAmount: number | null
  liquidation: number | null
  tolerance: number | null
  toleranceDelta: number | null
  margins: MarginAmounts | null
  leverageRatio: number | null
  isAtRisk: boolean
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
  beforeContractAmount: number | null
  afterContractAmount: number | null
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

/** 계약당 고정 증거금 테스트용 (해외선물 가정) — 유지/개시는 가격과 무관한 고정금액 */
export const perContractMarginSampleInputs: CalculatorInputs = {
  mode: 'evaluate',
  marginInputMode: 'perContract',
  accountEval: 50_000,
  maintenanceMarginPerContract: 1_000,
  entrustedMarginPerContract: 6_000,
  contracts: 2,
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
