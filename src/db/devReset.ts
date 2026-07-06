import { supabase } from './supabaseClient'
import { markForcedConsent } from './devFirstLogin'

/**
 * 개발 전용 계정 초기화 클라이언트.
 * Vite dev 미들웨어(`/__dev/reset-account`)를 호출한다. 프로덕션에는 엔드포인트가 없다.
 */
export type DevResetMode = 'data' | 'full'

const DEV_RESET_ENDPOINT = '/__dev/reset-account'

/** 완전 삭제 후 비우는 앱 소유 localStorage 키. */
const APP_LOCAL_STORAGE_KEYS = [
  'leverage_calculator_draft',
  'leverage_save_enabled',
  'leverage_save_storage_mode',
  'leverage_users',
  'leverage_prefs',
  'leverage_session',
  'calc-grid-layout-v3',
]

/**
 * 현재 로그인한 계정을 초기화한다. 성공 시 null, 실패 시 에러 코드 문자열.
 * - 'data': 앱 데이터 테이블만 비움(로그인 유지).
 * - 'full': auth.users까지 삭제 → 로그아웃 + 로컬 스토리지 정리(재가입 테스트용).
 */
export async function resetTestAccount(mode: DevResetMode): Promise<string | null> {
  if (!supabase) return 'not_configured'

  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) return 'not_logged_in'

  let res: Response
  try {
    res = await fetch(DEV_RESET_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accessToken, mode }),
    })
  } catch {
    return 'network_error'
  }

  const payload = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string }
    | null
  if (!res.ok || !payload?.ok) {
    return payload?.error || 'reset_failed'
  }

  if (mode === 'full') {
    await supabase.auth.signOut().catch(() => {})
    for (const key of APP_LOCAL_STORAGE_KEYS) {
      try {
        localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }
    // 스토리지 정리 이후에 표시 → 다음 구글 로그인에서 첫 로그인 화면 재현
    markForcedConsent()
  }

  return null
}
