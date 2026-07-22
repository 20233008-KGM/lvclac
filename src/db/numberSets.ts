import type { CalculatorInputs } from '../types'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import {
  isRolloverAnchor,
  isRolloverInterval,
  isLocalDateString,
  type RolloverAnchor,
  type RolloverIntervalMonths,
} from './rolloverSchedule'
import { supabase } from './supabaseClient'

export const DEFAULT_SET_TITLE = '기본 세트'

interface NumberSetRow {
  id: string
  title: string
  inputs: unknown
  memo?: string | null
  updated_at: string
  auto_snapshot_enabled?: boolean | null
  rollover_reminder_enabled?: boolean | null
  rollover_interval_months?: number | null
  rollover_anchor?: string | null
  rollover_next_date?: string | null
  rollover_pending?: boolean | null
}

/** 슬롯별 롤오버 알림 설정. enabled=false면 나머지는 무시된다. */
export interface RolloverSettings {
  enabled: boolean
  intervalMonths: RolloverIntervalMonths | null
  anchor: RolloverAnchor | null
  nextDate: string | null
  pending: boolean
}

export interface NumberSetRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  memo: string | null
  updatedAt: string
  autoSnapshotEnabled: boolean
  rollover: RolloverSettings
}

export interface NumberSetDeletionSummary {
  orderHistoryCount: number
  accountSnapshotCount: number
  memoCount: number
}

const NUMBER_SET_COLUMNS =
  'id,title,inputs,memo,updated_at,auto_snapshot_enabled,' +
  'rollover_reminder_enabled,rollover_interval_months,rollover_anchor,rollover_next_date,rollover_pending'

type NumberSetResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

function unavailable<T>(): NumberSetResult<T> {
  return { data: null, error: 'supabase_not_configured' }
}

function mapError(error: { message?: string } | null | undefined): string {
  return error?.message || 'number_set_error'
}

function normalizeTitle(title: string | null | undefined): string {
  return title?.trim() || DEFAULT_SET_TITLE
}

function rowToRollover(row: NumberSetRow): RolloverSettings {
  const interval = row.rollover_interval_months
  const anchor = row.rollover_anchor
  return {
    enabled: row.rollover_reminder_enabled ?? false,
    intervalMonths: isRolloverInterval(interval) ? interval : null,
    anchor: isRolloverAnchor(anchor) ? anchor : null,
    nextDate: isLocalDateString(row.rollover_next_date) ? row.rollover_next_date : null,
    pending: row.rollover_pending ?? false,
  }
}

function rowToRecord(row: NumberSetRow): NumberSetRecord {
  return {
    id: row.id,
    title: row.title || DEFAULT_SET_TITLE,
    inputs: parseStoredCalculatorInputs(row.inputs) ?? { mode: 'evaluate', positionSide: 'long' },
    memo: row.memo?.trim() ? row.memo.slice(0, 500) : null,
    updatedAt: row.updated_at,
    autoSnapshotEnabled: row.auto_snapshot_enabled ?? false,
    rollover: rowToRollover(row),
  }
}

export async function fetchLatestNumberSet(
  userId: string,
): Promise<NumberSetResult<NumberSetRecord | null>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .select(NUMBER_SET_COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  return { data: data ? rowToRecord(data) : null, error: null }
}

export async function fetchNumberSets(
  userId: string,
): Promise<NumberSetResult<NumberSetRecord[]>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .select(NUMBER_SET_COLUMNS)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<NumberSetRow[]>()

  if (error) return { data: null, error: mapError(error) }
  return { data: (data ?? []).map(rowToRecord), error: null }
}

export async function createNumberSet(
  userId: string,
  inputs: CalculatorInputs,
  title = DEFAULT_SET_TITLE,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .insert({ user_id: userId, title: normalizeTitle(title), inputs })
    .select(NUMBER_SET_COLUMNS)
    .single<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  return { data: rowToRecord(data), error: null }
}

export async function saveNumberSet(
  userId: string,
  inputs: CalculatorInputs,
  setId?: string | null,
  title?: string | null,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const existingId = setId ?? (await fetchLatestNumberSet(userId)).data?.id ?? null

  if (existingId) {
    const { data, error } = await supabase
      .from('number_sets')
      .update(title == null ? { inputs } : { title: normalizeTitle(title), inputs })
      .eq('id', existingId)
      .eq('user_id', userId)
      .select(NUMBER_SET_COLUMNS)
      .maybeSingle<NumberSetRow>()

    if (error) return { data: null, error: mapError(error) }
    if (data) return { data: rowToRecord(data), error: null }
  }

  const { data, error } = await supabase
    .from('number_sets')
    .insert({ user_id: userId, title: normalizeTitle(title), inputs })
    .select(NUMBER_SET_COLUMNS)
    .single<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  return { data: rowToRecord(data), error: null }
}

export async function renameNumberSet(
  userId: string,
  setId: string,
  title: string,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .update({ title: normalizeTitle(title) })
    .eq('id', setId)
    .eq('user_id', userId)
    .select(NUMBER_SET_COLUMNS)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  if (!data) return { data: null, error: 'number_set_not_found' }
  return { data: rowToRecord(data), error: null }
}

export async function updateNumberSetMemo(
  userId: string,
  setId: string,
  memo: string,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const normalized = memo.trim() ? memo.slice(0, 500) : null
  const { data, error } = await supabase
    .from('number_sets')
    .update({ memo: normalized })
    .eq('id', setId)
    .eq('user_id', userId)
    .select(NUMBER_SET_COLUMNS)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  if (!data) return { data: null, error: 'number_set_not_found' }
  return { data: rowToRecord(data), error: null }
}

export async function setNumberSetAutoSnapshot(
  userId: string,
  setId: string,
  enabled: boolean,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .update({ auto_snapshot_enabled: enabled })
    .eq('id', setId)
    .eq('user_id', userId)
    .select(NUMBER_SET_COLUMNS)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  if (!data) return { data: null, error: 'number_set_not_found' }
  return { data: rowToRecord(data), error: null }
}

/** 슬롯의 롤오버 알림 설정을 저장한다. 재설정 시 대기(pending)는 초기화한다. */
export async function setNumberSetRollover(
  userId: string,
  setId: string,
  settings: {
    enabled: boolean
    intervalMonths: RolloverIntervalMonths | null
    anchor: RolloverAnchor | null
    nextDate: string | null
  },
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .update({
      rollover_reminder_enabled: settings.enabled,
      rollover_interval_months: settings.enabled ? settings.intervalMonths : null,
      rollover_anchor: settings.enabled ? settings.anchor : null,
      rollover_next_date: settings.enabled ? settings.nextDate : null,
      rollover_pending: false,
    })
    .eq('id', setId)
    .eq('user_id', userId)
    .select(NUMBER_SET_COLUMNS)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  if (!data) return { data: null, error: 'number_set_not_found' }
  return { data: rowToRecord(data), error: null }
}

/** 유저가 새 약정가로 값을 갱신했을 때 롤오버 대기 상태를 해제한다. */
export async function clearNumberSetRolloverPending(
  userId: string,
  setId: string,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .update({ rollover_pending: false })
    .eq('id', setId)
    .eq('user_id', userId)
    .select(NUMBER_SET_COLUMNS)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  if (!data) return { data: null, error: 'number_set_not_found' }
  return { data: rowToRecord(data), error: null }
}

export async function deleteNumberSet(
  userId: string,
  setId?: string | null,
): Promise<NumberSetResult<true>> {
  if (!supabase) return unavailable()

  const targetId = setId ?? (await fetchLatestNumberSet(userId)).data?.id ?? null
  if (!targetId) return { data: true, error: null }

  const { error } = await supabase
    .from('number_sets')
    .delete()
    .eq('id', targetId)
    .eq('user_id', userId)

  if (error) return { data: null, error: mapError(error) }
  return { data: true, error: null }
}

type NumberSetDeletionClient = NonNullable<typeof supabase>

interface NumberSetDeletionSummaryRow {
  order_history_count: number
  account_snapshot_count: number
  memo_count: number
}

export function createNumberSetDeletionRepository(
  client: NumberSetDeletionClient | null = supabase,
) {
  return {
    async fetchSummary(
      userId: string,
      setId: string,
    ): Promise<NumberSetResult<NumberSetDeletionSummary>> {
      if (!client) return unavailable()
      const { data, error } = await client
        .rpc('get_number_set_deletion_summary', {
          p_user_id: userId,
          p_number_set_id: setId,
        })
        .maybeSingle<NumberSetDeletionSummaryRow>()

      if (error) return { data: null, error: mapError(error) }
      if (!data) return { data: null, error: 'number_set_not_found' }
      return {
        data: {
          orderHistoryCount: Number(data.order_history_count),
          accountSnapshotCount: Number(data.account_snapshot_count),
          memoCount: Number(data.memo_count),
        },
        error: null,
      }
    },
  }
}

export async function fetchNumberSetDeletionSummary(
  userId: string,
  setId: string,
): Promise<NumberSetResult<NumberSetDeletionSummary>> {
  return createNumberSetDeletionRepository().fetchSummary(userId, setId)
}
