/**
 * 개발 전용 "테스트 계정 초기화" 서버 핸들러.
 *
 * Vite dev 미들웨어(`vite.config.ts`)에서만 호출된다. service_role 키를 쓰므로
 * 절대 클라이언트 번들/프로덕션에 포함되면 안 된다(이 파일은 vite.config에서만 import).
 *
 * 프레임워크 비의존 순수 함수로 두어 단위 테스트가 가능하도록 admin 클라이언트
 * 팩토리를 주입받는다.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type DevResetMode = 'data' | 'full'

export interface DevResetConfig {
  url: string
  serviceRoleKey: string
}

export interface DevResetRequest {
  accessToken?: unknown
  mode?: unknown
}

export interface DevResetResult {
  status: number
  body: {
    ok: boolean
    mode?: DevResetMode
    userId?: string
    error?: string
  }
}

/** mode: 'data' 에서 비우는 테이블. 순서 무관(각각 user_id로 delete). */
export const DEV_RESET_DATA_TABLES = [
  'order_history',
  'account_snapshots',
  'number_sets',
  'subscriptions',
] as const

export type AdminClientFactory = (url: string, serviceRoleKey: string) => SupabaseClient

const defaultCreateAdmin: AdminClientFactory = (url, serviceRoleKey) =>
  createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

/**
 * 요청을 검증하고 계정 데이터를 초기화한다.
 * - config 없음 → 500(service_role 미설정)
 * - accessToken 없음/유효하지 않음 → 401
 * - mode 이상 → 400
 * - mode 'full' → auth.users 삭제(cascade로 전 테이블 정리)
 * - mode 'data' → 앱 데이터 테이블만 삭제(로그인 유지)
 *
 * accessToken으로 본인을 확인한 뒤 그 user만 대상으로 삭제하므로, 임의 계정은 건드릴 수 없다.
 */
export async function handleDevReset(
  config: DevResetConfig | null,
  request: DevResetRequest,
  createAdmin: AdminClientFactory = defaultCreateAdmin,
): Promise<DevResetResult> {
  if (!config?.url || !config?.serviceRoleKey) {
    return { status: 500, body: { ok: false, error: 'service_role_not_configured' } }
  }

  const accessToken = typeof request.accessToken === 'string' ? request.accessToken : ''
  const mode = request.mode
  if (!accessToken) {
    return { status: 401, body: { ok: false, error: 'missing_access_token' } }
  }
  if (mode !== 'data' && mode !== 'full') {
    return { status: 400, body: { ok: false, error: 'invalid_mode' } }
  }

  const admin = createAdmin(config.url, config.serviceRoleKey)

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken)
  const user = userData?.user
  if (userError || !user) {
    return { status: 401, body: { ok: false, error: 'invalid_access_token' } }
  }

  if (mode === 'full') {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      return { status: 500, body: { ok: false, error: error.message } }
    }
    return { status: 200, body: { ok: true, mode, userId: user.id } }
  }

  for (const table of DEV_RESET_DATA_TABLES) {
    const { error } = await admin.from(table).delete().eq('user_id', user.id)
    if (error) {
      return { status: 500, body: { ok: false, error: `${table}: ${error.message}` } }
    }
  }
  return { status: 200, body: { ok: true, mode, userId: user.id } }
}
