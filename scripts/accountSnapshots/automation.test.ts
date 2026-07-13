import { describe, expect, it } from 'vitest'
import { sampleInputs } from '../../src/types'
import {
  handleAccountSnapshotCron,
  type AccountSnapshotCronConfig,
  type AccountSnapshotCronDeps,
} from './automation'

const CONFIG: AccountSnapshotCronConfig = {
  cronSecret: 'secret',
  supabaseUrl: 'https://x.supabase.co',
  serviceRoleKey: 'svc',
}

function baseDeps(
  overrides: Partial<AccountSnapshotCronDeps> = {},
): AccountSnapshotCronDeps {
  return {
    fetchDueSettings: async () => [],
    fetchActiveSubscription: async () => ({ active: false }),
    fetchAutoSnapshotSlots: async () => [],
    insertAutoSnapshot: async () => ({ ok: true }),
    updateSettingAfterRun: async () => ({ ok: true }),
    ...overrides,
  }
}

describe('handleAccountSnapshotCron', () => {
  it('rejects requests without the configured cron bearer token', async () => {
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer nope' },
      baseDeps(),
    )

    expect(result.status).toBe(401)
    expect(result.body).toEqual({ ok: false, processed: 0, skipped: 0, failed: 0 })
  })

  it('snapshots every auto-enabled slot for a due Pro user, using slot titles', async () => {
    const inserts: Array<{
      userId: string
      sourceLocalDate: string | null
      title: string
      numberSetId: string | null
    }> = []
    const updates: Array<{ userId: string; lastError: string | null; lastRunLocalDate: string | null }> = []
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          {
            userId: 'user-1',
            label: 'Daily close',
            timeZone: 'America/New_York',
            timeOfDay: '16:00',
          },
        ],
        fetchActiveSubscription: async () => ({ active: true }),
        fetchAutoSnapshotSlots: async () => [
          { numberSetId: 'set-a', title: 'BTC perp', inputs: sampleInputs },
          { numberSetId: 'set-b', title: 'ETH perp', inputs: sampleInputs },
        ],
        insertAutoSnapshot: async (userId, payload) => {
          inserts.push({
            userId,
            sourceLocalDate: payload.sourceLocalDate,
            title: payload.title,
            numberSetId: payload.numberSetId,
          })
          return { ok: true }
        },
        updateSettingAfterRun: async (userId, patch) => {
          updates.push({
            userId,
            lastError: patch.lastError,
            lastRunLocalDate: patch.lastRunLocalDate,
          })
          return { ok: true }
        },
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 2, skipped: 0, failed: 0 })
    expect(inserts).toEqual([
      { userId: 'user-1', sourceLocalDate: '2026-07-09', title: 'BTC perp', numberSetId: 'set-a' },
      { userId: 'user-1', sourceLocalDate: '2026-07-09', title: 'ETH perp', numberSetId: 'set-b' },
    ])
    // 스케줄 갱신(markRun)은 유저당 1회.
    expect(updates).toEqual([
      { userId: 'user-1', lastError: null, lastRunLocalDate: '2026-07-09' },
    ])
  })

  it('skips non-Pro users and users with no auto-enabled slots without inserting snapshots', async () => {
    const errors: string[] = []
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          { userId: 'free-user', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
          { userId: 'no-slots-user', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
        ],
        fetchActiveSubscription: async (userId) => ({ active: userId === 'no-slots-user' }),
        fetchAutoSnapshotSlots: async () => [],
        insertAutoSnapshot: async () => {
          throw new Error('should_not_insert')
        },
        updateSettingAfterRun: async (_userId, patch) => {
          if (patch.lastError) errors.push(patch.lastError)
          return { ok: true }
        },
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 0, skipped: 2, failed: 0 })
    expect(errors).toEqual(['not_pro', 'no_auto_slots'])
  })

  it('treats a duplicate auto snapshot for the same slot+date as an idempotent skip', async () => {
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          { userId: 'user-1', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
        ],
        fetchActiveSubscription: async () => ({ active: true }),
        fetchAutoSnapshotSlots: async () => [
          { numberSetId: 'set-a', title: 'BTC perp', inputs: sampleInputs },
        ],
        insertAutoSnapshot: async () => ({ ok: false, duplicate: true, error: 'duplicate' }),
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 0, skipped: 1, failed: 0 })
  })

  it('counts per slot: one slot succeeds while another is skipped for empty inputs', async () => {
    const errors: Array<string | null> = []
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          { userId: 'user-1', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
        ],
        fetchActiveSubscription: async () => ({ active: true }),
        fetchAutoSnapshotSlots: async () => [
          { numberSetId: 'set-a', title: 'BTC perp', inputs: sampleInputs },
          { numberSetId: 'set-empty', title: 'Empty', inputs: { mode: 'evaluate', positionSide: 'long' } },
        ],
        updateSettingAfterRun: async (_userId, patch) => {
          errors.push(patch.lastError)
          return { ok: true }
        },
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 1, skipped: 1, failed: 0 })
    // 성공 슬롯이 있으니 lastRunLocalDate는 채워지고, 빈 슬롯 때문에 lastError는 missing_cloud_inputs.
    expect(errors).toEqual(['missing_cloud_inputs'])
  })
})
