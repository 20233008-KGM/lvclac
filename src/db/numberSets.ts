import type { CalculatorInputs } from '../types'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import { supabase } from './supabaseClient'

export const DEFAULT_SET_TITLE = '기본 세트'

interface NumberSetRow {
  id: string
  title: string
  inputs: unknown
  updated_at: string
  auto_snapshot_enabled?: boolean | null
}

export interface NumberSetRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  updatedAt: string
  autoSnapshotEnabled: boolean
}

const NUMBER_SET_COLUMNS = 'id,title,inputs,updated_at,auto_snapshot_enabled'

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
