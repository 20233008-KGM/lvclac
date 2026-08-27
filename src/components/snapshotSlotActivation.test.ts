import { describe, expect, it } from 'vitest'
import {
  isLastEnabledSnapshotSlot,
  shouldStartSnapshotSchedule,
} from './snapshotSlotActivation'

describe('slot-driven account snapshot activation', () => {
  it('starts the internal schedule only when enabling a slot from an inactive schedule', () => {
    expect(shouldStartSnapshotSchedule(false, true)).toBe(true)
    expect(shouldStartSnapshotSchedule(true, true)).toBe(false)
    expect(shouldStartSnapshotSchedule(false, false)).toBe(false)
  })

  it('stops the internal schedule when the last enabled slot is turned off or deleted', () => {
    expect(isLastEnabledSnapshotSlot(1, true)).toBe(true)
    expect(isLastEnabledSnapshotSlot(2, true)).toBe(false)
    expect(isLastEnabledSnapshotSlot(1, false)).toBe(false)
  })
})
