import { describe, expect, it, beforeEach } from 'vitest'
import {
  beginOrderHistorySave,
  completeOrderHistorySave,
  consumeOrderHistoryUndo,
  resetOrderHistoryUndoSync,
} from './orderHistoryUndoSync'

describe('orderHistoryUndoSync', () => {
  beforeEach(() => {
    resetOrderHistoryUndoSync()
  })

  it('pushes id on complete and returns it on consume', () => {
    const gen = beginOrderHistorySave()
    expect(completeOrderHistorySave(gen, 'order-1')).toEqual({})
    expect(consumeOrderHistoryUndo()).toBe('order-1')
    expect(consumeOrderHistoryUndo()).toBeNull()
  })

  it('returns deleteImmediately when save completes after undo cancelled pending', () => {
    const gen = beginOrderHistorySave()
    expect(consumeOrderHistoryUndo()).toBeNull()
    expect(completeOrderHistorySave(gen, 'order-late')).toEqual({
      deleteImmediately: 'order-late',
    })
    expect(consumeOrderHistoryUndo()).toBeNull()
  })

  it('pops most recent id when multiple applies were saved', () => {
    const gen1 = beginOrderHistorySave()
    completeOrderHistorySave(gen1, 'order-1')
    const gen2 = beginOrderHistorySave()
    completeOrderHistorySave(gen2, 'order-2')

    expect(consumeOrderHistoryUndo()).toBe('order-2')
    expect(consumeOrderHistoryUndo()).toBe('order-1')
  })

  it('ignores complete for stale generation', () => {
    const gen = beginOrderHistorySave()
    beginOrderHistorySave()
    expect(completeOrderHistorySave(gen, 'stale')).toEqual({})
    expect(consumeOrderHistoryUndo()).toBeNull()
  })
})
