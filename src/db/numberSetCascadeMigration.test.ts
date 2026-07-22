import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260722000000_number_set_cascade_delete.sql'),
  'utf8',
)

describe('number-set cascade-delete migration', () => {
  it('replaces both record foreign keys with ON DELETE CASCADE', () => {
    expect(migration).toContain('account_snapshots_number_set_id_fkey')
    expect(migration).toContain('order_history_number_set_id_fkey')
    expect(migration.match(/on delete cascade/g)).toHaveLength(2)
  })

  it('only changes records linked through number_set_id', () => {
    expect(migration.match(/foreign key \(number_set_id\)/g)).toHaveLength(2)
    expect(migration).not.toContain('on delete set null')
  })

  it('provides an owner-scoped deletion summary with exact non-empty memo counts', () => {
    expect(migration).toContain('get_number_set_deletion_summary')
    expect(migration).toContain('ns.id = p_number_set_id')
    expect(migration).toContain('ns.user_id = p_user_id')
    expect(migration).toContain('p_user_id = auth.uid()')
    expect(migration.match(/nullif\(btrim\([^)]*memo\), ''\) is not null/g)).toHaveLength(2)
    expect(migration).toContain('security invoker')
  })
})
