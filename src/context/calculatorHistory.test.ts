import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import { calculateOrder, captureOrderScenarioBaseline } from '../calc/leverage'
import { applyInputPatch, isOrderScenarioModeActive, isScenarioModeActive } from '../calc/mtmLink'
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
  it('undoes and redoes multiple committed states', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))

    expect(history.canUndo).toBe(true)
    expect(history.canRedo).toBe(false)

    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(2)
    expect(history.canRedo).toBe(true)

    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(1)
    expect(history.canUndo).toBe(false)

    history = redoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(2)

    history = redoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(3)
    expect(history.canRedo).toBe(false)
  })

  it('keeps repeated edits pending until the history group is committed', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    history = recordCalculatorHistory(history, inputs(100, 351), {
      historyGroup: 'current-price-gesture',
    })
    history = recordCalculatorHistory(history, inputs(100, 352), {
      historyGroup: 'current-price-gesture',
    })
    history = recordCalculatorHistory(history, inputs(100, 355), {
      historyGroup: 'current-price-gesture',
    })

    expect(history.past).toHaveLength(0)
    expect(history.pendingEdit?.before.currentPrice).toBe(350)
    expect(getCalculatorHistoryMoves(history).undo).toHaveLength(0)

    history = commitCalculatorHistoryGroup(history, 'current-price-gesture')

    expect(history.past).toHaveLength(1)
    expect(history.present.currentPrice).toBe(355)
    expect(history.pendingEdit).toBeUndefined()

    history = undoCalculatorHistory(history)
    expect(history.present.currentPrice).toBe(350)

    history = redoCalculatorHistory(history)
    expect(history.present.currentPrice).toBe(355)
  })

  it('starts a new undo step when the history group changes', () => {
    let history = createCalculatorHistory(inputs(10, 100))

    history = recordCalculatorHistory(history, inputs(10, 101), { historyGroup: 'field-a' })
    history = recordCalculatorHistory(history, inputs(10, 102), { historyGroup: 'field-a' })
    history = commitCalculatorHistoryGroup(history, 'field-a')
    history = recordCalculatorHistory(history, inputs(11, 102), { historyGroup: 'field-b' })
    history = commitCalculatorHistoryGroup(history, 'field-b')

    expect(history.past).toHaveLength(2)

    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(10)
    expect(history.present.currentPrice).toBe(102)

    history = undoCalculatorHistory(history)
    expect(history.present.accountEval).toBe(10)
    expect(history.present.currentPrice).toBe(100)
  })

  it('clears redo history when a new edit happens after undo', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = undoCalculatorHistory(history)
    expect(history.canRedo).toBe(true)

    history = recordCalculatorHistory(history, inputs(4))

    expect(history.present.accountEval).toBe(4)
    expect(history.canRedo).toBe(false)
    expect(history.future).toHaveLength(0)
  })

  it('builds undo and redo preview moves closest to the current state first', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = recordCalculatorHistory(history, inputs(4))
    history = undoCalculatorHistory(history)
    history = undoCalculatorHistory(history)

    const moves = getCalculatorHistoryMoves(history)

    expect(history.present.accountEval).toBe(2)
    expect(moves.undo.map((move) => move.steps)).toEqual([1])
    expect(moves.undo.map((move) => move.target.accountEval)).toEqual([1])
    expect(moves.redo.map((move) => move.steps)).toEqual([1, 2])
    expect(moves.redo.map((move) => move.target.accountEval)).toEqual([3, 4])
    expect(moves.redo.map((move) => [move.before.accountEval, move.after.accountEval])).toEqual([
      [2, 3],
      [3, 4],
    ])
  })

  it('jumps multiple undo and redo steps while preserving stack order', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = recordCalculatorHistory(history, inputs(4))

    history = jumpCalculatorHistory(history, 'undo', 2)
    expect(history.present.accountEval).toBe(2)
    expect(history.past.map((entry) => entry.accountEval)).toEqual([1])
    expect(history.future.map((entry) => entry.accountEval)).toEqual([3, 4])

    history = jumpCalculatorHistory(history, 'redo', 2)
    expect(history.present.accountEval).toBe(4)
    expect(history.past.map((entry) => entry.accountEval)).toEqual([1, 2, 3])
    expect(history.future).toHaveLength(0)
  })

  it('jumps grouped current-price gestures as one undoable move', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    history = recordCalculatorHistory(history, inputs(100, 351), {
      historyGroup: 'current-price-gesture',
    })
    history = recordCalculatorHistory(history, inputs(100, 352), {
      historyGroup: 'current-price-gesture',
    })
    history = recordCalculatorHistory(history, inputs(100, 355), {
      historyGroup: 'current-price-gesture',
    })
    history = commitCalculatorHistoryGroup(history, 'current-price-gesture')

    const moves = getCalculatorHistoryMoves(history)
    expect(moves.undo).toHaveLength(1)
    expect(moves.undo[0].target.currentPrice).toBe(350)
    expect(moves.undo[0].before.currentPrice).toBe(350)
    expect(moves.undo[0].after.currentPrice).toBe(355)

    history = jumpCalculatorHistory(history, 'undo', 1)
    expect(history.present.currentPrice).toBe(350)

    history = jumpCalculatorHistory(history, 'redo', 1)
    expect(history.present.currentPrice).toBe(355)
  })

  it('clears redo history when a new edit happens after a jump undo', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = recordCalculatorHistory(history, inputs(3))
    history = jumpCalculatorHistory(history, 'undo', 2)
    expect(history.canRedo).toBe(true)

    history = recordCalculatorHistory(history, inputs(9))

    expect(history.present.accountEval).toBe(9)
    expect(history.future).toHaveLength(0)
    expect(history.canRedo).toBe(false)
  })

  it('does not record duplicate states and caps past history', () => {
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

  it('replaces present inputs without keeping old undo or redo stacks', () => {
    let history = createCalculatorHistory(inputs(1))

    history = recordCalculatorHistory(history, inputs(2))
    history = undoCalculatorHistory(history)
    expect(history.canRedo).toBe(true)

    history = replaceCalculatorHistory(history, inputs(9))

    expect(history.present.accountEval).toBe(9)
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.past).toHaveLength(0)
    expect(history.future).toHaveLength(0)
  })

  it('undoes and redoes a grouped mark-price gesture as one history step', () => {
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

    expect(history.present.currentPrice).toBe(355)
    expect(history.past).toHaveLength(1)

    history = undoCalculatorHistory(history)
    expect(history.present.currentPrice).toBe(350)

    history = redoCalculatorHistory(history)
    expect(history.present.currentPrice).toBe(355)
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
    expect(history.future.map((entry) => entry.accountEval)).toEqual([2])
    expect(history.canRedo).toBe(true)
  })

  it('commits a deferred focus edit in one record call', () => {
    let history = createCalculatorHistory(inputs(100, 350))

    history = recordCalculatorHistory(history, inputs(100, 360), {
      historyGroup: 'deferred-current-price',
      historyCommit: true,
    })

    expect(history.present.currentPrice).toBe(360)
    expect(history.past).toHaveLength(1)
    expect(history.pendingEdit).toBeUndefined()
  })

  it('undoes and redoes scenario apply state', () => {
    let history = createCalculatorHistory(markInputs)
    history = recordCalculatorHistory(
      history,
      applyInputPatch(history.present, { commitScenarioPrice: 345 }),
    )
    history = recordCalculatorHistory(
      history,
      applyInputPatch(history.present, { applyScenarioToMark: 345 }),
    )

    expect(isScenarioModeActive(history.present)).toBe(false)
    expect(history.present.currentPrice).toBe(345)

    history = undoCalculatorHistory(history)
    expect(isScenarioModeActive(history.present)).toBe(true)
    expect(history.present.currentPrice).toBe(350)

    history = redoCalculatorHistory(history)
    expect(isScenarioModeActive(history.present)).toBe(false)
    expect(history.present.currentPrice).toBe(345)
  })

  it('undoes and redoes order apply state', () => {
    let history = createCalculatorHistory(orderInputs)
    const baseline = captureOrderScenarioBaseline(calculateOrder(history.present))

    history = recordCalculatorHistory(
      history,
      applyInputPatch(history.present, { commitOrderScenario: baseline }),
    )
    history = recordCalculatorHistory(
      history,
      applyInputPatch(history.present, { applyOrderScenario: true }),
    )

    expect(isOrderScenarioModeActive(history.present)).toBe(false)
    expect(history.present.contracts).toBe(3)

    history = undoCalculatorHistory(history)
    expect(isOrderScenarioModeActive(history.present)).toBe(true)
    expect(history.present.contracts).toBe(2)

    history = redoCalculatorHistory(history)
    expect(isOrderScenarioModeActive(history.present)).toBe(false)
    expect(history.present.contracts).toBe(3)
  })
})
