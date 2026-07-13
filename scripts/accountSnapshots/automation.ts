import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { calculateEvaluate } from '../../src/calc/leverage'
import {
  computeNextSnapshotRunAt,
  localDateStringForTimeZone,
} from '../../src/db/accountSnapshotAutomation'
import {
  advanceRolloverDate,
  isRolloverAnchor,
  isRolloverDue,
  isRolloverInterval,
  isLocalDateString,
  type RolloverAnchor,
  type RolloverIntervalMonths,
} from '../../src/db/rolloverSchedule'
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

/** 자동 스냅샷 대상으로 지정된 클라우드 슬롯 하나(number_sets 행). */
export interface AutoSnapshotSlot {
  numberSetId: string
  title: string
  inputs: unknown
  /** 롤오버 알림 설정(꺼져 있거나 미지정이면 스냅샷을 정상 진행). */
  rolloverEnabled?: boolean
  rolloverIntervalMonths?: RolloverIntervalMonths | null
  rolloverAnchor?: RolloverAnchor | null
  rolloverNextDate?: string | null
}

export interface AccountSnapshotCronDeps {
  fetchDueSettings(nowIso: string): Promise<DueSnapshotSetting[]>
  fetchActiveSubscription(userId: string): Promise<{ active: boolean }>
  /** 자동 스냅샷이 켜진 슬롯 전부. 없으면 빈 배열. */
  fetchAutoSnapshotSlots(userId: string): Promise<AutoSnapshotSlot[]>
  insertAutoSnapshot(
    userId: string,
    payload: AccountSnapshotPayload,
  ): Promise<{ ok: true } | { ok: false; duplicate?: boolean; error: string }>
  /** 롤오버일에 스냅샷 대신: 슬롯을 대기로 표시하고 다음 예정일로 전진시킨다. */
  markSlotRolledOver(
    numberSetId: string,
    nextDate: string,
  ): Promise<{ ok: true } | { ok: false; error: string }>
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

interface AutoSnapshotSlotRow {
  id: string
  title: string | null
  inputs: unknown
  rollover_reminder_enabled: boolean | null
  rollover_interval_months: number | null
  rollover_anchor: string | null
  rollover_next_date: string | null
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])
const DEFAULT_SLOT_TITLE = 'Automatic snapshot'

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

function mapAutoSnapshotSlot(row: AutoSnapshotSlotRow): AutoSnapshotSlot {
  const interval = row.rollover_interval_months
  const anchor = row.rollover_anchor
  return {
    numberSetId: row.id,
    title: row.title?.trim() || DEFAULT_SLOT_TITLE,
    inputs: row.inputs,
    rolloverEnabled: row.rollover_reminder_enabled ?? false,
    rolloverIntervalMonths: isRolloverInterval(interval) ? interval : null,
    rolloverAnchor: isRolloverAnchor(anchor) ? anchor : null,
    rolloverNextDate: isLocalDateString(row.rollover_next_date) ? row.rollover_next_date : null,
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

    async fetchAutoSnapshotSlots(userId: string): Promise<AutoSnapshotSlot[]> {
      const { data, error } = await admin
        .from('number_sets')
        .select(
          'id,title,inputs,rollover_reminder_enabled,rollover_interval_months,rollover_anchor,rollover_next_date',
        )
        .eq('user_id', userId)
        .eq('auto_snapshot_enabled', true)
        .order('updated_at', { ascending: false })
        .returns<AutoSnapshotSlotRow[]>()

      if (error) throw new Error(error.message)
      return (data ?? []).map(mapAutoSnapshotSlot)
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
        number_set_id: payload.numberSetId,
      })
      if (!error) return { ok: true }
      return {
        ok: false,
        duplicate: duplicateError(error),
        error: error.message || 'snapshot_insert_failed',
      }
    },

    async markSlotRolledOver(numberSetId, nextDate) {
      const { error } = await admin
        .from('number_sets')
        .update({ rollover_pending: true, rollover_next_date: nextDate })
        .eq('id', numberSetId)
      if (error) return { ok: false, error: error.message || 'rollover_mark_failed' }
      return { ok: true }
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

/**
 * 한 유저의 due 스케줄을 처리한다. 자동 대상 슬롯 전부에 대해 스냅샷을 남기고,
 * 슬롯 단위 성공/건너뜀/실패 카운트를 돌려준다. next_run_at 갱신(markRun)은 유저당 1회.
 */
async function processDueSetting(
  deps: AccountSnapshotCronDeps,
  setting: DueSnapshotSetting,
  now: Date,
): Promise<{ processed: number; skipped: number; failed: number }> {
  const subscription = await deps.fetchActiveSubscription(setting.userId)
  if (!subscription.active) {
    const updated = await markRun(deps, setting, now, { lastError: 'not_pro' })
    return updated ? { processed: 0, skipped: 1, failed: 0 } : { processed: 0, skipped: 0, failed: 1 }
  }

  const slots = await deps.fetchAutoSnapshotSlots(setting.userId)
  if (slots.length === 0) {
    const updated = await markRun(deps, setting, now, { lastError: 'no_auto_slots' })
    return updated ? { processed: 0, skipped: 1, failed: 0 } : { processed: 0, skipped: 0, failed: 1 }
  }

  const sourceLocalDate = localDateStringForTimeZone(now, setting.timeZone)
  let processed = 0
  let skipped = 0
  let failed = 0
  let anySuccess = false
  let lastError: string | null = null

  for (const slot of slots) {
    // 롤오버일: 스냅샷을 남기면 옛 포지션 기준의 잘못된 기록이 되므로 건너뛴다.
    // 대신 슬롯을 대기로 표시하고 다음 예정일로 전진 → 마이페이지 배너로 유저에게 갱신 요청.
    if (
      slot.rolloverEnabled &&
      slot.rolloverIntervalMonths &&
      slot.rolloverAnchor &&
      isRolloverDue(slot.rolloverNextDate, sourceLocalDate)
    ) {
      const nextDate = advanceRolloverDate(
        slot.rolloverNextDate as string,
        slot.rolloverIntervalMonths,
        slot.rolloverAnchor,
        sourceLocalDate,
      )
      const marked = await deps.markSlotRolledOver(slot.numberSetId, nextDate)
      if (marked.ok) {
        skipped += 1
        lastError = 'rollover_pending'
      } else {
        failed += 1
        lastError = marked.error
      }
      continue
    }

    const inputs = asCalculatorInputs(slot.inputs)
    if (!inputs || !hasMeaningfulCalculatorInputs(inputs)) {
      skipped += 1
      lastError = 'missing_cloud_inputs'
      continue
    }

    const payload = buildAccountSnapshotPayload(inputs, calculateEvaluate(inputs), slot.title, {
      source: 'auto',
      sourceLocalDate,
      numberSetId: slot.numberSetId,
    })
    const inserted = await deps.insertAutoSnapshot(setting.userId, payload)
    if (inserted.ok) {
      processed += 1
      anySuccess = true
    } else if (inserted.duplicate) {
      skipped += 1
    } else {
      failed += 1
      lastError = inserted.error
    }
  }

  const updated = await markRun(deps, setting, now, {
    lastRunAt: anySuccess ? now.toISOString() : null,
    lastRunLocalDate: anySuccess ? sourceLocalDate : null,
    lastError,
  })
  if (!updated) failed += 1

  return { processed, skipped, failed }
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
      const counts = await processDueSetting(deps, setting, now)
      processed += counts.processed
      skipped += counts.skipped
      failed += counts.failed
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
