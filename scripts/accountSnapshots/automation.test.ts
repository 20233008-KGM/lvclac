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
    fetchLatestNumberSet: async () => null,
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

  it('processes due Pro users with cloud inputs and records the local snapshot date', async () => {
    const inserts: Array<{ userId: string; sourceLocalDate: string | null; title: string }> = []
    const updates: Array<{ userId: string; lastError: string | null }> = []
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          {
            userId: 'user-1',
            label: 'CME close',
            timeZone: 'America/New_York',
            timeOfDay: '16:00',
          },
        ],
        fetchActiveSubscription: async () => ({ active: true }),
        fetchLatestNumberSet: async () => ({ inputs: sampleInputs }),
        insertAutoSnapshot: async (userId, payload) => {
          inserts.push({
            userId,
            sourceLocalDate: payload.sourceLocalDate,
            title: payload.title,
          })
          return { ok: true }
        },
        updateSettingAfterRun: async (userId, patch) => {
          updates.push({ userId, lastError: patch.lastError })
          return { ok: true }
        },
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 1, skipped: 0, failed: 0 })
    expect(inserts).toEqual([
      { userId: 'user-1', sourceLocalDate: '2026-07-09', title: 'CME close' },
    ])
    expect(updates).toEqual([{ userId: 'user-1', lastError: null }])
  })

  it('skips non-Pro users and users without cloud inputs without inserting snapshots', async () => {
    const errors: string[] = []
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          { userId: 'free-user', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
          { userId: 'empty-user', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
        ],
        fetchActiveSubscription: async (userId) => ({ active: userId === 'empty-user' }),
        fetchLatestNumberSet: async () => null,
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
    expect(errors).toEqual(['not_pro', 'missing_cloud_inputs'])
  })

  it('treats duplicate auto snapshots for the same local date as an idempotent skip', async () => {
    const result = await handleAccountSnapshotCron(
      CONFIG,
      { authorization: 'Bearer secret' },
      baseDeps({
        fetchDueSettings: async () => [
          { userId: 'user-1', label: 'Close', timeZone: 'UTC', timeOfDay: '16:00' },
        ],
        fetchActiveSubscription: async () => ({ active: true }),
        fetchLatestNumberSet: async () => ({ inputs: sampleInputs }),
        insertAutoSnapshot: async () => ({ ok: false, duplicate: true, error: 'duplicate' }),
      }),
      new Date('2026-07-09T20:01:00.000Z'),
    )

    expect(result.body).toMatchObject({ ok: true, processed: 0, skipped: 1, failed: 0 })
  })
})
