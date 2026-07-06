import { describe, it, expect } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  handleDevReset,
  DEV_RESET_DATA_TABLES,
  type DevResetConfig,
} from './devResetHandler'

const CONFIG: DevResetConfig = { url: 'https://x.supabase.co', serviceRoleKey: 'svc' }

interface FakeState {
  deletedUser?: string
  deletedTables: string[]
}

/** getUser 결과와 테이블 delete 성공 여부를 제어하는 가짜 admin 클라이언트. */
function makeAdmin(
  opts: {
    user?: { id: string } | null
    getUserError?: boolean
    deleteUserError?: string
    tableError?: { table: string; message: string }
  },
  state: FakeState,
): SupabaseClient {
  const user = opts.user === undefined ? { id: 'user-1' } : opts.user
  return {
    auth: {
      getUser: async () => ({
        data: { user: opts.getUserError ? null : user },
        error: opts.getUserError ? { message: 'bad token' } : null,
      }),
      admin: {
        deleteUser: async (id: string) => {
          if (opts.deleteUserError) return { data: null, error: { message: opts.deleteUserError } }
          state.deletedUser = id
          return { data: null, error: null }
        },
      },
    },
    from: (table: string) => ({
      delete: () => ({
        eq: async () => {
          if (opts.tableError?.table === table) {
            return { error: { message: opts.tableError.message } }
          }
          state.deletedTables.push(table)
          return { error: null }
        },
      }),
    }),
  } as unknown as SupabaseClient
}

function factory(admin: SupabaseClient) {
  return () => admin
}

describe('handleDevReset', () => {
  it('config가 없으면 500', async () => {
    const res = await handleDevReset(null, { accessToken: 't', mode: 'data' })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('service_role_not_configured')
  })

  it('accessToken이 없으면 401', async () => {
    const res = await handleDevReset(CONFIG, { mode: 'data' })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('missing_access_token')
  })

  it('mode가 유효하지 않으면 400', async () => {
    const res = await handleDevReset(CONFIG, { accessToken: 't', mode: 'nope' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_mode')
  })

  it('토큰이 유효하지 않으면 401', async () => {
    const state: FakeState = { deletedTables: [] }
    const admin = makeAdmin({ getUserError: true }, state)
    const res = await handleDevReset(
      CONFIG,
      { accessToken: 't', mode: 'full' },
      factory(admin),
    )
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('invalid_access_token')
  })

  it("mode 'full'은 auth.users를 삭제한다", async () => {
    const state: FakeState = { deletedTables: [] }
    const admin = makeAdmin({ user: { id: 'user-9' } }, state)
    const res = await handleDevReset(
      CONFIG,
      { accessToken: 't', mode: 'full' },
      factory(admin),
    )
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, mode: 'full', userId: 'user-9' })
    expect(state.deletedUser).toBe('user-9')
    expect(state.deletedTables).toEqual([])
  })

  it("mode 'data'는 데이터 테이블만 비우고 auth.users는 유지한다", async () => {
    const state: FakeState = { deletedTables: [] }
    const admin = makeAdmin({ user: { id: 'user-9' } }, state)
    const res = await handleDevReset(
      CONFIG,
      { accessToken: 't', mode: 'data' },
      factory(admin),
    )
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ ok: true, mode: 'data', userId: 'user-9' })
    expect(state.deletedUser).toBeUndefined()
    expect(state.deletedTables).toEqual([...DEV_RESET_DATA_TABLES])
  })

  it("mode 'data' 중 테이블 삭제 실패 시 500", async () => {
    const state: FakeState = { deletedTables: [] }
    const admin = makeAdmin(
      { user: { id: 'u' }, tableError: { table: 'number_sets', message: 'boom' } },
      state,
    )
    const res = await handleDevReset(
      CONFIG,
      { accessToken: 't', mode: 'data' },
      factory(admin),
    )
    expect(res.status).toBe(500)
    expect(res.body.error).toContain('number_sets')
  })
})
