import { describe, expect, it } from 'vitest'
import { calcPositionTickPnl } from '../calc/positionMetrics'
import { calculateEvaluate } from '../calc/leverage'
import { buildExampleInputs, buildExampleStages, calculatorExamples } from './calculatorExampleScenarios'

// Independently worked values: rate margin solves E + (P-C)*Q = P*Q*r;
// fixed margin solves E + (P-C)*Q = N*m. No production helper builds these expectations.
const expected = {
  stock: {
    tickPnl: [1000, 1200, 800], contracts: [10, 12, 8], liquidation: [170.4545455, 189.3939394, 142.0454545],
    maintenance: [3_000, 3_600, 2_400], initial: [4_500, 5_400, 3_600],
    leverage: [2.5, 3, 2],
  },
  index: {
    tickPnl: [25, 37.5, 12.5], contracts: [2, 3, 1], liquidation: [3804.3478261, 4347.826087, 2173.9130435],
    maintenance: [40_000, 60_000, 20_000], initial: [60_000, 90_000, 30_000],
    leverage: [10 / 3, 5, 5 / 3],
  },
  commodity: {
    tickPnl: [20000, 30000, 10000], contracts: [2, 3, 1], liquidation: [65, 70, 50],
    maintenance: [10_000, 15_000, 5_000], initial: [12_000, 18_000, 6_000], leverage: [5, 7.5, 2.5],
  },
}

describe.each(calculatorExamples)('$id teaching scenario', (example) => {
  it('matches independently calculated outcomes through both consecutive orders', () => {
    const stages = buildExampleStages(example)
    const oracle = expected[example.id]
    const results = [stages.evaluation, calculateEvaluate(stages.added), calculateEvaluate(stages.reduced)]
    ;[stages.initial, stages.added, stages.reduced].forEach((inputs, index) => {
      const result = results[index]
      expect(inputs.contracts).toBe(oracle.contracts[index])
      expect(calcPositionTickPnl(inputs)).toBeCloseTo(oracle.tickPnl[index], 8)
      expect(inputs.accountEval).toBe(example.inputs.accountEval)
      expect(result.liquidationPrice).toBeCloseTo(oracle.liquidation[index], 4)
      expect(result.margins?.maintenanceMargin).toBeCloseTo(oracle.maintenance[index], 4)
      expect(result.margins?.entrustedMargin).toBeCloseTo(oracle.initial[index], 4)
      expect(result.leverageRatio).toBeCloseTo(oracle.leverage[index], 6)
      expect(result.isAtRisk).toBe(false)
    })
    expect(stages.addition.beforeLiquidation).toBeCloseTo(oracle.liquidation[0], 4)
    expect(stages.addition.afterLiquidation).toBeCloseTo(oracle.liquidation[1], 4)
    expect(stages.reduction.beforeLiquidation).toBe(stages.addition.afterLiquidation)
    expect(stages.reduction.afterLiquidation).toBeCloseTo(oracle.liquidation[2], 4)
    for (const order of [stages.addition, stages.reduction]) {
      expect(order.orderMessage).toBeNull()
      expect(order.orderCapacityMessage).toBeNull()
      expect(order.isAtRiskAfter).toBe(false)
    }
  })

  it('returns independent snapshots without changing reusable fixtures', () => {
    const previous = structuredClone(example)
    const stages = buildExampleStages(example)
    stages.initial.accountEval = 1
    stages.added.contracts = 999
    expect(example).toEqual(previous)
    expect(buildExampleStages(example).reduced.contracts).toBe(expected[example.id].contracts[2])
  })
})

describe.each(calculatorExamples)('$id margin methods', (example) => {
  it.each(['rate', 'perContract', 'total'] as const)('%s matches independent margin and liquidation equations at every stage', (mode) => {
    const original = structuredClone(example)
    const stages = buildExampleStages(example, mode)
    const oracle = expected[example.id]
    const snapshots = [stages.initial, stages.added, stages.reduced]
    const liquidation: number[] = []
    snapshots.forEach((input, index) => {
      const result = calculateEvaluate(input)
      const price = example.inputs.currentPrice!
      const quantity = oracle.contracts[index] * example.inputs.contractMultiplier!
      const maintenance = oracle.maintenance[index]
      const equity = example.inputs.accountEval!
      // Fixed: E + (P-C)Q = M. Proportional: E + (P-C)Q = M(P/C).
      const expectedPrice = mode === 'perContract'
        ? price + (maintenance - equity) / quantity
        : (price * quantity - equity) / (quantity - maintenance / price)
      liquidation.push(expectedPrice)
      expect(input.contracts).toBe(oracle.contracts[index])
      expect(input.accountEval).toBe(equity)
      expect(result.margins?.maintenanceMargin).toBeCloseTo(maintenance, 8)
      expect(result.margins?.entrustedMargin).toBeCloseTo(oracle.initial[index], 8)
      expect(result.leverageRatio).toBeCloseTo(oracle.leverage[index], 8)
      expect(calcPositionTickPnl(input)).toBeCloseTo(oracle.tickPnl[index], 8)
      expect(result.liquidationPrice).toBeCloseTo(expectedPrice, 8)
      expect(result.isAtRisk).toBe(false)
      if (mode === 'total') {
        expect(input.totalMarginKind).toBe('proportional')
        expect(input.maintenanceMargin).toBeCloseTo(maintenance, 8)
        expect(input.entrustedMargin).toBeCloseTo(oracle.initial[index], 8)
      }
    })
    expect(stages.addition.beforeLiquidation).toBeCloseTo(liquidation[0], 8)
    expect(stages.addition.afterLiquidation).toBeCloseTo(liquidation[1], 8)
    expect(stages.reduction.beforeLiquidation).toBeCloseTo(liquidation[1], 8)
    expect(stages.reduction.afterLiquidation).toBeCloseTo(liquidation[2], 8)
    expect(stages.addition.orderMessage).toBeNull()
    expect(stages.reduction.orderMessage).toBeNull()
    expect(example).toEqual(original)
  })

  it('keeps only the selected margin fields and matches rate with proportional total', () => {
    for (const mode of ['rate', 'perContract', 'total'] as const) {
      const input = buildExampleInputs(example, mode)
      for (const field of ['maintenanceMargin', 'entrustedMargin'] as const) {
        expect(input[field] !== undefined).toBe(mode === 'total')
        expect(input[`${field}Rate`] !== undefined).toBe(mode === 'rate')
        expect(input[`${field}PerContract`] !== undefined).toBe(mode === 'perContract')
      }
      expect(input.totalMarginKind).toBe(mode === 'total' ? 'proportional' : undefined)
    }
    const rate = buildExampleStages(example, 'rate')
    const total = buildExampleStages(example, 'total')
    expect(total.evaluation.liquidationPrice).toBeCloseTo(rate.evaluation.liquidationPrice!, 8)
    expect(total.addition.afterLiquidation).toBeCloseTo(rate.addition.afterLiquidation!, 8)
    expect(total.reduction.afterLiquidation).toBeCloseTo(rate.reduction.afterLiquidation!, 8)
  })
})

it('retains the full commodity rate precision', () => {
  const input = buildExampleInputs(calculatorExamples[2], 'rate')
  expect(input.maintenanceMarginRate).toBe(5000 / 75000)
})
