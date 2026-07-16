import type { CalculatorInputs } from '../types'

export const CALCULATOR_HISTORY_LIMIT = 100

export interface CalculatorHistoryOptions {
  historyGroup?: string
  historyCommit?: boolean
  historyOnly?: boolean
}

export type CalculatorHistoryDirection = 'undo' | 'redo'

export interface CalculatorHistoryMove {
  direction: CalculatorHistoryDirection
  steps: number
  target: CalculatorInputs
  before: CalculatorInputs
  after: CalculatorInputs
}

export interface CalculatorPendingEdit {
  group: string
  before: CalculatorInputs
}

export interface CalculatorHistory {
  past: CalculatorInputs[]
  present: CalculatorInputs
  future: CalculatorInputs[]
  pendingEdit?: CalculatorPendingEdit
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
  const historyGroup = options.historyGroup
  if (historyGroup) {
    if (options.historyCommit) {
      if (history.pendingEdit?.group === historyGroup) {
        const updated = sameInputs(history.present, present)
          ? history
          : withFlags({ ...history, present })
        return commitCalculatorHistoryGroup(updated, historyGroup)
      }

      const settled = commitCalculatorHistoryGroup(history)
      if (sameInputs(settled.present, present)) return settled
      return withFlags({
        past: appendPast(settled.past, settled.present),
        present,
        future: [],
      })
    }

    if (history.pendingEdit?.group === historyGroup) {
      if (sameInputs(history.present, present)) return history
      return withFlags({
        ...history,
        present,
      })
    }

    const settled = commitCalculatorHistoryGroup(history)
    if (sameInputs(settled.present, present)) return settled

    return withFlags({
      past: settled.past,
      present,
      future: settled.future,
      pendingEdit: {
        group: historyGroup,
        before: settled.present,
      },
    })
  }

  const settled = commitCalculatorHistoryGroup(history)
  if (sameInputs(settled.present, present)) return settled

  return withFlags({
    past: appendPast(settled.past, settled.present),
    present,
    future: [],
  })
}

export function commitCalculatorHistoryGroup(
  history: CalculatorHistory,
  historyGroup?: string,
): CalculatorHistory {
  const pending = history.pendingEdit
  if (!pending || (historyGroup && pending.group !== historyGroup)) return history

  if (sameInputs(pending.before, history.present)) {
    return withFlags({
      past: history.past,
      present: history.present,
      future: history.future,
    })
  }

  return withFlags({
    past: appendPast(history.past, pending.before),
    present: history.present,
    future: [],
  })
}

export function undoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  const settled = commitCalculatorHistoryGroup(history)
  if (settled.past.length === 0) return settled

  const present = settled.past[settled.past.length - 1]
  return withFlags({
    past: settled.past.slice(0, -1),
    present,
    future: [settled.present, ...settled.future],
  })
}

export function redoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  const settled = commitCalculatorHistoryGroup(history)
  if (settled.future.length === 0) return settled

  const [present, ...future] = settled.future
  return withFlags({
    past: appendPast(settled.past, settled.present),
    present,
    future,
  })
}

export function getCalculatorHistoryMoves(history: CalculatorHistory): {
  undo: CalculatorHistoryMove[]
  redo: CalculatorHistoryMove[]
} {
  const committedPresent = history.pendingEdit?.before ?? history.present
  const undoStates = [...history.past, committedPresent]
  const redoStates = [committedPresent, ...history.future]

  return {
    undo: [...history.past].reverse().map((target, index) => ({
      direction: 'undo',
      steps: index + 1,
      target,
      before: target,
      after: undoStates[undoStates.length - 1 - index],
    })),
    redo: history.future.map((target, index) => ({
      direction: 'redo',
      steps: index + 1,
      target,
      before: redoStates[index],
      after: target,
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
