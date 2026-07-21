import { describe, expect, it } from 'vitest'
import {
  createAccountRecordSlotTitles,
  resolveAccountRecordSlotLabel,
} from './accountRecordSlot'

describe('account record slot labels', () => {
  const titles = createAccountRecordSlotTitles([
    { id: 'slot-1', title: '  KOSPI hedge  ' },
    { id: 'slot-empty', title: '   ' },
  ])

  it('uses the current trimmed title for a known slot', () => {
    expect(resolveAccountRecordSlotLabel('slot-1', titles, 'Unassigned', 'Slot unavailable')).toBe(
      'KOSPI hedge',
    )
  })

  it('treats records without a slot id as unassigned', () => {
    expect(resolveAccountRecordSlotLabel(null, titles, 'Unassigned', 'Slot unavailable')).toBe(
      'Unassigned',
    )
  })

  it('does not mislabel missing or empty slot titles as unassigned', () => {
    expect(resolveAccountRecordSlotLabel('slot-missing', titles, 'Unassigned', 'Slot unavailable')).toBe(
      'Slot unavailable',
    )
    expect(resolveAccountRecordSlotLabel('slot-empty', titles, 'Unassigned', 'Slot unavailable')).toBe(
      'Slot unavailable',
    )
  })
})
