import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CalculatorInputs,
  PositionSide,
} from '../types'
import { defaultInputs } from '../types'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import {
  computeNextSnapshotRunAt,
  normalizeSnapshotAutomationSettings,
  type AccountSnapshotAutomationSettings,
  type AccountSnapshotAutomationSettingsInput,
} from './accountSnapshotAutomation'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  summarizeEvaluateResult,
  summarizeOrderAfterResult,
  summarizeOrderBeforeResult,
  type AccountRecordSummary,
  type AccountSnapshotPayload,
  type AccountSnapshotSource,
  type OrderHistoryPayload,
} from './accountRecordPayloads'
import { supabase } from './supabaseClient'

const DEFAULT_SNAPSHOT_TITLE = 'Account snapshot'
const DEFAULT_RECORD_LIMIT = 20

// 장부 슬롯 필터: 전체(all) / 미분류(unassigned = number_set_id is null) / 특정 슬롯(slot)
export type NumberSetFilter =
  | { kind: 'all' }
  | { kind: 'unassigned' }
  | { kind: 'slot'; id: string }

const ALL_FILTER: NumberSetFilter = { kind: 'all' }

export {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  summarizeEvaluateResult,
  summarizeOrderAfterResult,
  summarizeOrderBeforeResult,
}

export type {
  AccountRecordSummary,
  AccountSnapshotPayload,
  AccountSnapshotSource,
  OrderHistoryPayload,
}

export interface OrderHistoryRow {
  id: string
  position_side: unknown
  order_contracts: unknown
  order_price: unknown
  before_inputs: unknown
  after_inputs: unknown
  before_result: unknown
  after_result: unknown
  number_set_id?: string | null
  created_at: string
}

export interface AccountSnapshotRow {
  id: string
  title: string | null
  inputs: unknown
  result: unknown
  source?: unknown
  source_local_date?: string | null
  number_set_id?: string | null
  created_at: string
}

interface AccountSnapshotSettingsRow {
  enabled: boolean
  label: string | null
  time_zone: string | null
  time_of_day: string | null
  next_run_at: string | null
  last_run_at: string | null
  last_run_local_date: string | null
  last_error: string | null
  created_at: string | null
  updated_at: string | null
}

export interface OrderHistoryRecord {
  id: string
  positionSide: PositionSide
  orderContracts: number
  orderPrice: number
  beforeInputs: CalculatorInputs
  afterInputs: CalculatorInputs
  beforeResult: AccountRecordSummary
  afterResult: AccountRecordSummary
  numberSetId?: string | null
  createdAt: string
}

export interface AccountSnapshotRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  result: AccountRecordSummary
  source?: AccountSnapshotSource
  sourceLocalDate?: string | null
  numberSetId?: string | null
  createdAt: string
}

export interface AccountRecordsBundle {
  orderHistory: OrderHistoryRecord[]
  accountSnapshots: AccountSnapshotRecord[]
  hasMoreOrders: boolean
  hasMoreSnapshots: boolean
}

export interface PaginatedRecords<T> {
  records: T[]
  hasMore: boolean
}

export interface AccountRecordCounts {
  orderHistoryCount: number
  accountSnapshotCount: number
}

type AccountRecordResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }

function unavailable<T>(): AccountRecordResult<T> {
  return { data: null, error: 'supabase_not_configured' }
}

function mapError(error: { message?: string } | null | undefined): string {
  return error?.message || 'account_records_error'
}

function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toNullableNumber(value: unknown): number | null {
  if (value == null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toPositionSide(value: unknown): PositionSide {
  return value === 'short' ? 'short' : 'long'
}

function toStoredInputs(value: unknown): CalculatorInputs {
  return parseStoredCalculatorInputs(value) ?? { ...defaultInputs }
}

function summaryFromUnknown(value: unknown): AccountRecordSummary {
  const record = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

  return {
    liquidationPrice: toNullableNumber(record.liquidationPrice),
    toleranceRate: toNullableNumber(record.toleranceRate),
    toleranceDelta: toNullableNumber(record.toleranceDelta),
    leverageRatio: toNullableNumber(record.leverageRatio),
    maintenanceMargin: toNullableNumber(record.maintenanceMargin),
    availableMargin: toNullableNumber(record.availableMargin),
    isAtRisk: record.isAtRisk === true,
  }
}

export function rowToOrderHistoryRecord(row: OrderHistoryRow): OrderHistoryRecord {
  return {
    id: row.id,
    positionSide: toPositionSide(row.position_side),
    orderContracts: toNumber(row.order_contracts),
    orderPrice: toNumber(row.order_price),
    beforeInputs: toStoredInputs(row.before_inputs),
    afterInputs: toStoredInputs(row.after_inputs),
    beforeResult: summaryFromUnknown(row.before_result),
    afterResult: summaryFromUnknown(row.after_result),
    numberSetId: row.number_set_id ?? null,
    createdAt: row.created_at,
  }
}

export function rowToAccountSnapshotRecord(row: AccountSnapshotRow): AccountSnapshotRecord {
  const source = row.source === 'auto' ? 'auto' : 'manual'
  return {
    id: row.id,
    title: row.title?.trim() || DEFAULT_SNAPSHOT_TITLE,
    inputs: toStoredInputs(row.inputs),
    result: summaryFromUnknown(row.result),
    source,
    sourceLocalDate: row.source_local_date ?? null,
    numberSetId: row.number_set_id ?? null,
    createdAt: row.created_at,
  }
}

function rowToAccountSnapshotSettings(
  row: AccountSnapshotSettingsRow,
): AccountSnapshotAutomationSettings {
  return {
    enabled: row.enabled,
    label: row.label?.trim() || DEFAULT_SNAPSHOT_TITLE,
    timeZone: row.time_zone?.trim() || 'UTC',
    timeOfDay: row.time_of_day?.trim() || '16:00',
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastRunLocalDate: row.last_run_local_date,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function orderPayloadToInsert(userId: string, payload: OrderHistoryPayload) {
  return {
    user_id: userId,
    position_side: payload.positionSide,
    order_contracts: payload.orderContracts,
    order_price: payload.orderPrice,
    before_inputs: payload.beforeInputs,
    after_inputs: payload.afterInputs,
    before_result: payload.beforeResult,
    after_result: payload.afterResult,
    number_set_id: payload.numberSetId ?? null,
  }
}

function snapshotPayloadToInsert(userId: string, payload: AccountSnapshotPayload) {
  return {
    user_id: userId,
    title: payload.title,
    inputs: payload.inputs,
    result: payload.result,
    source: payload.source,
    source_local_date: payload.sourceLocalDate,
    number_set_id: payload.numberSetId ?? null,
  }
}

function settingsPayloadToUpsert(
  userId: string,
  settings: AccountSnapshotAutomationSettingsInput,
  now = new Date(),
) {
  const normalized = normalizeSnapshotAutomationSettings(settings)
  return {
    user_id: userId,
    enabled: normalized.enabled,
    label: normalized.label,
    time_zone: normalized.timeZone,
    time_of_day: normalized.timeOfDay,
    next_run_at: normalized.enabled
      ? computeNextSnapshotRunAt(now, normalized.timeZone, normalized.timeOfDay).toISOString()
      : null,
    last_error: null,
  }
}

export function createAccountRecordsRepository(
  client: SupabaseClient | null = supabase,
) {
  return {
    async fetchOrderHistoryPage(
      userId: string,
      offset: number,
      limit = DEFAULT_RECORD_LIMIT,
      filter: NumberSetFilter = ALL_FILTER,
    ): Promise<AccountRecordResult<PaginatedRecords<OrderHistoryRecord>>> {
      if (!client) return unavailable()

      let query = client
        .from('order_history')
        .select(
          'id,position_side,order_contracts,order_price,before_inputs,after_inputs,before_result,after_result,number_set_id,created_at',
        )
        .eq('user_id', userId)
      if (filter.kind === 'slot') query = query.eq('number_set_id', filter.id)
      else if (filter.kind === 'unassigned') query = query.is('number_set_id', null)

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)
        .returns<OrderHistoryRow[]>()

      if (error) return { data: null, error: mapError(error) }
      const rows = data ?? []
      return {
        data: {
          records: rows.slice(0, limit).map(rowToOrderHistoryRecord),
          hasMore: rows.length > limit,
        },
        error: null,
      }
    },

    async fetchAccountSnapshotsPage(
      userId: string,
      offset: number,
      limit = DEFAULT_RECORD_LIMIT,
      filter: NumberSetFilter = ALL_FILTER,
    ): Promise<AccountRecordResult<PaginatedRecords<AccountSnapshotRecord>>> {
      if (!client) return unavailable()

      let query = client
        .from('account_snapshots')
        .select('id,title,inputs,result,source,source_local_date,number_set_id,created_at')
        .eq('user_id', userId)
      if (filter.kind === 'slot') query = query.eq('number_set_id', filter.id)
      else if (filter.kind === 'unassigned') query = query.is('number_set_id', null)

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit)
        .returns<AccountSnapshotRow[]>()

      if (error) return { data: null, error: mapError(error) }
      const rows = data ?? []
      return {
        data: {
          records: rows.slice(0, limit).map(rowToAccountSnapshotRecord),
          hasMore: rows.length > limit,
        },
        error: null,
      }
    },

    async fetchRecentRecords(
      userId: string,
      limit = DEFAULT_RECORD_LIMIT,
      filter: NumberSetFilter = ALL_FILTER,
    ): Promise<AccountRecordResult<AccountRecordsBundle>> {
      if (!client) return unavailable()

      const [ordersResult, snapshotsResult] = await Promise.all([
        this.fetchOrderHistoryPage(userId, 0, limit, filter),
        this.fetchAccountSnapshotsPage(userId, 0, limit, filter),
      ])

      const ordersFailed = ordersResult.error !== null
      const snapshotsFailed = snapshotsResult.error !== null
      if (ordersFailed && snapshotsFailed) {
        return { data: null, error: snapshotsResult.error ?? ordersResult.error }
      }

      return {
        data: {
          orderHistory: ordersFailed ? [] : ordersResult.data.records,
          accountSnapshots: snapshotsFailed ? [] : snapshotsResult.data.records,
          hasMoreOrders: ordersFailed ? false : ordersResult.data.hasMore,
          hasMoreSnapshots: snapshotsFailed ? false : snapshotsResult.data.hasMore,
        },
        error: null,
      }
    },

    async fetchRecordCounts(
      userId: string,
      filter: NumberSetFilter = ALL_FILTER,
    ): Promise<AccountRecordResult<AccountRecordCounts>> {
      if (!client) return unavailable()

      let ordersQuery = client
        .from('order_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      let snapshotsQuery = client
        .from('account_snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (filter.kind === 'slot') {
        ordersQuery = ordersQuery.eq('number_set_id', filter.id)
        snapshotsQuery = snapshotsQuery.eq('number_set_id', filter.id)
      } else if (filter.kind === 'unassigned') {
        ordersQuery = ordersQuery.is('number_set_id', null)
        snapshotsQuery = snapshotsQuery.is('number_set_id', null)
      }

      const [ordersResult, snapshotsResult] = await Promise.all([ordersQuery, snapshotsQuery])

      if (ordersResult.error) return { data: null, error: mapError(ordersResult.error) }
      if (snapshotsResult.error) return { data: null, error: mapError(snapshotsResult.error) }

      return {
        data: {
          orderHistoryCount: ordersResult.count ?? 0,
          accountSnapshotCount: snapshotsResult.count ?? 0,
        },
        error: null,
      }
    },

    async createOrderHistory(
      userId: string,
      payload: OrderHistoryPayload,
    ): Promise<AccountRecordResult<OrderHistoryRecord>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('order_history')
        .insert(orderPayloadToInsert(userId, payload))
        .select(
          'id,position_side,order_contracts,order_price,before_inputs,after_inputs,before_result,after_result,number_set_id,created_at',
        )
        .single<OrderHistoryRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToOrderHistoryRecord(data), error: null }
    },

    async createAccountSnapshot(
      userId: string,
      payload: AccountSnapshotPayload,
    ): Promise<AccountRecordResult<AccountSnapshotRecord>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('account_snapshots')
        .insert(snapshotPayloadToInsert(userId, payload))
        .select('id,title,inputs,result,source,source_local_date,number_set_id,created_at')
        .single<AccountSnapshotRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToAccountSnapshotRecord(data), error: null }
    },

    async fetchAccountSnapshotSettings(
      userId: string,
    ): Promise<AccountRecordResult<AccountSnapshotAutomationSettings | null>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('account_snapshot_settings')
        .select(
          'enabled,label,time_zone,time_of_day,next_run_at,last_run_at,last_run_local_date,last_error,created_at,updated_at',
        )
        .eq('user_id', userId)
        .maybeSingle<AccountSnapshotSettingsRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: data ? rowToAccountSnapshotSettings(data) : null, error: null }
    },

    async saveAccountSnapshotSettings(
      userId: string,
      settings: AccountSnapshotAutomationSettingsInput,
      now = new Date(),
    ): Promise<AccountRecordResult<AccountSnapshotAutomationSettings>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('account_snapshot_settings')
        .upsert(settingsPayloadToUpsert(userId, settings, now), { onConflict: 'user_id' })
        .select(
          'enabled,label,time_zone,time_of_day,next_run_at,last_run_at,last_run_local_date,last_error,created_at,updated_at',
        )
        .single<AccountSnapshotSettingsRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToAccountSnapshotSettings(data), error: null }
    },

    async disableAccountSnapshotSettings(
      userId: string,
    ): Promise<AccountRecordResult<AccountSnapshotAutomationSettings>> {
      if (!client) return unavailable()

      const { data, error } = await client
        .from('account_snapshot_settings')
        .update({ enabled: false, next_run_at: null })
        .eq('user_id', userId)
        .select(
          'enabled,label,time_zone,time_of_day,next_run_at,last_run_at,last_run_local_date,last_error,created_at,updated_at',
        )
        .single<AccountSnapshotSettingsRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToAccountSnapshotSettings(data), error: null }
    },

    async deleteOrderHistory(
      userId: string,
      id: string,
    ): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()

      const { error } = await client
        .from('order_history')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },

    async deleteAccountSnapshot(
      userId: string,
      id: string,
    ): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()

      const { error } = await client
        .from('account_snapshots')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },

    async deleteOrderHistoryMany(
      userId: string,
      ids: string[],
    ): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()
      if (ids.length === 0) return { data: true, error: null }

      const { error } = await client
        .from('order_history')
        .delete()
        .in('id', ids)
        .eq('user_id', userId)

      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },

    async deleteAccountSnapshotsMany(
      userId: string,
      ids: string[],
    ): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()
      if (ids.length === 0) return { data: true, error: null }

      const { error } = await client
        .from('account_snapshots')
        .delete()
        .in('id', ids)
        .eq('user_id', userId)

      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },

    async deleteAllOrderHistory(userId: string): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()
      const { error } = await client.from('order_history').delete().eq('user_id', userId)
      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },

    async deleteAllAccountSnapshots(userId: string): Promise<AccountRecordResult<true>> {
      if (!client) return unavailable()
      const { error } = await client.from('account_snapshots').delete().eq('user_id', userId)
      if (error) return { data: null, error: mapError(error) }
      return { data: true, error: null }
    },
  }
}
