import { describe, expect, it } from 'vitest'
import { resolveNumberSetDeletionTransition } from './numberSetDeletion'

const sets = [{ id: 'slot-1' }, { id: 'slot-2' }, { id: 'slot-3' }]

describe('number-set deletion transition', () => {
  it('preserves the active slot when a different slot is deleted', () => {
    expect(resolveNumberSetDeletionTransition(sets, 'slot-1', 'slot-3')).toEqual({
      nextSets: [{ id: 'slot-1' }, { id: 'slot-2' }],
      activeDeleted: false,
      nextActiveId: 'slot-1',
    })
  })

  it('selects the next remaining slot when the active slot is deleted', () => {
    expect(resolveNumberSetDeletionTransition(sets, 'slot-1', 'slot-1')).toEqual({
      nextSets: [{ id: 'slot-2' }, { id: 'slot-3' }],
      activeDeleted: true,
      nextActiveId: 'slot-2',
    })
  })

  it('clears the active slot when the final slot is deleted', () => {
    expect(resolveNumberSetDeletionTransition([{ id: 'slot-1' }], 'slot-1', 'slot-1')).toEqual({
      nextSets: [],
      activeDeleted: true,
      nextActiveId: null,
    })
  })
})
