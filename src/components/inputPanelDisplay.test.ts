import { describe, expect, it } from 'vitest'
import { calculateOrder, captureOrderScenarioBaseline } from '../calc/leverage'
import { applyInputPatch } from '../calc/mtmLink'
import type { CalculatorInputs } from '../types'
import { resolveInputPanelDisplayInputs } from './inputPanelDisplay'

const orderInputs: CalculatorInputs = {
  mode: 'order',
  positionSide: 'long',
  accountEval: 1_000_000,
  maintenanceMarginRate: 0.05,
  entrustedMarginRate: 0.1,
  contracts: 10,
  contractAmount: 100,
  contractAmountRole: 'entryPrice',
  contractMultiplier: 1,
  currentPrice: 105,
  orderContracts: 2,
  orderPrice: 110,
}

describe('resolveInputPanelDisplayInputs', () => {
  it('shows post-order account values during order scenario without mutating raw inputs', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderInputs))
    const preview = applyInputPatch(orderInputs, { commitOrderScenario: baseline })
    const display = resolveInputPanelDisplayInputs(preview)

    expect(preview.accountEval).toBe(orderInputs.accountEval)
    expect(preview.contracts).toBe(orderInputs.contracts)
    expect(preview.contractAmount).toBe(orderInputs.contractAmount)

    expect(display.accountEval).toBe(999_990)
    expect(display.contracts).toBe(12)
    expect(display.contractAmount).toBeCloseTo(101.6666667, 6)
  })

  it('keeps raw inputs for price scenario previews', () => {
    const preview = applyInputPatch(orderInputs, { commitScenarioPrice: 100 })

    expect(resolveInputPanelDisplayInputs(preview)).toBe(preview)
  })
})
