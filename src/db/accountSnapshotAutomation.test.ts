import { describe, expect, it } from 'vitest'
import {
  computeNextSnapshotRunAt,
  localDateStringForTimeZone,
  normalizeSnapshotAutomationSettings,
} from './accountSnapshotAutomation'

describe('account snapshot automation helpers', () => {
  it('computes the next run on the same local day when the configured time is still ahead', () => {
    const next = computeNextSnapshotRunAt(
      new Date('2026-07-09T06:00:00.000Z'),
      'Asia/Seoul',
      '15:45',
    )

    expect(next.toISOString()).toBe('2026-07-09T06:45:00.000Z')
  })

  it('rolls the next run to the following local day after the configured time passed', () => {
    const next = computeNextSnapshotRunAt(
      new Date('2026-07-09T07:00:00.000Z'),
      'Asia/Seoul',
      '15:45',
    )

    expect(next.toISOString()).toBe('2026-07-10T06:45:00.000Z')
  })

  it('uses the configured timezone rather than the server timezone', () => {
    const summer = computeNextSnapshotRunAt(
      new Date('2026-07-09T12:00:00.000Z'),
      'America/New_York',
      '16:00',
    )
    const winter = computeNextSnapshotRunAt(
      new Date('2026-12-09T12:00:00.000Z'),
      'America/New_York',
      '16:00',
    )

    expect(summer.toISOString()).toBe('2026-07-09T20:00:00.000Z')
    expect(winter.toISOString()).toBe('2026-12-09T21:00:00.000Z')
  })

  it('returns the snapshot local date in the configured timezone', () => {
    expect(localDateStringForTimeZone(new Date('2026-07-09T15:10:00.000Z'), 'Asia/Seoul'))
      .toBe('2026-07-10')
  })

  it('normalizes user-confirmed settings and rejects invalid timezone or time strings', () => {
    expect(
      normalizeSnapshotAutomationSettings({
        enabled: true,
        label: '  CME close  ',
        timeZone: 'America/New_York',
        timeOfDay: '16:00',
      }),
    ).toEqual({
      enabled: true,
      label: 'CME close',
      timeZone: 'America/New_York',
      timeOfDay: '16:00',
    })

    expect(() =>
      normalizeSnapshotAutomationSettings({
        enabled: true,
        label: 'bad',
        timeZone: 'Not/AZone',
        timeOfDay: '16:00',
      }),
    ).toThrow('invalid_time_zone')

    expect(() =>
      normalizeSnapshotAutomationSettings({
        enabled: true,
        label: 'bad',
        timeZone: 'Asia/Seoul',
        timeOfDay: '25:99',
      }),
    ).toThrow('invalid_time_of_day')
  })
})
