import { env } from 'node:process'
import { describe, expect, it } from 'vitest'
import type { CalculatorInputs, PositionSide } from '../types'
import { resolveEffectiveAccountEval } from './accountEval'
import { buildAfterOrderInputs, calculateEvaluate, calculateOrder, calcMaxBuyable, captureOrderScenarioBaseline } from './leverage'
import { applyInputPatch, applyPriceMove, resolveEvaluationInputs } from './mtmLink'
import { formatNumber } from '../utils/format'
import { formatRawNumericInput, normalizeInputValue, parseFormattedInput } from '../utils/inputFormat'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'

// Audit only: application behavior is deliberately unchanged. Expected failures
// assert the desired financial invariant, not the current defective output.
// LIQGUARD_AUDIT_STRICT=1 exposes every known defect as a normal failing test.
const knownIssue = env.LIQGUARD_AUDIT_STRICT === '1' ? it : it.fails

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

describe('open audit findings — expected failures, NOT fixes', () => {
  knownIssue('F1: price input must preserve 75.25 instead of silently producing 7525', () => {
    expect(parseFormattedInput(formatRawNumericInput('75.25', false))).toBe(75.25)
  })
  knownIssue('F1: a valid 0.001 tick must survive the decimal input normalizer', () => {
    expect(normalizeInputValue(0.001, { allowDecimal: true })).toBe(0.001)
  })
  knownIssue('F2: a liquidation threshold on a cent tick must remain visible', () => {
    const result = calculateEvaluate({ ...base, accountEval: 27_320 })
    close(result.liquidationPrice, 67.34)
    expect(formatNumber(result.liquidationPrice)).toBe('67.34')
  })
  knownIssue('F3: side-switch unrealized P&L must use the constant contract multiplier', () => {
    const input = { ...base, contractAmount: 70, positionSide: 'short' as const, evalSnapshotSide: 'long' as const }
    // Original cash = 27,000 - (75-70)*2*1,000 = 17,000.
    // The same cash with a short is worth 17,000 - 10,000 = 7,000.
    expect(resolveEffectiveAccountEval(input, 'long')).toBe(7_000)
  })
  knownIssue('F3: liquidation and maintenance excess must use the same equity after switching side', () => {
    const input = { ...base, contractAmount: 70, positionSide: 'short' as const, evalSnapshotSide: 'long' as const }
    const result = calculateEvaluate(input)
    // This consistency invariant holds regardless of the chosen side-switch policy.
    close(result.margins?.maintenanceExcess,
      (result.liquidationPrice! - input.currentPrice!) * input.contracts! * input.contractMultiplier!)
  })
  knownIssue('F4: an adverse fill that exceeds initial margin must raise a capacity warning', () => {
    const result = calculateOrder({ ...base, orderContracts: 1, orderPrice: 76 })
    expect(result.afterMargins?.availableMargin).toBe(-1_000)
    expect(result.orderCapacityMessage).toBe('order_exceeds_max_buyable')
  })
  knownIssue('F5: applying an over-reduction must not create negative held contracts', () => {
    const input = { ...base, orderContracts: -3, orderPrice: 75 }
    expect(calculateOrder(input).orderMessage).toBe('order_exceeds_position')
    const preview = applyInputPatch(input, { commitOrderScenario: captureOrderScenarioBaseline(calculateOrder(input)) })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    expect(applied.contracts).toBeGreaterThanOrEqual(0)
  })
  knownIssue('F6: total explicitly declared fixed must have the same threshold as perContract', () => {
    const total = { ...base, marginInputMode: 'total' as const, totalMarginKind: 'fixed' as const,
      maintenanceMargin: 12_000, entrustedMargin: 18_000 }
    close(calculateEvaluate(total).liquidationPrice, calculateEvaluate(base).liquidationPrice!)
  })
  knownIssue('F7: entry-optional fixed mode must derive notional from current price and multiplier', () => {
    const input = { ...base, contractAmount: undefined, contractAmountRole: undefined }
    const result = calculateEvaluate(input)
    close(result.liquidationPrice, 67.5)
    expect(result.margins?.contractNotional).toBe(150_000)
  })
  knownIssue('F8: integer capacity must not admit a contract with one currency unit missing', () => {
    // All inputs are exact safe integers, so this is not unavoidable FP loss.
    expect(calcMaxBuyable(2_999_999_999, 2_000_000_000, 1_000_000_000).value).toBe(0)
  })
})
