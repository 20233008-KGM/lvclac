import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CalculatorInputs,
  EvaluateResult,
  OrderResult,
  PositionSide,
} from '../types'
import { defaultInputs } from '../types'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'
import { supabase } from './supabaseClient'

const DEFAULT_SNAPSHOT_TITLE = 'Account snapshot'
const DEFAULT_RECORD_LIMIT = 20

export interface AccountRecordSummary {
  liquidationPrice: number | null
  toleranceRate: number | null
  toleranceDelta: number | null
  leverageRatio: number | null
  maintenanceMargin: number | null
  availableMargin: number | null
  isAtRisk: boolean
}

export interface OrderHistoryPayload {
  positionSide: PositionSide
  orderContracts: number
  orderPrice: number
  beforeInputs: CalculatorInputs
  afterInputs: CalculatorInputs
  beforeResult: AccountRecordSummary
  afterResult: AccountRecordSummary
}

export interface AccountSnapshotPayload {
  title: string
  inputs: CalculatorInputs
  result: AccountRecordSummary
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
  created_at: string
}

export interface AccountSnapshotRow {
  id: string
  title: string | null
  inputs: unknown
  result: unknown
  created_at: string
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
  createdAt: string
}

export interface AccountSnapshotRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  result: AccountRecordSummary
  createdAt: string
}

export interface AccountRecordsBundle {
  orderHistory: OrderHistoryRecord[]
  accountSnapshots: AccountSnapshotRecord[]
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

function cloneInputs(inputs: CalculatorInputs): CalculatorInputs {
  return { ...inputs }
}

export function summarizeEvaluateResult(result: EvaluateResult): AccountRecordSummary {
  return {
    liquidationPrice: result.liquidationPrice,
    toleranceRate: result.toleranceRate,
    toleranceDelta: result.toleranceDelta,
    leverageRatio: result.leverageRatio,
    maintenanceMargin: result.margins?.maintenanceMargin ?? null,
    availableMargin: result.margins?.availableMargin ?? null,
    isAtRisk: result.isAtRisk,
  }
}

export function summarizeOrderBeforeResult(result: OrderResult): AccountRecordSummary {
  return {
    liquidationPrice: result.beforeLiquidation,
    toleranceRate: result.beforeTolerance,
    toleranceDelta: result.beforeToleranceDelta,
    leverageRatio: result.beforeLeverageRatio,
    maintenanceMargin: result.beforeMargins?.maintenanceMargin ?? null,
    availableMargin: result.beforeMargins?.availableMargin ?? null,
    isAtRisk: result.isAtRiskBefore,
  }
}

export function summarizeOrderAfterResult(result: OrderResult): AccountRecordSummary {
  return {
    liquidationPrice: result.afterLiquidation,
    toleranceRate: result.afterTolerance,
    toleranceDelta: result.afterToleranceDelta,
    leverageRatio: result.afterLeverageRatio,
    maintenanceMargin: result.afterMargins?.maintenanceMargin ?? null,
    availableMargin: result.afterMargins?.availableMargin ?? null,
    isAtRisk: result.isAtRiskAfter,
  }
}

export function buildAccountSnapshotPayload(
  inputs: CalculatorInputs,
  result: EvaluateResult,
  title = DEFAULT_SNAPSHOT_TITLE,
): AccountSnapshotPayload {
  return {
    title: title.trim() || DEFAULT_SNAPSHOT_TITLE,
    inputs: cloneInputs(inputs),
    result: summarizeEvaluateResult(result),
  }
}

export function buildOrderHistoryPayload(
  beforeInputs: CalculatorInputs,
  afterInputs: CalculatorInputs,
  orderResult: OrderResult,
): OrderHistoryPayload {
  return {
    positionSide: beforeInputs.positionSide,
    orderContracts: beforeInputs.orderContracts ?? 0,
    orderPrice: beforeInputs.orderPrice ?? beforeInputs.currentPrice ?? 0,
    beforeInputs: cloneInputs(beforeInputs),
    afterInputs: cloneInputs(afterInputs),
    beforeResult: summarizeOrderBeforeResult(orderResult),
    afterResult: summarizeOrderAfterResult(orderResult),
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
    createdAt: row.created_at,
  }
}

export function rowToAccountSnapshotRecord(row: AccountSnapshotRow): AccountSnapshotRecord {
  return {
    id: row.id,
    title: row.title?.trim() || DEFAULT_SNAPSHOT_TITLE,
    inputs: toStoredInputs(row.inputs),
    result: summaryFromUnknown(row.result),
    createdAt: row.created_at,
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
  }
}

function snapshotPayloadToInsert(userId: string, payload: AccountSnapshotPayload) {
  return {
    user_id: userId,
    title: payload.title,
    inputs: payload.inputs,
    result: payload.result,
  }
}

export function createAccountRecordsRepository(
  client: SupabaseClient | null = supabase,
) {
  return {
    async fetchRecentRecords(
      userId: string,
      limit = DEFAULT_RECORD_LIMIT,
    ): Promise<AccountRecordResult<AccountRecordsBundle>> {
      if (!client) return unavailable()

      const [ordersResult, snapshotsResult] = await Promise.all([
        client
          .from('order_history')
          .select(
            'id,position_side,order_contracts,order_price,before_inputs,after_inputs,before_result,after_result,created_at',
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .returns<OrderHistoryRow[]>(),
        client
          .from('account_snapshots')
          .select('id,title,inputs,result,created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
          .returns<AccountSnapshotRow[]>(),
      ])

      if (ordersResult.error) return { data: null, error: mapError(ordersResult.error) }
      if (snapshotsResult.error) return { data: null, error: mapError(snapshotsResult.error) }

      return {
        data: {
          orderHistory: (ordersResult.data ?? []).map(rowToOrderHistoryRecord),
          accountSnapshots: (snapshotsResult.data ?? []).map(rowToAccountSnapshotRecord),
        },
        error: null,
      }
    },

    async fetchRecordCounts(userId: string): Promise<AccountRecordResult<AccountRecordCounts>> {
      if (!client) return unavailable()

      const [ordersResult, snapshotsResult] = await Promise.all([
        client
          .from('order_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        client
          .from('account_snapshots')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
      ])

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
          'id,position_side,order_contracts,order_price,before_inputs,after_inputs,before_result,after_result,created_at',
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
        .select('id,title,inputs,result,created_at')
        .single<AccountSnapshotRow>()

      if (error) return { data: null, error: mapError(error) }
      return { data: rowToAccountSnapshotRecord(data), error: null }
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
  }
}
