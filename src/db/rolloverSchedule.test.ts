import { describe, expect, it } from 'vitest'
import {
  advanceRolloverDate,
  anchorDateInMonth,
  computeNextRolloverDate,
  isRolloverDue,
  nthWeekdayOfMonth,
} from './rolloverSchedule'

describe('nthWeekdayOfMonth', () => {
  it('finds the 2nd Thursday of July 2026 (2026-07-09)', () => {
    // 2026-07-01은 수요일 → 첫 목요일 07-02, 둘째 목요일 07-09.
    expect(nthWeekdayOfMonth(2026, 7, 4, 2)).toBe('2026-07-09')
  })

  it('finds the 3rd Friday of July 2026 (2026-07-17)', () => {
    expect(nthWeekdayOfMonth(2026, 7, 5, 3)).toBe('2026-07-17')
  })

  it('handles a month whose 1st is the target weekday', () => {
    // 2026-01-01은 목요일 → 첫 목요일이 곧 01-01.
    expect(nthWeekdayOfMonth(2026, 1, 4, 1)).toBe('2026-01-01')
  })
})

describe('anchorDateInMonth', () => {
  it('maps second_thursday and third_friday correctly', () => {
    expect(anchorDateInMonth(2026, 3, 'second_thursday')).toBe('2026-03-12')
    expect(anchorDateInMonth(2026, 3, 'third_friday')).toBe('2026-03-20')
  })
})

describe('computeNextRolloverDate', () => {
  it('monthly (interval 1): picks this month if the anchor is still ahead', () => {
    // 07-01 기준, 이번 달 둘째 목요일 07-09가 아직 안 지났으니 그날.
    expect(computeNextRolloverDate('2026-07-01', 1, 'second_thursday')).toBe('2026-07-09')
  })

  it('monthly: rolls to next month when this month anchor already passed', () => {
    // 07-10 기준, 07-09는 지났으니 다음 달 둘째 목요일 08-13.
    expect(computeNextRolloverDate('2026-07-10', 1, 'second_thursday')).toBe('2026-08-13')
  })

  it('quarterly (interval 3): snaps to Mar/Jun/Sep/Dec', () => {
    // 07-10 기준 → 다음 분기월은 9월. 2026-09 둘째 목요일 = 09-10.
    expect(computeNextRolloverDate('2026-07-10', 3, 'second_thursday')).toBe('2026-09-10')
  })

  it('quarterly with US anchor snaps to 3rd Friday of the quarter month', () => {
    // 2026-09 셋째 금요일 = 09-18.
    expect(computeNextRolloverDate('2026-07-10', 3, 'third_friday')).toBe('2026-09-18')
  })

  it('bimonthly (interval 2): defaults to even months (metals convention)', () => {
    // 07-10 기준 → 다음 짝수달 8월. 2026-08 둘째 목요일 = 08-13.
    expect(computeNextRolloverDate('2026-07-10', 2, 'second_thursday')).toBe('2026-08-13')
  })

  it('semiannual (interval 6): snaps to Jun/Dec', () => {
    // 07-10 기준 → 다음은 12월. 2026-12 둘째 목요일 = 12-10.
    expect(computeNextRolloverDate('2026-07-10', 6, 'second_thursday')).toBe('2026-12-10')
  })
})

describe('advanceRolloverDate', () => {
  it('advances quarterly by 3 months keeping the anchor rule', () => {
    // 2026-09-10(둘째 목)에서 분기 전진 → 2026-12 둘째 목요일 12-10.
    expect(advanceRolloverDate('2026-09-10', 3, 'second_thursday', '2026-09-10')).toBe('2026-12-10')
  })

  it('preserves an odd-month phase set by a user override (bimonthly)', () => {
    // 유저가 홀수달(9월)로 지정 → 격월 전진은 11월 유지(관행 짝수달로 튀지 않음).
    // 2026-11 둘째 목요일 = 11-12.
    expect(advanceRolloverDate('2026-09-10', 2, 'second_thursday', '2026-09-10')).toBe('2026-11-12')
  })

  it('skips forward past a notBefore that is several cycles ahead', () => {
    // 예정일이 한참 뒤처졌을 때(놓친 크론) notBefore보다 확실히 큰 날짜까지 전진.
    // 저장 위상이 1월(Jan) → 분기 전진은 1·4·7·10월 유지 → 8/1 다음은 10월 둘째 목요일 10-08.
    expect(advanceRolloverDate('2026-01-08', 3, 'second_thursday', '2026-08-01')).toBe('2026-10-08')
  })

  it('always returns strictly after notBefore, even when notBefore equals the next step', () => {
    // 다음 스텝(2026-12-10)이 notBefore와 같으면 한 번 더 전진.
    expect(advanceRolloverDate('2026-09-10', 3, 'second_thursday', '2026-12-10')).toBe('2027-03-11')
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

  it('is never due when no next date is set', () => {
    expect(isRolloverDue(null, '2026-07-09')).toBe(false)
    expect(isRolloverDue(undefined, '2026-07-09')).toBe(false)
    expect(isRolloverDue('', '2026-07-09')).toBe(false)
  })
})
