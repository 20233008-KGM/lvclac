import type { CalculatorInputs } from '../types'

export const CALCULATOR_HISTORY_LIMIT = 100

export interface CalculatorHistoryOptions {
  historyGroup?: string
}

export type CalculatorHistoryDirection = 'undo' | 'redo'

export interface CalculatorHistoryMove {
  direction: CalculatorHistoryDirection
  steps: number
  target: CalculatorInputs
}

export interface CalculatorHistory {
  past: CalculatorInputs[]
  present: CalculatorInputs
  future: CalculatorInputs[]
  activeGroup?: string
  canUndo: boolean
  canRedo: boolean
}

function withFlags(history: Omit<CalculatorHistory, 'canUndo' | 'canRedo'>): CalculatorHistory {
  return {
    ...history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}

function appendPast(past: CalculatorInputs[], value: CalculatorInputs): CalculatorInputs[] {
  const next = [...past, value]
  return next.length > CALCULATOR_HISTORY_LIMIT
    ? next.slice(next.length - CALCULATOR_HISTORY_LIMIT)
    : next
}

function sameInputs(a: CalculatorInputs, b: CalculatorInputs): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function createCalculatorHistory(present: CalculatorInputs): CalculatorHistory {
  return withFlags({
    past: [],
    present,
    future: [],
  })
}

export function replaceCalculatorHistory(
  _history: CalculatorHistory,
  present: CalculatorInputs,
): CalculatorHistory {
  return createCalculatorHistory(present)
}

export function recordCalculatorHistory(
  history: CalculatorHistory,
  present: CalculatorInputs,
  options: CalculatorHistoryOptions = {},
): CalculatorHistory {
  if (sameInputs(history.present, present)) return history

  const historyGroup = options.historyGroup
  if (historyGroup && history.activeGroup === historyGroup) {
    return withFlags({
      past: history.past,
      present,
      future: [],
      activeGroup: historyGroup,
    })
  }

  return withFlags({
    past: appendPast(history.past, history.present),
    present,
    future: [],
    activeGroup: historyGroup,
  })
}

export function undoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  if (history.past.length === 0) return withFlags({ ...history, activeGroup: undefined })

  const present = history.past[history.past.length - 1]
  return withFlags({
    past: history.past.slice(0, -1),
    present,
    future: [history.present, ...history.future],
  })
}

export function redoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  if (history.future.length === 0) return withFlags({ ...history, activeGroup: undefined })

  const [present, ...future] = history.future
  return withFlags({
    past: appendPast(history.past, history.present),
    present,
    future,
  })
}

export function getCalculatorHistoryMoves(history: CalculatorHistory): {
  undo: CalculatorHistoryMove[]
  redo: CalculatorHistoryMove[]
} {
  return {
    undo: [...history.past].reverse().map((target, index) => ({
      direction: 'undo',
      steps: index + 1,
      target,
    })),
    redo: history.future.map((target, index) => ({
      direction: 'redo',
      steps: index + 1,
      target,
    })),
  }
}

export function jumpCalculatorHistory(
  history: CalculatorHistory,
  direction: CalculatorHistoryDirection,
  steps: number,
): CalculatorHistory {
  const count = Math.max(0, Math.floor(steps))
  let next = history

  for (let i = 0; i < count; i += 1) {
    if (direction === 'undo') {
      if (!next.canUndo) break
      next = undoCalculatorHistory(next)
    } else {
      if (!next.canRedo) break
      next = redoCalculatorHistory(next)
    }
  }

  return next
}
