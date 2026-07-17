import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import { calculateOrder, captureOrderScenarioBaseline } from '../calc/leverage'
import { applyInputPatch, isOrderScenarioModeActive } from '../calc/mtmLink'
import {
  CALCULATOR_HISTORY_LIMIT,
  commitCalculatorHistoryGroup,
  createCalculatorHistory,
  getCalculatorHistoryMoves,
  jumpCalculatorHistory,
  recordCalculatorHistory,
  redoCalculatorHistory,
  replaceCalculatorHistory,
  undoCalculatorHistory,
} from './calculatorHistory'

function inputs(accountEval: number, currentPrice = accountEval): CalculatorInputs {
  return {
    mode: 'evaluate',
    positionSide: 'long',
    accountEval,
    currentPrice,
  }
}

const markInputs: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  accountEval: 10_000_000,
  contracts: 2,
  contractAmount: 350,
  currentPrice: 350,
  contractMultiplier: 1,
}

const orderInputs: CalculatorInputs = {
  mode: 'order',
  positionSide: 'long',
  accountEval: 10_000_000,
  maintenanceMarginRate: 0.1,
  entrustedMarginRate: 0.2,
  contracts: 2,
  contractAmount: 350,
  currentPrice: 350,
  contractMultiplier: 1,
  orderContracts: 1,
  orderPrice: 345,
}

describe('calculator history', () => {
  it('undoes and redoes committed before/after entries', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))

    expect(history.past).toHaveLength(2)
    expect(history.past[1].before.accountEval).toBe(2)
    expect(history.past[1].after.accountEval).toBe(3)

    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(2)
    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(1)

    history = redoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(2)
    history = redoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(3)
  })

  it('keeps repeated edits pending until the focus or gesture group commits', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    for (const price of [351, 352, 355]) {
      history = recordCalculatorHistory(history, inputs(100, price), {
        historyGroup: 'current-price-gesture',
      })
    }

    expect(history.past).toHaveLength(0)
    expect(history.pendingEdit?.before.currentPrice).toBe(350)
    expect(getCalculatorHistoryMoves(history).undo).toHaveLength(0)

    history = commitCalculatorHistoryGroup(history, 'current-price-gesture')
    expect(history.past).toHaveLength(1)
    expect(history.past[0].before.currentPrice).toBe(350)
    expect(history.past[0].after.currentPrice).toBe(355)
    expect(history.pendingEdit).toBeUndefined()
  })

  it('commits a deferred blur edit in one record call', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    history = recordCalculatorHistory(history, inputs(100, 360), {
      historyGroup: 'deferred-current-price',
      historyCommit: true,
    })

    expect(history.past).toHaveLength(1)
    expect(history.past[0].before.currentPrice).toBe(350)
    expect(history.past[0].after.currentPrice).toBe(360)
    expect(history.pendingEdit).toBeUndefined()
  })

  it('does not create history when a focus session returns to its starting value', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    history = recordCalculatorHistory(history, inputs(100, 351), {
      historyGroup: 'current-price-focus',
    })
    history = recordCalculatorHistory(history, inputs(100, 350), {
      historyGroup: 'current-price-focus',
    })
    history = commitCalculatorHistoryGroup(history, 'current-price-focus')

    expect(history.present.currentPrice).toBe(350)
    expect(history.past).toHaveLength(0)
    expect(history.canUndo).toBe(false)
  })

  it('preserves redo history when a pending edit returns to its starting value', () => {
    let history = createCalculatorHistory(inputs(1))
    history = recordCalculatorHistory(history, inputs(2))
    history = undoCalculatorHistory(history)

    history = recordCalculatorHistory(history, inputs(3), {
      historyGroup: 'account-focus',
    })
    history = recordCalculatorHistory(history, inputs(1), {
      historyGroup: 'account-focus',
    })
    history = commitCalculatorHistoryGroup(history, 'account-focus')

    expect(history.present.accountEval).toBe(1)
    expect(history.future.map((entry) => entry.after.accountEval)).toEqual([2])
    expect(history.canRedo).toBe(true)
  })

  it('clears redo history after a newly committed edit', () => {
    let history = createCalculatorHistory(inputs(1))
    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = undoCalculatorHistory(history)
    expect(history.canRedo).toBe(true)

    history = recordCalculatorHistory(history, inputs(4))

    expect(history.present.accountEval).toBe(4)
    expect(history.future).toHaveLength(0)
    expect(history.canRedo).toBe(false)
  })

  it('builds undo and redo moves from each committed entry', () => {
    let history = createCalculatorHistory(inputs(1))
    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = recordCalculatorHistory(history, inputs(4))
    history = jumpCalculatorHistory(history, 'undo', 2)

    const moves = getCalculatorHistoryMoves(history)
    expect(history.present.accountEval).toBe(2)
    expect(moves.undo.map((move) => [move.before.accountEval, move.after.accountEval])).toEqual([
      [1, 2],
    ])
    expect(moves.redo.map((move) => [move.before.accountEval, move.after.accountEval])).toEqual([
      [2, 3],
      [3, 4],
    ])
  })

  it('jumps multiple undo and redo entries while preserving order', () => {
    let history = createCalculatorHistory(inputs(1))
    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = recordCalculatorHistory(history, inputs(4))

    history = jumpCalculatorHistory(history, 'undo', 2)
    expect(history.present.accountEval).toBe(2)
    expect(history.past.map((entry) => entry.after.accountEval)).toEqual([2])
    expect(history.future.map((entry) => entry.after.accountEval)).toEqual([3, 4])

    history = jumpCalculatorHistory(history, 'redo', 2)
    expect(history.present.accountEval).toBe(4)
    expect(history.past.map((entry) => entry.after.accountEval)).toEqual([2, 3, 4])
    expect(history.future).toHaveLength(0)
  })

  it('commits a current-price stepper gesture as one history entry', () => {
    let history = createCalculatorHistory(markInputs)

    for (const price of [351, 352, 355]) {
      history = recordCalculatorHistory(
        history,
        applyInputPatch(history.present, {
          applyMarkPrice: price,
          preserveMarkPriceUndoSnapshot: price === 351 ? undefined : true,
        }),
        { historyGroup: 'mark-price-gesture' },
      )
    }
    history = commitCalculatorHistoryGroup(history, 'mark-price-gesture')

    expect(history.past).toHaveLength(1)
    expect(history.past[0].before.currentPrice).toBe(350)
    expect(history.past[0].after.currentPrice).toBe(355)
    expect(history.past[0].after.accountEval).toBe(10_000_010)
  })

  it('keeps order preview transient and commits only the final order', () => {
    let history = createCalculatorHistory(orderInputs)
    const baseline = captureOrderScenarioBaseline(calculateOrder(history.present))
    const preview = applyInputPatch(history.present, { commitOrderScenario: baseline })

    history = recordCalculatorHistory(history, preview, {
      historyTransient: 'begin',
      historyTransientTarget: applyInputPatch(preview, { clearOrderScenario: true }),
    })

    expect(isOrderScenarioModeActive(history.present)).toBe(true)
    expect(history.past).toHaveLength(0)
    expect(getCalculatorHistoryMoves(history).undo).toHaveLength(0)

    const adjusted = applyInputPatch(history.present, { orderContracts: 2 })
    const finalDraft = applyInputPatch(adjusted, { clearOrderScenario: true })
    history = recordCalculatorHistory(history, adjusted, {
      historyTransient: 'update',
      historyTransientTarget: finalDraft,
    })

    const applied = applyInputPatch(history.present, { applyOrderScenario: true })
    history = recordCalculatorHistory(history, applied, { historyBefore: finalDraft })

    expect(history.past).toHaveLength(1)
    expect(history.past[0].before.orderScenarioRevertSnapshot).toBeUndefined()
    expect(history.past[0].before.orderContracts).toBe(2)
    expect(history.past[0].before.orderPrice).toBe(345)
    expect(history.past[0].after.contracts).toBe(4)
    expect(isOrderScenarioModeActive(history.present)).toBe(false)

    history = undoCalculatorHistory(history)
    expect(isOrderScenarioModeActive(history.present)).toBe(false)
    expect(history.present.contracts).toBe(2)
    expect(history.present.orderContracts).toBe(2)
    expect(history.present.orderPrice).toBe(345)

    history = redoCalculatorHistory(history)
    expect(history.present.contracts).toBe(4)
    expect(history.present.orderContracts).toBeUndefined()
    expect(history.present.orderPrice).toBeUndefined()
  })

  it('cancels order preview without creating a committed entry', () => {
    let history = createCalculatorHistory(orderInputs)
    const baseline = captureOrderScenarioBaseline(calculateOrder(history.present))
    const preview = applyInputPatch(history.present, { commitOrderScenario: baseline })
    const cancelTarget = applyInputPatch(preview, { clearOrderScenario: true })

    history = recordCalculatorHistory(history, preview, {
      historyTransient: 'begin',
      historyTransientTarget: cancelTarget,
    })
    history = recordCalculatorHistory(history, cancelTarget, {
      historyTransient: 'cancel',
    })

    expect(history.past).toHaveLength(0)
    expect(history.future).toHaveLength(0)
    expect(history.transientEdit).toBeUndefined()
    expect(isOrderScenarioModeActive(history.present)).toBe(false)
  })

  it('uses Ctrl+Z semantics to cancel an active preview before older history', () => {
    let history = createCalculatorHistory(orderInputs)
    history = recordCalculatorHistory(history, { ...orderInputs, orderPrice: 346 })
    const baseline = captureOrderScenarioBaseline(calculateOrder(history.present))
    const preview = applyInputPatch(history.present, { commitOrderScenario: baseline })
    const cancelTarget = applyInputPatch(preview, { clearOrderScenario: true })
    history = recordCalculatorHistory(history, preview, {
      historyTransient: 'begin',
      historyTransientTarget: cancelTarget,
    })

    history = undoCalculatorHistory(history)
    expect(history.present.orderPrice).toBe(346)
    expect(isOrderScenarioModeActive(history.present)).toBe(false)
    expect(history.past).toHaveLength(1)

    history = undoCalculatorHistory(history)
    expect(history.present.orderPrice).toBe(345)
  })

  it('does not record duplicates and caps committed history', () => {
    let history = createCalculatorHistory(inputs(0))
    history = recordCalculatorHistory(history, inputs(0))
    expect(history.past).toHaveLength(0)

    for (let value = 1; value <= CALCULATOR_HISTORY_LIMIT + 5; value += 1) {
      history = recordCalculatorHistory(history, inputs(value))
    }

    expect(history.past).toHaveLength(CALCULATOR_HISTORY_LIMIT)
    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(CALCULATOR_HISTORY_LIMIT + 4)
  })

  it('replaces present inputs and clears all history state', () => {
    let history = createCalculatorHistory(inputs(1))
    history = recordCalculatorHistory(history, inputs(2))
    history = undoCalculatorHistory(history)

    history = replaceCalculatorHistory(history, inputs(9))

    expect(history.present.accountEval).toBe(9)
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.past).toHaveLength(0)
    expect(history.future).toHaveLength(0)
  })
})
