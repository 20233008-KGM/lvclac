import type { CalculatorInputs } from '../types'
import { isPresetId, type PresetId } from '../i18n'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import { supabase } from './supabaseClient'

export const DEFAULT_SET_TITLE = '기본 세트'

interface NumberSetRow {
  id: string
  title: string
  inputs: unknown
  memo?: string | null
  preset_id?: string | null
  updated_at: string
  auto_snapshot_enabled?: boolean | null
}

export interface NumberSetRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  memo: string | null
  presetId: PresetId | null
  updatedAt: string
  autoSnapshotEnabled: boolean
}

export interface NumberSetRevision {
  id: string
  updatedAt: string
}

export interface NumberSetDeletionSummary {
  orderHistoryCount: number
  accountSnapshotCount: number
  memoCount: number
}

const NUMBER_SET_COLUMNS =
  'id,title,inputs,memo,preset_id,updated_at,auto_snapshot_enabled'

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

function rowToRecord(row: NumberSetRow): NumberSetRecord {
  return {
    id: row.id,
    title: row.title || DEFAULT_SET_TITLE,
    inputs: parseStoredCalculatorInputs(row.inputs) ?? { mode: 'evaluate', positionSide: 'long' },
    memo: row.memo?.trim() ? row.memo.slice(0, 500) : null,
    presetId: isPresetId(row.preset_id) ? row.preset_id : null,
    updatedAt: row.updated_at,
    autoSnapshotEnabled: row.auto_snapshot_enabled ?? false,
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

export async function fetchNumberSetRevisions(
  userId: string,
): Promise<NumberSetResult<NumberSetRevision[]>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .select('id,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .returns<Array<{ id: string; updated_at: string }>>()

  if (error) return { data: null, error: mapError(error) }
  return {
    data: (data ?? []).map((row) => ({ id: row.id, updatedAt: row.updated_at })),
    error: null,
  }
}

export async function createNumberSet(
  userId: string,
  inputs: CalculatorInputs,
  presetId: PresetId,
  title = DEFAULT_SET_TITLE,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .insert({ user_id: userId, title: normalizeTitle(title), inputs, preset_id: presetId })
    .select(NUMBER_SET_COLUMNS)
    .single<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  return { data: rowToRecord(data), error: null }
}

export async function saveNumberSet(
  userId: string,
  inputs: CalculatorInputs,
  presetId: PresetId,
  setId?: string | null,
  title?: string | null,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const existingId = setId ?? (await fetchLatestNumberSet(userId)).data?.id ?? null

  if (existingId) {
    const { data, error } = await supabase
      .from('number_sets')
      .update(
        title == null
          ? { inputs, preset_id: presetId }
          : { title: normalizeTitle(title), inputs, preset_id: presetId },
      )
      .eq('id', existingId)
      .eq('user_id', userId)
      .select(NUMBER_SET_COLUMNS)
      .maybeSingle<NumberSetRow>()

    if (error) return { data: null, error: mapError(error) }
    if (data) return { data: rowToRecord(data), error: null }
  }

  const { data, error } = await supabase
    .from('number_sets')
    .insert({ user_id: userId, title: normalizeTitle(title), inputs, preset_id: presetId })
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

export async function setNumberSetPreset(
  userId: string,
  setId: string,
  presetId: PresetId,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .update({ preset_id: presetId })
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
