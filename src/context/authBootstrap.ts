import type { AuthChangeEvent } from '@supabase/supabase-js'

interface AuthHydrationState {
  event: AuthChangeEvent
  sessionUserId: string | null
  hydratedUserId: string | null
  hydratingUserId: string | null
}

/**
 * Supabase는 초기 세션 외에도 탭 포커스·토큰 갱신 때 인증 이벤트를 반복할 수 있다.
 * 같은 계정의 확장 프로필을 이미 읽었거나 읽는 중이면 DB bootstrap을 다시 시작하지 않는다.
 */
export function shouldHydrateAuthSession({
  event,
  sessionUserId,
  hydratedUserId,
  hydratingUserId,
}: AuthHydrationState): boolean {
  if (!sessionUserId) return true
  if (hydratingUserId === sessionUserId) return false
  if (event === 'TOKEN_REFRESHED') return false
  if (event === 'USER_UPDATED') return true
  return hydratedUserId !== sessionUserId
}
