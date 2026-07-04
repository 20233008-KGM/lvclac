import type { CalculatorInputs } from '../types'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import { supabase } from './supabaseClient'

const DEFAULT_SET_TITLE = '기본 세트'

interface NumberSetRow {
  id: string
  title: string
  inputs: unknown
  updated_at: string
}

export interface NumberSetRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  updatedAt: string
}

type NumberSetResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

function unavailable<T>(): NumberSetResult<T> {
  return { data: null, error: 'supabase_not_configured' }
}

function mapError(error: { message?: string } | null | undefined): string {
  return error?.message || 'number_set_error'
}

function rowToRecord(row: NumberSetRow): NumberSetRecord {
  return {
    id: row.id,
    title: row.title || DEFAULT_SET_TITLE,
    inputs: parseStoredCalculatorInputs(row.inputs) ?? { mode: 'evaluate', positionSide: 'long' },
    updatedAt: row.updated_at,
  }
}

export async function fetchLatestNumberSet(
  userId: string,
): Promise<NumberSetResult<NumberSetRecord | null>> {
  if (!supabase) return unavailable()

  const { data, error } = await supabase
    .from('number_sets')
    .select('id,title,inputs,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
  return { data: data ? rowToRecord(data) : null, error: null }
}

export async function saveNumberSet(
  userId: string,
  inputs: CalculatorInputs,
  setId?: string | null,
): Promise<NumberSetResult<NumberSetRecord>> {
  if (!supabase) return unavailable()

  const existingId = setId ?? (await fetchLatestNumberSet(userId)).data?.id ?? null

  if (existingId) {
    const { data, error } = await supabase
      .from('number_sets')
      .update({ title: DEFAULT_SET_TITLE, inputs })
      .eq('id', existingId)
      .eq('user_id', userId)
      .select('id,title,inputs,updated_at')
      .maybeSingle<NumberSetRow>()

    if (error) return { data: null, error: mapError(error) }
    if (data) return { data: rowToRecord(data), error: null }
  }

  const { data, error } = await supabase
    .from('number_sets')
    .insert({ user_id: userId, title: DEFAULT_SET_TITLE, inputs })
    .select('id,title,inputs,updated_at')
    .single<NumberSetRow>()

  if (error) return { data: null, error: mapError(error) }
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
