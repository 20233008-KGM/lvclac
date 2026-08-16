import { describe, expect, it } from 'vitest'
import { advanceRolloverDate, isLocalDateString, isRolloverDue } from './rolloverSchedule'

describe('isLocalDateString', () => {
  it('accepts real calendar dates and rejects impossible dates', () => {
    expect(isLocalDateString('2028-02-29')).toBe(true)
    expect(isLocalDateString('2026-02-29')).toBe(false)
    expect(isLocalDateString('2026-13-01')).toBe(false)
  })
})

describe('advanceRolloverDate', () => {
  it('advances from the user-selected date by the selected cycle', () => {
    expect(advanceRolloverDate('2026-09-10', 3, '2026-09-10')).toBe('2026-12-10')
  })

  it('preserves the selected day instead of snapping to a weekday rule', () => {
    expect(advanceRolloverDate('2026-09-17', 2, '2026-09-17')).toBe('2026-11-17')
  })

  it('clamps a date that does not exist in the target month', () => {
    expect(advanceRolloverDate('2026-01-31', 1, '2026-01-31')).toBe('2026-02-28')
  })

  it('skips forward past a notBefore that is several cycles ahead', () => {
    expect(advanceRolloverDate('2026-01-17', 3, '2026-08-01')).toBe('2026-10-17')
  })

  it('always returns strictly after notBefore', () => {
    expect(advanceRolloverDate('2026-09-17', 3, '2026-12-17')).toBe('2027-03-17')
  })
})

describe('isRolloverDue', () => {
  it('is due when today reached or passed the next date', () => {
    expect(isRolloverDue('2026-07-09', '2026-07-09')).toBe(true)
    expect(isRolloverDue('2026-07-09', '2026-07-10')).toBe(true)
  })

  it('is not due before the next date', () => {
    expect(isRolloverDue('2026-07-09', '2026-07-08')).toBe(false)
  })

  it('is never due when either date is missing or invalid', () => {
    expect(isRolloverDue(null, '2026-07-09')).toBe(false)
    expect(isRolloverDue(undefined, '2026-07-09')).toBe(false)
    expect(isRolloverDue('', '2026-07-09')).toBe(false)
    expect(isRolloverDue('2026-07-09', 'invalid')).toBe(false)
  })
})
