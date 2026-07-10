import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { calculateEvaluate } from '../../src/calc/leverage'
import {
  computeNextSnapshotRunAt,
  localDateStringForTimeZone,
} from '../../src/db/accountSnapshotAutomation'
import {
  buildAccountSnapshotPayload,
  type AccountSnapshotPayload,
} from '../../src/db/accountRecordPayloads'
import type { CalculatorInputs } from '../../src/types'
import {
  hasMeaningfulCalculatorInputs,
  parseStoredCalculatorInputs,
} from '../../src/utils/storedCalculatorInputs'

export interface AccountSnapshotCronConfig {
  cronSecret: string
  supabaseUrl: string
  serviceRoleKey: string
}

export interface DueSnapshotSetting {
  userId: string
  label: string
  timeZone: string
  timeOfDay: string
}

export interface AccountSnapshotCronDeps {
  fetchDueSettings(nowIso: string): Promise<DueSnapshotSetting[]>
  fetchActiveSubscription(userId: string): Promise<{ active: boolean }>
  fetchLatestNumberSet(userId: string): Promise<{ inputs: unknown } | null>
  insertAutoSnapshot(
    userId: string,
    payload: AccountSnapshotPayload,
  ): Promise<{ ok: true } | { ok: false; duplicate?: boolean; error: string }>
  updateSettingAfterRun(
    userId: string,
    patch: {
      nextRunAt: string
      lastRunAt: string | null
      lastRunLocalDate: string | null
      lastError: string | null
    },
  ): Promise<{ ok: true } | { ok: false; error: string }>
}

export interface AccountSnapshotCronResult {
  status: number
  body: {
    ok: boolean
    processed: number
    skipped: number
    failed: number
  }
}

interface DueSettingRow {
  user_id: string
  label: string | null
  time_zone: string | null
  time_of_day: string | null
}

interface SubscriptionRow {
  status: string | null
}

interface NumberSetRow {
  inputs: unknown
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

function unauthorized(): AccountSnapshotCronResult {
  return { status: 401, body: { ok: false, processed: 0, skipped: 0, failed: 0 } }
}

function serverError(): AccountSnapshotCronResult {
  return { status: 500, body: { ok: false, processed: 0, skipped: 0, failed: 1 } }
}

export function readAccountSnapshotCronConfig(
  env: Record<string, string | undefined>,
): AccountSnapshotCronConfig | null {
  const cronSecret = env.CRON_SECRET
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!cronSecret || !supabaseUrl || !serviceRoleKey) return null
  return { cronSecret, supabaseUrl, serviceRoleKey }
}

function mapDueSetting(row: DueSettingRow): DueSnapshotSetting {
  return {
    userId: row.user_id,
    label: row.label?.trim() || 'Automatic snapshot',
    timeZone: row.time_zone?.trim() || 'UTC',
    timeOfDay: row.time_of_day?.trim() || '16:00',
  }
}

function duplicateError(error: { code?: string; message?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? ''
  return error?.code === '23505' || message.includes('duplicate')
}

export function createAccountSnapshotCronDeps(
  config: AccountSnapshotCronConfig,
): AccountSnapshotCronDeps {
  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return createAccountSnapshotCronDepsFromClient(admin)
}

export function createAccountSnapshotCronDepsFromClient(
  admin: SupabaseClient,
): AccountSnapshotCronDeps {
  return {
    async fetchDueSettings(nowIso: string): Promise<DueSnapshotSetting[]> {
      const { data, error } = await admin
        .from('account_snapshot_settings')
        .select('user_id,label,time_zone,time_of_day')
        .eq('enabled', true)
        .lte('next_run_at', nowIso)
        .limit(100)
        .returns<DueSettingRow[]>()

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapDueSetting)
    },

    async fetchActiveSubscription(userId: string): Promise<{ active: boolean }> {
      const { data, error } = await admin
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle<SubscriptionRow>()

      if (error) throw new Error(error.message)
      return { active: ACTIVE_SUBSCRIPTION_STATUSES.has(data?.status ?? '') }
    },

    async fetchLatestNumberSet(userId: string): Promise<{ inputs: unknown } | null> {
      const { data, error } = await admin
        .from('number_sets')
        .select('inputs')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle<NumberSetRow>()

      if (error) throw new Error(error.message)
      return data ? { inputs: data.inputs } : null
    },

    async insertAutoSnapshot(
      userId: string,
      payload: AccountSnapshotPayload,
    ): Promise<{ ok: true } | { ok: false; duplicate?: boolean; error: string }> {
      const { error } = await admin.from('account_snapshots').insert({
        user_id: userId,
        title: payload.title,
        inputs: payload.inputs,
        result: payload.result,
        source: payload.source,
        source_local_date: payload.sourceLocalDate,
      })
      if (!error) return { ok: true }
      return {
        ok: false,
        duplicate: duplicateError(error),
        error: error.message || 'snapshot_insert_failed',
      }
    },

    async updateSettingAfterRun(userId, patch) {
      const { error } = await admin
        .from('account_snapshot_settings')
        .update({
          next_run_at: patch.nextRunAt,
          last_run_at: patch.lastRunAt,
          last_run_local_date: patch.lastRunLocalDate,
          last_error: patch.lastError,
        })
        .eq('user_id', userId)
      if (error) return { ok: false, error: error.message || 'settings_update_failed' }
      return { ok: true }
    },
  }
}

function asCalculatorInputs(value: unknown): CalculatorInputs | null {
  return parseStoredCalculatorInputs(value)
}

function nextRunAfter(setting: DueSnapshotSetting, now: Date): string {
  return computeNextSnapshotRunAt(now, setting.timeZone, setting.timeOfDay).toISOString()
}

async function markRun(
  deps: AccountSnapshotCronDeps,
  setting: DueSnapshotSetting,
  now: Date,
  patch: {
    lastRunAt?: string | null
    lastRunLocalDate?: string | null
    lastError: string | null
  },
): Promise<boolean> {
  const result = await deps.updateSettingAfterRun(setting.userId, {
    nextRunAt: nextRunAfter(setting, now),
    lastRunAt: patch.lastRunAt ?? null,
    lastRunLocalDate: patch.lastRunLocalDate ?? null,
    lastError: patch.lastError,
  })
  return result.ok
}

export async function handleAccountSnapshotCron(
  config: AccountSnapshotCronConfig | null,
  request: { authorization?: string | null },
  deps: AccountSnapshotCronDeps,
  now = new Date(),
): Promise<AccountSnapshotCronResult> {
  if (!config) return serverError()
  if (request.authorization !== `Bearer ${config.cronSecret}`) return unauthorized()

  let dueSettings: DueSnapshotSetting[]
  try {
    dueSettings = await deps.fetchDueSettings(now.toISOString())
  } catch {
    return serverError()
  }

  let processed = 0
  let skipped = 0
  let failed = 0

  for (const setting of dueSettings) {
    try {
      const subscription = await deps.fetchActiveSubscription(setting.userId)
      if (!subscription.active) {
        const updated = await markRun(deps, setting, now, { lastError: 'not_pro' })
        if (updated) skipped += 1
        else failed += 1
        continue
      }

      const numberSet = await deps.fetchLatestNumberSet(setting.userId)
      const inputs = asCalculatorInputs(numberSet?.inputs)
      if (!inputs || !hasMeaningfulCalculatorInputs(inputs)) {
        const updated = await markRun(deps, setting, now, {
          lastError: 'missing_cloud_inputs',
        })
        if (updated) skipped += 1
        else failed += 1
        continue
      }

      const sourceLocalDate = localDateStringForTimeZone(now, setting.timeZone)
      const payload = buildAccountSnapshotPayload(
        inputs,
        calculateEvaluate(inputs),
        setting.label,
        { source: 'auto', sourceLocalDate },
      )
      const inserted = await deps.insertAutoSnapshot(setting.userId, payload)
      if (!inserted.ok) {
        if (inserted.duplicate) {
          const updated = await markRun(deps, setting, now, { lastError: null })
          if (updated) skipped += 1
          else failed += 1
          continue
        }
        const updated = await markRun(deps, setting, now, { lastError: inserted.error })
        if (updated) failed += 1
        else failed += 1
        continue
      }

      const updated = await markRun(deps, setting, now, {
        lastRunAt: now.toISOString(),
        lastRunLocalDate: sourceLocalDate,
        lastError: null,
      })
      if (updated) processed += 1
      else failed += 1
    } catch (error) {
      failed += 1
      await markRun(deps, setting, now, {
        lastError: error instanceof Error ? error.message : 'snapshot_cron_error',
      }).catch(() => undefined)
    }
  }

  return {
    status: 200,
    body: {
      ok: failed === 0,
      processed,
      skipped,
      failed,
    },
  }
}
