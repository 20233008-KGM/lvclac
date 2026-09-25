import { buildAfterOrderInputs, calculateEvaluate, calculateOrder } from '../calc/leverage'
import type { CalculatorInputs } from '../types'

export type ExampleProduct = 'stock' | 'index' | 'commodity'

interface CalculatorExample {
  id: ExampleProduct
  currency: 'KRW' | 'USD'
  inputs: CalculatorInputs
  add: number
  reduce: number
}

// Fictional teaching scenarios, not current exchange prices or margin requirements.
export const calculatorExamples: readonly CalculatorExample[] = [
  {
    id: 'stock', currency: 'USD', add: 2, reduce: 4,
    inputs: {
      mode: 'evaluate', positionSide: 'long', marginInputMode: 'rate',
      tickSize: 10, accountEval: 10_000, currentPrice: 250, contracts: 10,
      contractMultiplier: 10, contractAmount: 250, contractAmountRole: 'entryPrice',
      maintenanceMarginRate: 0.12, entrustedMarginRate: 0.18,
    },
  },
  {
    id: 'index', currency: 'USD', add: 1, reduce: 2,
    inputs: {
      mode: 'evaluate', positionSide: 'long', marginInputMode: 'rate',
      tickSize: 0.25, accountEval: 150_000, currentPrice: 5_000, contracts: 2,
      contractMultiplier: 50, contractAmount: 5_000, contractAmountRole: 'entryPrice',
      maintenanceMarginRate: 0.08, entrustedMarginRate: 0.12,
    },
  },
  {
    id: 'commodity', currency: 'USD', add: 1, reduce: 2,
    inputs: {
      mode: 'evaluate', positionSide: 'long', marginInputMode: 'perContract',
      tickSize: 10, accountEval: 30_000, currentPrice: 75, contracts: 2,
      contractMultiplier: 1_000, contractAmount: 75, contractAmountRole: 'entryPrice',
      maintenanceMarginPerContract: 5_000, entrustedMarginPerContract: 6_000,
    },
  },
]

export function buildExampleStages(example: CalculatorExample) {
  const initial = { ...example.inputs }
  const addOrder: CalculatorInputs = {
    ...initial, mode: 'order', orderContracts: example.add, orderPrice: initial.currentPrice,
  }
  const added = buildAfterOrderInputs(addOrder, initial.contracts! + example.add, example.add)
  const reduceOrder: CalculatorInputs = {
    ...added, mode: 'order', orderContracts: -example.reduce, orderPrice: added.currentPrice,
  }
  const reduced = buildAfterOrderInputs(reduceOrder, added.contracts! - example.reduce, -example.reduce)
  return {
    initial, added, reduced,
    evaluation: calculateEvaluate(initial),
    addition: calculateOrder(addOrder),
    reduction: calculateOrder(reduceOrder),
  }
}
