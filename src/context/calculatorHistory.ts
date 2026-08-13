import type { CalculatorInputs } from '../types'

export const CALCULATOR_HISTORY_LIMIT = 100

export type CalculatorHistoryTransientPhase = 'begin' | 'update' | 'cancel'

export interface CalculatorHistoryOptions {
  historyGroup?: string
  historyCommit?: boolean
  historyOnly?: boolean
  historyBefore?: CalculatorInputs
  historyTransient?: CalculatorHistoryTransientPhase
  historyTransientTarget?: CalculatorInputs
}

export type CalculatorHistoryDirection = 'undo' | 'redo'

export interface CalculatorHistoryEntry {
  before: CalculatorInputs
  after: CalculatorInputs
}

export interface CalculatorHistoryMove extends CalculatorHistoryEntry {
  direction: CalculatorHistoryDirection
  steps: number
  target: CalculatorInputs
}

export interface CalculatorPendingEdit {
  group: string
  before: CalculatorInputs
}

export interface CalculatorTransientEdit {
  before: CalculatorInputs
  cancelTarget: CalculatorInputs
}

export interface CalculatorHistory {
  past: CalculatorHistoryEntry[]
  present: CalculatorInputs
  future: CalculatorHistoryEntry[]
  pendingEdit?: CalculatorPendingEdit
  transientEdit?: CalculatorTransientEdit
  canUndo: boolean
  canRedo: boolean
}

function withFlags(history: Omit<CalculatorHistory, 'canUndo' | 'canRedo'>): CalculatorHistory {
  return {
    ...history,
    canUndo: history.past.length > 0 || history.transientEdit != null,
    canRedo: history.transientEdit == null && history.future.length > 0,
  }
}

function appendPast(
  past: CalculatorHistoryEntry[],
  entry: CalculatorHistoryEntry,
): CalculatorHistoryEntry[] {
  const next = [...past, entry]
  return next.length > CALCULATOR_HISTORY_LIMIT
    ? next.slice(next.length - CALCULATOR_HISTORY_LIMIT)
    : next
}

function sameInputs(a: CalculatorInputs, b: CalculatorInputs): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function withoutPending(history: CalculatorHistory): Omit<CalculatorHistory, 'canUndo' | 'canRedo'> {
  return {
    past: history.past,
    present: history.present,
    future: history.future,
    transientEdit: history.transientEdit,
  }
}

function withoutTransient(
  history: CalculatorHistory,
): Omit<CalculatorHistory, 'canUndo' | 'canRedo'> {
  return {
    past: history.past,
    present: history.present,
    future: history.future,
    pendingEdit: history.pendingEdit,
  }
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

export function commitCalculatorHistoryGroup(
  history: CalculatorHistory,
  historyGroup?: string,
): CalculatorHistory {
  const pending = history.pendingEdit
  if (!pending || (historyGroup && pending.group !== historyGroup)) return history

  const base = withoutPending(history)
  if (sameInputs(pending.before, history.present)) return withFlags(base)

  return withFlags({
    ...base,
    past: appendPast(history.past, {
      before: pending.before,
      after: history.present,
    }),
    future: [],
  })
}

function recordTransientHistory(
  history: CalculatorHistory,
  present: CalculatorInputs,
  options: CalculatorHistoryOptions,
): CalculatorHistory {
  const phase = options.historyTransient
  if (!phase) return history

  if (phase === 'cancel') {
    return withFlags({
      past: history.past,
      present,
      future: history.future,
    })
  }

  const settled = phase === 'begin' ? commitCalculatorHistoryGroup(history) : history
  const before = settled.transientEdit?.before ?? settled.present
  const cancelTarget = options.historyTransientTarget
    ?? settled.transientEdit?.cancelTarget
    ?? before

  return withFlags({
    ...withoutPending(settled),
    present,
    transientEdit: { before, cancelTarget },
  })
}

export function recordCalculatorHistory(
  history: CalculatorHistory,
  present: CalculatorInputs,
  options: CalculatorHistoryOptions = {},
): CalculatorHistory {
  if (options.historyTransient) {
    return recordTransientHistory(history, present, options)
  }

  if (history.transientEdit && !options.historyBefore) {
    return recordTransientHistory(history, present, {
      ...options,
      historyTransient: 'update',
    })
  }

  if (options.historyBefore) {
    const settled = commitCalculatorHistoryGroup(history)
    const base = withoutTransient(settled)
    if (sameInputs(options.historyBefore, present)) {
      return withFlags({ ...base, present })
    }
    return withFlags({
      ...base,
      past: appendPast(settled.past, {
        before: options.historyBefore,
        after: present,
      }),
      present,
      future: [],
    })
  }

  const historyGroup = options.historyGroup
  if (historyGroup) {
    if (options.historyCommit) {
      if (history.pendingEdit?.group === historyGroup) {
        const updated = sameInputs(history.present, present)
          ? history
          : withFlags({ ...withoutPending(history), present, pendingEdit: history.pendingEdit })
        return commitCalculatorHistoryGroup(updated, historyGroup)
      }

      const settled = commitCalculatorHistoryGroup(history)
      if (sameInputs(settled.present, present)) return settled
      return withFlags({
        ...withoutPending(settled),
        past: appendPast(settled.past, { before: settled.present, after: present }),
        present,
        future: [],
      })
    }

    if (history.pendingEdit?.group === historyGroup) {
      if (sameInputs(history.present, present)) return history
      return withFlags({
        ...withoutPending(history),
        present,
        pendingEdit: history.pendingEdit,
      })
    }

    const settled = commitCalculatorHistoryGroup(history)
    if (sameInputs(settled.present, present)) return settled

    return withFlags({
      ...withoutPending(settled),
      present,
      pendingEdit: {
        group: historyGroup,
        before: settled.present,
      },
    })
  }

  const settled = commitCalculatorHistoryGroup(history)
  if (sameInputs(settled.present, present)) return settled

  return withFlags({
    ...withoutPending(settled),
    past: appendPast(settled.past, { before: settled.present, after: present }),
    present,
    future: [],
  })
}

function cancelTransientHistory(history: CalculatorHistory): CalculatorHistory {
  const transient = history.transientEdit
  if (!transient) return history
  return withFlags({
    past: history.past,
    present: transient.cancelTarget,
    future: history.future,
  })
}

export function undoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  const settled = commitCalculatorHistoryGroup(history)
  if (settled.transientEdit) return cancelTransientHistory(settled)
  if (settled.past.length === 0) return settled

  const entry = settled.past[settled.past.length - 1]
  return withFlags({
    ...withoutPending(settled),
    past: settled.past.slice(0, -1),
    present: entry.before,
    future: [entry, ...settled.future],
  })
}

export function redoCalculatorHistory(history: CalculatorHistory): CalculatorHistory {
  const settled = commitCalculatorHistoryGroup(history)
  if (settled.transientEdit || settled.future.length === 0) return settled

  const [entry, ...future] = settled.future
  return withFlags({
    ...withoutPending(settled),
    past: appendPast(settled.past, entry),
    present: entry.after,
    future,
  })
}

export function getCalculatorHistoryMoves(history: CalculatorHistory): {
  undo: CalculatorHistoryMove[]
  redo: CalculatorHistoryMove[]
} {
  return {
    undo: [...history.past].reverse().map((entry, index) => ({
      direction: 'undo',
      steps: index + 1,
      target: entry.before,
      before: entry.before,
      after: entry.after,
    })),
    redo: history.future.map((entry, index) => ({
      direction: 'redo',
      steps: index + 1,
      target: entry.after,
      before: entry.before,
      after: entry.after,
    })),
  }
}

export function jumpCalculatorHistory(
  history: CalculatorHistory,
  direction: CalculatorHistoryDirection,
  steps: number,
): CalculatorHistory {
  const count = Math.max(0, Math.floor(steps))
  let next = history.transientEdit ? cancelTransientHistory(history) : history

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
