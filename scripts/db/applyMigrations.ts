/**
 * Apply pending SQL migrations via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN in environment (Personal Access Token).
 *
 * Usage: npx tsx scripts/db/applyMigrations.ts [migration-file...]
 * Default: 007 + 008 account snapshot automation
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_REF = 'yszjblzmzipshwtylqxa'

function loadEnvFile(): Record<string, string> {
  try {
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
  } catch {
    return {}
  }
}

async function runSql(query: string, accessToken: string): Promise<void> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const body = await res.text()
  if (!res.ok) {
    throw new Error(`SQL failed HTTP ${res.status}: ${body}`)
  }
  const parsed = JSON.parse(body) as unknown
  if (Array.isArray(parsed) && parsed.length > 0 && 'error' in (parsed[0] as object)) {
    throw new Error(`SQL error: ${body}`)
  }
  console.log('OK:', body.slice(0, 200))
}

async function main() {
  const envFile = loadEnvFile()
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN ?? envFile.SUPABASE_ACCESS_TOKEN
  if (!accessToken) {
    console.error(
      'SUPABASE_ACCESS_TOKEN is required. Create one at https://supabase.com/dashboard/account/tokens',
    )
    process.exit(1)
  }

  const defaultFiles = [
    'supabase/migrations/007_order_history_autosave.sql',
    'supabase/migrations/20260708120000_account_snapshot_automation.sql',
  ]

  const files = process.argv.slice(2).length > 0 ? process.argv.slice(2) : defaultFiles

  for (const file of files) {
    const path = resolve(process.cwd(), file)
    const sql = readFileSync(path, 'utf8')
    console.log(`\nApplying ${file}...`)
    await runSql(sql, accessToken)
  }

  console.log('\nAll migrations applied.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
