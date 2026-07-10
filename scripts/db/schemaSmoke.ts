/**
 * Remote Supabase schema drift check + account-records smoke test.
 *
 * Usage:
 *   npx tsx scripts/db/schemaSmoke.ts
 *   npx tsx scripts/db/schemaSmoke.ts --crud
 *
 * Requires .env:
 *   VITE_SUPABASE_URL (or SUPABASE_URL)
 *   VITE_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY (for --crud)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
} from '../../src/db/accountRecordPayloads'
import { defaultInputs } from '../../src/types'
import type { EvaluateResult, OrderResult } from '../../src/types'

function loadEnv(): Record<string, string> {
  const text = readFileSync(resolve(process.cwd(), '.env'), 'utf8')
  const out: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1)
  }
  return out
}

async function restProbe(
  baseUrl: string,
  anonKey: string,
  label: string,
  path: string,
): Promise<{ ok: boolean; detail: string }> {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })
  const body = await res.text()
  const ok = res.status >= 200 && res.status < 300
  return { ok, detail: `[${label}] HTTP ${res.status} ${body.slice(0, 240)}` }
}

const evaluateFixture: EvaluateResult = {
  positionSide: 'long',
  liquidationPrice: 90,
  liquidationMessage: null,
  toleranceRate: 0.1,
  toleranceDelta: 10,
  leverageRatio: 2,
  margins: { maintenanceMargin: 100, availableMargin: 200 },
  maxBuyable: null,
  maxBuyableMessage: null,
  isAtRisk: false,
}

const orderFixture: OrderResult = {
  positionSide: 'long',
  beforeContractAmount: 1,
  afterContractAmount: 2,
  beforeLiquidation: 90,
  afterLiquidation: 88,
  beforeTolerance: 0.1,
  afterTolerance: 0.12,
  beforeToleranceDelta: 10,
  afterToleranceDelta: 12,
  beforeLeverageRatio: 2,
  afterLeverageRatio: 2.1,
  beforeMargins: { maintenanceMargin: 100, availableMargin: 200 },
  afterMargins: { maintenanceMargin: 110, availableMargin: 190 },
  liquidationDelta: -2,
  isAtRiskBefore: false,
  isAtRiskAfter: false,
  orderMessage: null,
  orderCapacityMessage: null,
}

async function runCrudSmoke(
  baseUrl: string,
  serviceRoleKey: string,
  anonKey: string,
): Promise<void> {
  const admin = createClient(baseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const email = `schema-smoke-${Date.now()}@lvclac.local`
  const password = `Smoke_${Date.now()}_Aa1`

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) {
    throw new Error(`createUser failed: ${createError?.message ?? 'no user'}`)
  }

  const userId = created.user.id

  try {
    const { data: sessionData, error: signInError } = await admin.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError || !sessionData.session) {
      throw new Error(`signIn failed: ${signInError?.message ?? 'no session'}`)
    }

    const userClient = createClient(baseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    await userClient.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    })

    const orderPayload = buildOrderHistoryPayload(defaultInputs, defaultInputs, orderFixture)
    const { error: orderError } = await userClient.from('order_history').insert({
      user_id: userId,
      position_side: orderPayload.positionSide,
      order_contracts: orderPayload.orderContracts,
      order_price: orderPayload.orderPrice,
      before_inputs: orderPayload.beforeInputs,
      after_inputs: orderPayload.afterInputs,
      before_result: orderPayload.beforeResult,
      after_result: orderPayload.afterResult,
    })
    if (orderError) throw new Error(`createOrderHistory: ${orderError.message}`)

    const snapshotPayload = buildAccountSnapshotPayload(
      defaultInputs,
      evaluateFixture,
      'schema-smoke',
    )
    const { error: snapshotError } = await userClient.from('account_snapshots').insert({
      user_id: userId,
      title: snapshotPayload.title,
      inputs: snapshotPayload.inputs,
      result: snapshotPayload.result,
      source: snapshotPayload.source,
      source_local_date: snapshotPayload.sourceLocalDate,
    })
    if (snapshotError) throw new Error(`createAccountSnapshot: ${snapshotError.message}`)

    const { data: orders, error: ordersFetchError } = await userClient
      .from('order_history')
      .select('id')
      .eq('user_id', userId)
    if (ordersFetchError) throw new Error(`fetch orders: ${ordersFetchError.message}`)
    if (!orders?.length) throw new Error('fetchRecentRecords: no orders')

    const { data: snapshots, error: snapshotsFetchError } = await userClient
      .from('account_snapshots')
      .select('id,source,source_local_date')
      .eq('user_id', userId)
    if (snapshotsFetchError) throw new Error(`fetch snapshots: ${snapshotsFetchError.message}`)
    if (!snapshots?.length) throw new Error('fetchRecentRecords: no snapshots')

    console.log('CRUD smoke: OK')
  } finally {
    await admin.auth.admin.deleteUser(userId)
  }
}

async function main() {
  const env = loadEnv()
  const baseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const runCrud = process.argv.includes('--crud')

  if (!baseUrl || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const probes = [
    ['order_history', 'order_history?select=id&limit=1'],
    [
      'account_snapshots+source',
      'account_snapshots?select=id,title,inputs,result,source,source_local_date,created_at&limit=1',
    ],
    ['profiles.auto_save_order_history', 'profiles?select=nickname,auto_save_order_history&limit=1'],
    ['account_snapshot_settings', 'account_snapshot_settings?select=user_id,enabled&limit=1'],
  ] as const

  let failed = 0
  console.log('=== Schema probes ===')
  for (const [label, path] of probes) {
    const result = await restProbe(baseUrl, anonKey, label, path)
    console.log(result.detail)
    if (!result.ok) failed += 1
  }

  if (failed > 0) {
    console.error(`\n${failed} probe(s) failed`)
    process.exit(1)
  }

  if (runCrud) {
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY required for --crud')
      process.exit(1)
    }
    console.log('\n=== CRUD smoke ===')
    await runCrudSmoke(baseUrl, serviceRoleKey, anonKey)
  }

  console.log('\nSchema smoke passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
