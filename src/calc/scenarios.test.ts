/**
 * 다국적·다종목 선물거래 시나리오 — 수동 산출 정답값과 계산기 결과 대조
 *
 * 공식 (계산기 내부와 동일):
 *   pointValue = contractAmount × multiplier ÷ currentPrice
 *   notional   = contracts × currentPrice × pointValue = contracts × contractAmount × multiplier
 *   buffer     = accountEval − maintenanceMargin
 *   delta      = buffer ÷ (contracts × pointValue)
 *   롱 청산가  = currentPrice − delta
 *   숏 청산가  = currentPrice + delta
 */
import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import { calculateEvaluate, calculateOrder } from './leverage'

interface ScenarioExpect {
  liquidationPrice?: number
  toleranceRate?: number
  toleranceDelta?: number
  contractNotional?: number
  maintenanceMargin?: number
  entrustedMargin?: number
  leverageRatio?: number
  maxBuyable?: number
  isAtRisk?: boolean
  liquidationMessage?: string
  maxBuyableMessage?: string
}

interface TradingScenario {
  id: string
  market: string
  description: string
  inputs: CalculatorInputs
  expected: ScenarioExpect
}

const scenarios: TradingScenario[] = [
  // ── 한국: KOSPI200 미니, 소액 계좌 롱 ──
  {
    id: 'kr-kospi-mini-long',
    market: 'KR',
    description: '한국 개인투자자 — KOSPI200 미니 1계약 롱, 비율 입력',
    inputs: {
      mode: 'evaluate',
      accountEval: 3_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 1,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
    },
    expected: {
      contractNotional: 250_000,
      maintenanceMargin: 12_500,
      entrustedMargin: 25_000,
      liquidationPrice: -3_832.5,
      toleranceRate: 1_195,
      toleranceDelta: 4_182.5,
      leverageRatio: 10,
      maxBuyable: 119,
      isAtRisk: false,
    },
  },

  // ── 미국: E-mini S&P 500 숏 ──
  {
    id: 'us-es-short',
    market: 'US',
    description: '미국 데이트레이더 — ES 1계약 숏, 타이트한 증거금',
    inputs: {
      mode: 'evaluate',
      accountEval: 25_000,
      maintenanceMarginRate: 0.04,
      entrustedMarginRate: 0.08,
      contracts: 1,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'short',
    },
    expected: {
      contractNotional: 250_000,
      maintenanceMargin: 10_000,
      entrustedMargin: 20_000,
      liquidationPrice: 5_300,
      toleranceRate: 6,
      toleranceDelta: 300,
      leverageRatio: 12.5,
      maxBuyable: 0,
      isAtRisk: false,
    },
  },

  // ── 일본: 니케이225 미니, 직접 증거금 ──
  {
    id: 'jp-nikkei-direct-long',
    market: 'JP',
    description: '일본 트레이더 — 니케이225 미니 2계약 롱, HTS 직접 증거금',
    inputs: {
      mode: 'evaluate',
      accountEval: 2_000_000,
      maintenanceMargin: 80_000,
      entrustedMargin: 200_000,
      contracts: 2,
      contractAmount: 3_800_000,
      contractMultiplier: 1,
      currentPrice: 38_000,
      positionSide: 'long',
    },
    expected: {
      contractNotional: 7_600_000,
      maintenanceMargin: 80_000,
      entrustedMargin: 200_000,
      liquidationPrice: 28_400,
      toleranceRate: 25.26,
      toleranceDelta: 9_600,
      leverageRatio: 38,
      maxBuyable: 18,
      isAtRisk: false,
    },
  },

  // ── 홍콩: HSI 미니 숏, 다계약 ──
  {
    id: 'hk-hsi-short',
    market: 'HK',
    description: '홍콩 — HSI 미니 5계약 숏, 비율 입력',
    inputs: {
      mode: 'evaluate',
      accountEval: 500_000,
      maintenanceMarginRate: 0.06,
      entrustedMarginRate: 0.12,
      contracts: 5,
      contractAmount: 50_000,
      contractMultiplier: 1,
      currentPrice: 18_000,
      positionSide: 'short',
    },
    expected: {
      contractNotional: 250_000,
      maintenanceMargin: 15_000,
      entrustedMargin: 30_000,
      liquidationPrice: 52_920,
      toleranceRate: 194,
      toleranceDelta: 34_920,
      leverageRatio: 250_000 / 30_000,
      maxBuyable: 78,
      isAtRisk: false,
    },
  },

  // ── 유럽: DAX 선물 숏 ──
  {
    id: 'eu-dax-short',
    market: 'EU',
    description: '독일 DAX 1계약 숏 — EUR 계좌',
    inputs: {
      mode: 'evaluate',
      accountEval: 40_000,
      maintenanceMarginRate: 0.04,
      entrustedMarginRate: 0.08,
      contracts: 1,
      contractAmount: 450_000,
      contractMultiplier: 1,
      currentPrice: 18_000,
      positionSide: 'short',
    },
    expected: {
      contractNotional: 450_000,
      maintenanceMargin: 18_000,
      entrustedMargin: 36_000,
      liquidationPrice: 18_880,
      toleranceRate: 4.889,
      toleranceDelta: 880,
      leverageRatio: 12.5,
      maxBuyable: 0,
      isAtRisk: false,
    },
  },

  // ── 원자재: COMEX 금 선물 롱 ──
  {
    id: 'us-gold-long',
    market: 'US',
    description: '미국 — COMEX 금 1계약 롱 (100oz)',
    inputs: {
      mode: 'evaluate',
      accountEval: 100_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.08,
      contracts: 1,
      contractAmount: 200_000,
      contractMultiplier: 1,
      currentPrice: 2_000,
      positionSide: 'long',
    },
    expected: {
      contractNotional: 200_000,
      maintenanceMargin: 10_000,
      entrustedMargin: 16_000,
      liquidationPrice: 1_100,
      toleranceRate: 45,
      toleranceDelta: 900,
      leverageRatio: 12.5,
      maxBuyable: 5,
      isAtRisk: false,
    },
  },

  // ── 한국: KOSPI200 대형 승수 (표준) ──
  {
    id: 'kr-kospi-standard-long',
    market: 'KR',
    description: '한국 — KOSPI200 표준 10계약, 승수 10',
    inputs: {
      mode: 'evaluate',
      accountEval: 50_000_000,
      maintenanceMarginRate: 0.2,
      entrustedMarginRate: 0.25,
      contracts: 10,
      contractAmount: 200_000,
      contractMultiplier: 10,
      currentPrice: 30_000,
      positionSide: 'long',
    },
    expected: {
      contractNotional: 20_000_000,
      maintenanceMargin: 4_000_000,
      entrustedMargin: 5_000_000,
      liquidationPrice: -39_000,
      toleranceRate: 230,
      toleranceDelta: 69_000,
      leverageRatio: 4,
      maxBuyable: 90,
      isAtRisk: false,
    },
  },

  // ── 위험: 유지증거금 ≥ 계좌평가 ──
  {
    id: 'risk-maintenance-exceeds-equity',
    market: 'KR',
    description: '이미 청산 직전 — 유지증거금이 평가금액 초과',
    inputs: {
      mode: 'evaluate',
      accountEval: 20_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
    },
    expected: {
      liquidationPrice: undefined,
      liquidationMessage: 'maintenance_exceeds_equity',
      isAtRisk: true,
    },
  },

  // ── 위험: 버퍼 거의 없음 (1% 여유) ──
  {
    id: 'risk-tight-buffer',
    market: 'US',
    description: '미국 — ES 2계약, 청산까지 1% 여유',
    inputs: {
      mode: 'evaluate',
      accountEval: 30_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
    },
    expected: {
      liquidationPrice: 4_950,
      toleranceRate: 1,
      toleranceDelta: 50,
      isAtRisk: false,
    },
  },

  // ── 검증: 유지 > 위탁 비율 오류 ──
  {
    id: 'error-maintenance-rate-exceeds',
    market: 'KR',
    description: '잘못된 입력 — 유지증거금률 > 위탁증거금률',
    inputs: {
      mode: 'evaluate',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.15,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
    },
    expected: {
      liquidationMessage: 'maintenance_rate_exceeds_entrusted',
    },
  },

  // ── 검증: 여유 증거금 없음 ──
  {
    id: 'no-available-margin',
    market: 'US',
    description: '미국 — 위탁증거금이 계좌평가와 동일, 추가매수 불가',
    inputs: {
      mode: 'evaluate',
      accountEval: 40_000,
      maintenanceMarginRate: 0.04,
      entrustedMarginRate: 0.08,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
    },
    expected: {
      maxBuyable: 0,
      maxBuyableMessage: 'no_available_margin',
    },
  },
]

/** 주문 시뮬레이션 시나리오 */
const orderScenarios: {
  id: string
  description: string
  inputs: CalculatorInputs
  expected: {
    beforeLiquidation?: number
    afterLiquidation?: number
    liquidationDelta?: number
    beforeLeverageRatio?: number
    afterLeverageRatio?: number
    isAtRiskBefore?: boolean
    isAtRiskAfter?: boolean
    orderMessage?: string
    orderCapacityMessage?: string
  }
}[] = [
  {
    id: 'order-kr-add-contract',
    description: '한국 KOSPI200 — 2계약에서 1계약 추가 매수',
    inputs: {
      mode: 'order',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
      orderContracts: 1,
    },
    expected: {
      beforeLiquidation: -6_632.5,
      afterLiquidation: -4_299.17,
      liquidationDelta: 2_333.33,
      beforeLeverageRatio: 10,
      afterLeverageRatio: 10,
      isAtRiskBefore: false,
      isAtRiskAfter: false,
    },
  },
  {
    id: 'order-us-short-add',
    description: '미국 ES 숏 — 1계약에서 1계약 추가 (총 2), 가용 증거금 한도 이내',
    inputs: {
      mode: 'order',
      accountEval: 50_000,
      maintenanceMarginRate: 0.04,
      entrustedMarginRate: 0.08,
      contracts: 1,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'short',
      orderContracts: 1,
    },
    expected: {
      beforeLiquidation: 5_800,
      afterLiquidation: 5_300,
      liquidationDelta: -500,
      beforeLeverageRatio: 12.5,
      afterLeverageRatio: 12.5,
      isAtRiskBefore: false,
      isAtRiskAfter: false,
    },
  },
  {
    id: 'order-us-short-overleverage',
    description: '미국 ES 숏 — 추가 매수 후 유지증거금 초과 (위험)',
    inputs: {
      mode: 'order',
      accountEval: 25_000,
      maintenanceMarginRate: 0.04,
      entrustedMarginRate: 0.08,
      contracts: 1,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'short',
      orderContracts: 2,
    },
    expected: {
      beforeLiquidation: 5_300,
      afterLiquidation: undefined,
      orderMessage: 'order_exceeds_max_buyable',
      orderCapacityMessage: 'order_exceeds_max_buyable',
      isAtRiskBefore: false,
      isAtRiskAfter: true,
    },
  },
  {
    id: 'order-jp-direct-add',
    description: '일본 니케이 — 직접 증거금, 2→3계약 추가',
    inputs: {
      mode: 'order',
      accountEval: 50_000,
      maintenanceMargin: 2_000,
      entrustedMargin: 12_000,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
      orderContracts: 1,
    },
    expected: {
      beforeLiquidation: 4_520,
      afterLiquidation: 4_686.67,
      liquidationDelta: 166.67,
      beforeLeverageRatio: 500_000 / 12_000,
      afterLeverageRatio: 750_000 / 18_000,
      isAtRiskBefore: false,
      isAtRiskAfter: false,
    },
  },
  {
    id: 'order-zero-contracts',
    description: '주문 계약수 0 — 시뮬레이션 불가',
    inputs: {
      mode: 'order',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractAmount: 250_000,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
      orderContracts: 0,
    },
    expected: {
      afterLiquidation: undefined,
      orderMessage: 'order_contracts_zero',
    },
  },
]

describe.each(scenarios)('시나리오 [$id] $description', (scenario) => {
  it('calculateEvaluate 정답값 일치', () => {
    const result = calculateEvaluate(scenario.inputs)
    const exp = scenario.expected

    if (exp.liquidationPrice != null) {
      expect(result.liquidationPrice).toBeCloseTo(exp.liquidationPrice, 0)
    } else if (exp.liquidationMessage === 'maintenance_exceeds_equity') {
      expect(result.liquidationPrice).toBeNull()
    }

    if (exp.toleranceRate != null) {
      expect(result.toleranceRate).toBeCloseTo(exp.toleranceRate, 1)
    }
    if (exp.toleranceDelta != null) {
      expect(result.toleranceDelta).toBeCloseTo(exp.toleranceDelta, 0)
    }
    if (exp.contractNotional != null) {
      expect(result.margins?.contractNotional).toBeCloseTo(exp.contractNotional, 0)
    }
    if (exp.maintenanceMargin != null) {
      expect(result.margins?.maintenanceMargin).toBeCloseTo(exp.maintenanceMargin, 0)
    }
    if (exp.entrustedMargin != null) {
      expect(result.margins?.entrustedMargin).toBeCloseTo(exp.entrustedMargin, 0)
    }
    if (exp.leverageRatio != null) {
      expect(result.leverageRatio).toBeCloseTo(exp.leverageRatio, 1)
    }
    if (exp.maxBuyable != null) {
      expect(result.maxBuyable).toBe(exp.maxBuyable)
    }
    if (exp.isAtRisk != null) {
      expect(result.isAtRisk).toBe(exp.isAtRisk)
    }
    if (exp.liquidationMessage != null) {
      expect(result.liquidationMessage).toBe(exp.liquidationMessage)
    }
    if (exp.maxBuyableMessage != null) {
      expect(result.maxBuyableMessage).toBe(exp.maxBuyableMessage)
    }
  })
})

describe.each(orderScenarios)('주문 시뮬 [$id]', (scenario) => {
  it('calculateOrder 정답값 일치', () => {
    const result = calculateOrder(scenario.inputs)
    const exp = scenario.expected

    if (exp.beforeLiquidation != null) {
      expect(result.beforeLiquidation).toBeCloseTo(exp.beforeLiquidation, 0)
    }
    if (exp.afterLiquidation != null) {
      expect(result.afterLiquidation).toBeCloseTo(exp.afterLiquidation, 0)
    }
    if (exp.liquidationDelta != null) {
      expect(result.liquidationDelta).toBeCloseTo(exp.liquidationDelta, 0)
    }
    if (exp.beforeLeverageRatio != null) {
      expect(result.beforeLeverageRatio).toBeCloseTo(exp.beforeLeverageRatio, 1)
    }
    if (exp.afterLeverageRatio != null) {
      expect(result.afterLeverageRatio).toBeCloseTo(exp.afterLeverageRatio, 1)
    }
    if (exp.isAtRiskBefore != null) {
      expect(result.isAtRiskBefore).toBe(exp.isAtRiskBefore)
    }
    if (exp.isAtRiskAfter != null) {
      expect(result.isAtRiskAfter).toBe(exp.isAtRiskAfter)
    }
    if (exp.orderMessage != null) {
      expect(result.orderMessage).toBe(exp.orderMessage)
    }
    if (exp.orderCapacityMessage != null) {
      expect(result.orderCapacityMessage).toBe(exp.orderCapacityMessage)
    }
  })
})
