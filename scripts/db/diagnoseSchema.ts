/**
 * One-off schema/REST diagnostic. Reads keys from .env (not committed).
 * Usage: npx tsx scripts/db/diagnoseSchema.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv(): Record<string, string> {
  const envPath = resolve(process.cwd(), '.env')
  const text = readFileSync(envPath, 'utf8')
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

async function restGet(
  baseUrl: string,
  key: string,
  path: string,
): Promise<{ status: number; body: string }> {
  const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })
  return { status: res.status, body: await res.text() }
}

async function sqlQuery(
  baseUrl: string,
  serviceKey: string,
  query: string,
): Promise<{ status: number; body: string }> {
  const res = await fetch(`${baseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  void res
  // Use pg meta via direct SQL isn't available on REST; use table probes instead.
  return { status: 0, body: query }
}

async function main() {
  const env = loadEnv()
  const baseUrl = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL
  const anonKey = env.VITE_SUPABASE_ANON_KEY
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!baseUrl || !anonKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
    process.exit(1)
  }

  const probes = [
    ['order_history (id only)', 'order_history?select=id&limit=1'],
    [
      'account_snapshots (with source cols)',
      'account_snapshots?select=id,title,inputs,result,source,source_local_date,created_at&limit=1',
    ],
    [
      'profiles (auto_save_order_history)',
      'profiles?select=nickname,auto_save_order_history&limit=1',
    ],
    [
      'account_snapshot_settings',
      'account_snapshot_settings?select=user_id,enabled&limit=1',
    ],
  ] as const

  console.log('=== Anon REST probes ===')
  for (const [label, path] of probes) {
    const { status, body } = await restGet(baseUrl, anonKey, path)
    console.log(`\n[${label}] HTTP ${status}`)
    console.log(body.slice(0, 500))
  }

  if (serviceKey) {
    console.log('\n=== Service role: insert probe (account_snapshots) ===')
    const testUserId = '00000000-0000-4000-8000-000000000001'
    const insertRes = await fetch(`${baseUrl}/rest/v1/account_snapshots`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: testUserId,
        title: 'schema-probe',
        inputs: {},
        result: {},
        source: 'manual',
        source_local_date: null,
      }),
    })
    console.log(`HTTP ${insertRes.status}`)
    console.log((await insertRes.text()).slice(0, 500))
  }

  void sqlQuery
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
