import { buildAfterOrderInputs, calculateEvaluate, calculateOrder } from '../calc/leverage'
import type { CalculatorInputs, MarginInputMode } from '../types'

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

export function buildExampleInputs(example: CalculatorExample, marginInputMode: MarginInputMode): CalculatorInputs {
  const initial = { ...example.inputs }
  const notional = initial.currentPrice! * initial.contractMultiplier!
  const maintenance = initial.maintenanceMarginPerContract ?? notional * initial.maintenanceMarginRate!
  const entrusted = initial.entrustedMarginPerContract ?? notional * initial.entrustedMarginRate!
  delete initial.maintenanceMarginRate
  delete initial.entrustedMarginRate
  delete initial.maintenanceMarginPerContract
  delete initial.entrustedMarginPerContract
  delete initial.maintenanceMargin
  delete initial.entrustedMargin
  delete initial.totalMarginKind
  initial.marginInputMode = marginInputMode
  if (marginInputMode === 'rate') {
    initial.maintenanceMarginRate = maintenance / notional
    initial.entrustedMarginRate = entrusted / notional
  } else if (marginInputMode === 'perContract') {
    initial.maintenanceMarginPerContract = maintenance
    initial.entrustedMarginPerContract = entrusted
  } else {
    initial.maintenanceMargin = maintenance * initial.contracts!
    initial.entrustedMargin = entrusted * initial.contracts!
    initial.totalMarginKind = 'proportional'
  }
  return initial
}

export function buildExampleStages(example: CalculatorExample, marginInputMode = example.inputs.marginInputMode ?? 'rate') {
  const initial = buildExampleInputs(example, marginInputMode)
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
