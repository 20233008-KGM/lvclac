import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('slot-driven snapshot migration', () => {
  it('turns off legacy slot selections that had no active shared schedule', () => {
    const sql = readFileSync(
      resolve('supabase/migrations/20260813000000_snapshot_slot_activation.sql'),
      'utf8',
    )

    expect(sql).toContain('set auto_snapshot_enabled = false')
    expect(sql).toContain('not exists')
    expect(sql).toContain('setting.enabled = false')
    expect(sql).toContain('setting.user_id = number_set.user_id')
  })
})
