import { describe, expect, it } from 'vitest'
import type { CalculatorInputs, PositionSide } from '../types'
import { resolveEffectiveAccountEval } from './accountEval'
import { buildAfterOrderInputs, calculateEvaluate, calculateOrder, calcMaxBuyable, captureOrderScenarioBaseline } from './leverage'
import { applyInputPatch, applyPriceMove, canApplyOrder, resolveEvaluationInputs } from './mtmLink'
import { formatNumber } from '../utils/format'
import { formatRawNumericInput, normalizeInputValue, parseFormattedInput } from '../utils/inputFormat'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'


const base: CalculatorInputs = {
  mode: 'evaluate', marginInputMode: 'perContract', positionSide: 'long',
  accountEval: 27_000, contracts: 2, contractAmount: 75,
  contractAmountRole: 'entryPrice', currentPrice: 75, contractMultiplier: 1_000,
  maintenanceMarginPerContract: 6_000, entrustedMarginPerContract: 9_000,
  tickSize: 0.01,
}

function close(actual: number | null | undefined, expected: number) {
  expect(actual).not.toBeNull()
  expect(actual).not.toBeUndefined()
  expect(Math.abs(actual! - expected)).toBeLessThanOrEqual(Math.max(1, Math.abs(expected)) * 1e-10)
}

// Deterministic, diverse instruments. No production helper builds expected values.
function fixtures(side: PositionSide): CalculatorInputs[] {
  return Array.from({ length: 120 }, (_, index) => {
    const n = 2 + index % 19
    const multiplier = [1, 5, 50, 100, 1_000, 10_000][index % 6]
    const price = 40 + index * 7.125
    const maintenance = price * multiplier * (0.05 + (index % 7) / 100)
    return {
      ...base, positionSide: side, contracts: n, contractMultiplier: multiplier,
      currentPrice: price, contractAmount: price - 1.375,
      accountEval: n * maintenance + n * multiplier * price * 0.2,
      maintenanceMarginPerContract: maintenance,
      entrustedMarginPerContract: maintenance * 1.25,
    }
  })
}

// Independent cash + realized/unrealized P&L ledger, rather than copying fillPnl.
function ledgerAfter(input: CalculatorInputs, order: number, fill: number) {
  const sign = input.positionSide === 'long' ? 1 : -1
  const n = input.contracts!
  const multiplier = input.contractMultiplier!
  const entry = input.contractAmount!
  const mark = input.currentPrice!
  const cash = input.accountEval! - sign * (mark - entry) * n * multiplier
  const closed = Math.max(0, -order)
  const realized = sign * (fill - entry) * closed * multiplier
  const nextN = n + order
  const nextEntry = nextN === 0 ? 0 : order > 0 ? (entry * n + fill * order) / nextN : entry
  return {
    equity: cash + realized + sign * (mark - nextEntry) * nextN * multiplier,
    contracts: nextN,
    entry: nextEntry,
  }
}

describe.each(['long', 'short'] as const)('perContract independent audit: %s', (side) => {
  it('balances equity against fixed maintenance across 120 instruments', () => {
    for (const input of fixtures(side)) {
      const n = input.contracts!, k = input.contractMultiplier!, c = input.currentPrice!
      const e = input.accountEval!, m = input.maintenanceMarginPerContract!, i = input.entrustedMarginPerContract!
      const sign = side === 'long' ? 1 : -1
      const result = calculateEvaluate(input)
      const p = result.liquidationPrice!
      close(e + sign * (p - c) * n * k, n * m)
      close(result.margins?.maintenanceMargin, n * m)
      close(result.margins?.entrustedMargin, n * i)
      close(result.margins?.maintenanceExcess, e - n * m)
      close(result.margins?.availableMargin, e - n * i)
      close(result.leverageRatio, c * n * k / e)
      close(result.toleranceDelta, (e - n * m) / (n * k))
      const additional = result.maxBuyable!
      expect((n + additional) * i).toBeLessThanOrEqual(e + 1e-7)
      expect((n + additional + 1) * i).toBeGreaterThan(e)
      // The adverse next tick must be below the maintenance threshold.
      expect(e + sign * (p - sign * input.tickSize! - c) * n * k).toBeLessThan(n * m)
    }
  })

  it('keeps the same threshold and fixed margins after mark-to-market moves', () => {
    for (const input of fixtures(side)) {
      const before = calculateEvaluate(input)
      for (const delta of [-2.75, 0.01, 3.125]) {
        const moved = { ...input, ...applyPriceMove(input, input.currentPrice! + delta) }
        const after = calculateEvaluate(moved)
        close(after.liquidationPrice, before.liquidationPrice!)
        close(after.margins?.maintenanceMargin, before.margins!.maintenanceMargin)
        close(after.margins?.entrustedMargin, before.margins!.entrustedMargin)
      }
    }
  })

  it('agrees with a cash ledger for additions, reductions and full closes', () => {
    for (const input of fixtures(side)) {
      for (const order of [1, 3, -1, -input.contracts!]) {
        const fill = input.currentPrice! + (order > 0 ? 0.375 : -0.625)
        const expected = ledgerAfter(input, order, fill)
        const orderInput = { ...input, orderContracts: order, orderPrice: fill }
        const result = calculateOrder(orderInput)
        const after = buildAfterOrderInputs(orderInput, expected.contracts, order)
        close(after.accountEval, expected.equity)
        close(after.contractAmount, expected.entry)
        close(result.afterMargins?.maintenanceMargin, expected.contracts * input.maintenanceMarginPerContract!)
        close(result.afterMargins?.entrustedMargin, expected.contracts * input.entrustedMarginPerContract!)
        close(result.afterMargins?.availableMargin,
          expected.equity - expected.contracts * input.entrustedMarginPerContract!)
        if (expected.contracts > 0) {
          const sign = side === 'long' ? 1 : -1
          close(expected.equity + sign * (result.afterLiquidation! - input.currentPrice!) *
            expected.contracts * input.contractMultiplier!,
          expected.contracts * input.maintenanceMarginPerContract!)
        } else {
          expect(result.afterLiquidation).toBeNull()
          expect(result.afterLeverageRatio).toBeNull()
        }
      }
    }
  })

  it('preview, apply, undo, cancel and storage preserve a valid order ledger', () => {
    const input = { ...base, positionSide: side, orderContracts: 1, orderPrice: 76 }
    const expected = ledgerAfter(input, 1, 76)
    const preview = applyInputPatch(input, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(input)) })
    close(preview.accountEval, input.accountEval!)
    close(resolveEvaluationInputs(preview).accountEval, expected.equity)
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    close(applied.accountEval, expected.equity)
    close(applied.contracts, expected.contracts)
    close(calculateEvaluate(applied).margins?.maintenanceMargin, 18_000)
    const undo = applyInputPatch(applied, { undoOrderApply: true })
    close(resolveEvaluationInputs(undo).accountEval, expected.equity)
    const canceled = applyInputPatch(undo, { clearOrderScenario: true })
    close(canceled.accountEval, input.accountEval!)
    close(canceled.contracts, input.contracts!)
    const restored = parseStoredCalculatorInputs(JSON.parse(JSON.stringify(applied)))!
    expect(calculateEvaluate(restored)).toEqual(calculateEvaluate(applied))
  })

  it('classifies exact maintenance equality and either side of it', () => {
    for (const delta of [-1, 0, 1]) {
      const result = calculateEvaluate({ ...base, positionSide: side, accountEval: 12_000 + delta })
      expect(result.isAtRisk).toBe(delta <= 0)
      close(result.margins?.maintenanceExcess, delta)
      if (delta === 0) close(result.liquidationPrice, 75)
    }
  })
})

it('ignores inactive rate/total fields for fixed margin and liquidation', () => {
  const before = calculateEvaluate(base)
  expect(calculateEvaluate({ ...base, maintenanceMarginRate: 0.99, entrustedMarginRate: 0.01,
    maintenanceMargin: 99_999, entrustedMargin: 1, totalMarginKind: 'proportional' })).toEqual(before)
})

it('supports a flat account opening and a zero-available-margin boundary', () => {
  const flat = { ...base, contracts: 0, contractAmount: undefined, accountEval: 18_000 }
  expect(calculateEvaluate(flat).maxBuyable).toBe(2)
  const opened = calculateOrder({ ...flat, orderContracts: 2, orderPrice: 75 })
  close(opened.afterMargins?.availableMargin, 0)
  close(opened.afterMargins?.maintenanceMargin, 12_000)
  close(opened.afterLiquidation, 72)
})

it('is invariant to currency scaling and more equity moves the threshold away', () => {
  for (const side of ['long', 'short'] as const) {
    const input = { ...base, positionSide: side }
    const before = calculateEvaluate(input)
    for (const factor of [0.01, 1_350, 1_000_000]) {
      const scaled = calculateEvaluate({ ...input, accountEval: input.accountEval! * factor,
        contractMultiplier: input.contractMultiplier! * factor,
        maintenanceMarginPerContract: input.maintenanceMarginPerContract! * factor,
        entrustedMarginPerContract: input.entrustedMarginPerContract! * factor })
      close(scaled.liquidationPrice, before.liquidationPrice!)
      close(scaled.leverageRatio, before.leverageRatio!)
      expect(scaled.maxBuyable).toBe(before.maxBuyable)
    }
    const richer = calculateEvaluate({ ...input, accountEval: 28_000 })
    expect(richer.toleranceDelta!).toBeGreaterThan(before.toleranceDelta!)
  }
})

it('retains explicit model boundaries: positive prices and both margin specifications', () => {
  // Characterization, not a claim these restrictions cover all futures markets.
  expect(calculateEvaluate({ ...base, currentPrice: 0 }).liquidationPrice).toBeNull()
  expect(calculateEvaluate({ ...base, currentPrice: -1 }).liquidationPrice).toBeNull()
  expect(calculateEvaluate({ ...base, accountEval: 200_000 }).liquidationPrice).toBeNull()
  expect(calculateEvaluate({ ...base, entrustedMarginPerContract: undefined }).liquidationPrice).toBeNull()
})

describe('audit regression checks and intentional display policy', () => {
  it('F1: decimal price input preserves 75.25', () => {
    expect(parseFormattedInput(formatRawNumericInput('75.25', true))).toBe(75.25)
  })
  it('F1: a valid 0.001 tick must survive the decimal input normalizer', () => {
    expect(normalizeInputValue(0.001, { allowDecimal: true })).toBe(0.001)
  })
  it('F2: intentionally rounds the display without changing the calculated threshold', () => {
    const result = calculateEvaluate({ ...base, accountEval: 27_320 })
    close(result.liquidationPrice, 67.34)
    expect(formatNumber(result.liquidationPrice)).toBe('67')
  })
  it('F3: side-switch unrealized P&L must use the constant contract multiplier', () => {
    const input = { ...base, contractAmount: 70, positionSide: 'short' as const, evalSnapshotSide: 'long' as const }
    // Original cash = 27,000 - (75-70)*2*1,000 = 17,000.
    // The same cash with a short is worth 17,000 - 10,000 = 7,000.
    expect(resolveEffectiveAccountEval(input, 'long')).toBe(7_000)
  })
  it('F3: liquidation and maintenance excess must use the same equity after switching side', () => {
    const input = { ...base, contractAmount: 70, positionSide: 'short' as const, evalSnapshotSide: 'long' as const }
    const result = calculateEvaluate(input)
    // This consistency invariant holds regardless of the chosen side-switch policy.
    close(result.margins?.maintenanceExcess,
      (result.liquidationPrice! - input.currentPrice!) * input.contracts! * input.contractMultiplier!)
  })
  it('F4: an adverse fill that exceeds initial margin must raise a capacity warning', () => {
    const result = calculateOrder({ ...base, orderContracts: 1, orderPrice: 76 })
    expect(result.afterMargins?.availableMargin).toBe(-1_000)
    expect(result.orderCapacityMessage).toBe('order_exceeds_max_buyable')
  })
  it('F5: applying an over-reduction must not create negative held contracts', () => {
    const input = { ...base, orderContracts: -3, orderPrice: 75 }
    expect(calculateOrder(input).orderMessage).toBe('order_exceeds_position')
    const preview = applyInputPatch(input, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(input)) })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    expect(applied.contracts).toBeGreaterThanOrEqual(0)
  })
  it('F6: total explicitly declared fixed must have the same threshold as perContract', () => {
    const total = { ...base, marginInputMode: 'total' as const, totalMarginKind: 'fixed' as const,
      maintenanceMargin: 12_000, entrustedMargin: 18_000 }
    close(calculateEvaluate(total).liquidationPrice, calculateEvaluate(base).liquidationPrice!)
  })
  it('F7: entry-optional fixed mode must derive notional from current price and multiplier', () => {
    const input = { ...base, contractAmount: undefined, contractAmountRole: undefined }
    const result = calculateEvaluate(input)
    close(result.liquidationPrice, 67.5)
    expect(result.margins?.contractNotional).toBe(150_000)
  })
  it('F8: integer capacity must not admit a contract with one currency unit missing', () => {
    // All inputs are exact safe integers, so this is not unavoidable FP loss.
    expect(calcMaxBuyable(2_999_999_999, 2_000_000_000, 1_000_000_000).value).toBe(0)
    expect(calcMaxBuyable(0.3, 0.2, 0.1).value).toBe(1)
    expect(calcMaxBuyable(0.29999999999999993, 0.2, 0.1).value).toBe(0)
    expect(calcMaxBuyable(3e-8, 2e-8, 1e-8).value).toBe(1)
    expect(calcMaxBuyable(2e15 - 0.5, 1e15, 1e15).value).toBe(0)
  })
})

describe.each(['long', 'short'] as const)('stateful regression: %s', (side) => {
  it('agrees with the independent ledger through add, reduce, re-add and full close', () => {
    let state = { ...base, positionSide: side, accountEval: 60_000 }
    for (const [order, fill] of [[2, 75.25], [-1, 76.125], [1, 74.625], [-4, 73.75]]) {
      const expected = ledgerAfter(state, order, fill)
      const entered = { ...state, orderContracts: order, orderPrice: fill }
      const preview = applyInputPatch(entered, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(entered)) })
      close(resolveEvaluationInputs(preview).accountEval, expected.equity)
      state = applyInputPatch(preview, { applyOrderScenario: true }) as typeof state
      close(state.accountEval, expected.equity)
      close(state.contracts, expected.contracts)
      close(state.contractAmount, expected.entry)
      close(calculateEvaluate(state).margins?.availableMargin, expected.equity - expected.contracts * 9_000)
    }
  })

  it('uses the same equity after a direction switch, MTM move, order and reload', () => {
    const input = { ...base, positionSide: side, contractAmount: 70 }
    const opposite = side === 'long' ? 'short' : 'long'
    const sign = side === 'long' ? 1 : -1
    const switched = applyInputPatch(input, { positionSide: opposite })
    close(switched.accountEval, 27_000 - sign * 20_000)
    close(applyInputPatch(switched, { positionSide: side }).accountEval, 27_000)
    const moved = applyInputPatch(switched, { commitCurrentPrice: 76 })
    close(moved.accountEval, switched.accountEval! - sign * 2_000)
    const orderInput = { ...moved, orderContracts: -1, orderPrice: 76.25 }
    const expected = ledgerAfter(orderInput, -1, 76.25)
    const preview = applyInputPatch(orderInput, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(orderInput)) })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    close(applied.accountEval, expected.equity)
    const restored = parseStoredCalculatorInputs(JSON.parse(JSON.stringify(applied)))!
    expect(calculateEvaluate(restored)).toEqual(calculateEvaluate(applied))
  })

  it('warns only for additions whose actual fill leaves an initial-margin deficit', () => {
    const input = { ...base, positionSide: side }
    const adverse = side === 'long' ? 76 : 74
    expect(calculateOrder({ ...input, orderContracts: 1, orderPrice: adverse }).isAtRiskAfter).toBe(true)
    const favorable = side === 'long' ? 70 : 80
    expect(calculateOrder({ ...input, orderContracts: 2, orderPrice: favorable }).orderCapacityMessage).toBeNull()
    expect(calculateOrder({ ...input, accountEval: 1_000, orderContracts: -1, orderPrice: adverse }).orderCapacityMessage).toBeNull()
    expect(calculateOrder({ ...input, orderContracts: 1, orderPrice: 75 }).orderCapacityMessage).toBeNull()
  })

  it('keeps fixed total margins equivalent through preview, apply, undo and full close', () => {
    const total: CalculatorInputs = { ...base, positionSide: side, marginInputMode: 'total', totalMarginKind: 'fixed',
      maintenanceMargin: 12_000, entrustedMargin: 18_000, orderContracts: 1, orderPrice: 75.25 }
    const perContract = { ...total, marginInputMode: 'perContract' as const }
    const preview = applyInputPatch(total, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(total)) })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    expect(applied.maintenanceMargin).toBe(18_000)
    expect(applied.entrustedMargin).toBe(27_000)
    close(calculateEvaluate(preview).liquidationPrice, calculateOrder(perContract).afterLiquidation!)
    close(calculateEvaluate(applied).liquidationPrice, calculateOrder(perContract).afterLiquidation!)
    const undone = applyInputPatch(applied, { undoOrderApply: true })
    expect(undone.maintenanceMargin).toBe(12_000)
    expect(undone.entrustedMargin).toBe(18_000)
    close(calculateEvaluate(undone).liquidationPrice, calculateEvaluate(preview).liquidationPrice!)
    const canceled = applyInputPatch(undone, { clearOrderScenario: true })
    close(calculateEvaluate(canceled).liquidationPrice, calculateEvaluate(total).liquidationPrice!)
    const fullClose = { ...total, orderContracts: -2 }
    const flat = applyInputPatch(applyInputPatch(fullClose, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(fullClose)) }), { applyOrderScenario: true })
    expect(calculateEvaluate(flat).margins?.maintenanceMargin).toBe(0)
    expect(calculateEvaluate(flat).margins?.entrustedMargin).toBe(0)
    const reopen = { ...flat, orderContracts: 1, orderPrice: 75 }
    expect(canApplyOrder(reopen)).toBe(false)
    expect(calculateOrder(reopen).afterMargins).toBeNull()
  })
})

it('rejects invalid orders even after editing an active preview or restoring it', () => {
  const input = { ...base, orderContracts: 1, orderPrice: 75 }
  const preview = applyInputPatch(input, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(input)) })
  for (const orderContracts of [-3, 0, 0.5, Infinity]) {
    const invalid = { ...preview, orderContracts }
    expect(canApplyOrder(invalid)).toBe(false)
    expect(resolveEvaluationInputs(invalid).contracts).toBe(2)
    expect(applyInputPatch(invalid, { applyOrderScenario: true }).contracts).toBe(2)
    const restored = parseStoredCalculatorInputs(JSON.parse(JSON.stringify(invalid)))!
    expect(applyInputPatch(restored, { applyOrderScenario: true }).contracts).toBe(2)
  }
  expect(calculateEvaluate({ ...base, contractAmountRole: 'fixedSpec', contractAmount: 250_000 }).margins?.contractNotional).toBe(500_000_000)
})
