import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../db/supabaseClient'
import { ensureProfile, saveNickname, type AuthUser } from '../db/profile'

/**
 * 인증 메서드는 성공 시 null, 실패/안내 시 코드 문자열을 반환합니다.
 * 코드는 UI(LoginForm/RegisterForm)에서 i18n 메시지로 매핑됩니다.
 */
interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** Supabase 환경변수가 설정돼 인증을 쓸 수 있는지 */
  configured: boolean
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  signUpWithPassword: (
    email: string,
    password: string,
    nickname: string,
  ) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
  updateNickname: (nickname: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function fallbackNickname(supaUser: SupabaseUser): string {
  const meta = supaUser.user_metadata ?? {}
  return (
    (meta.nickname as string | undefined) ||
    (meta.full_name as string | undefined) ||
    (meta.name as string | undefined) ||
    supaUser.email?.split('@')[0] ||
    '사용자'
  )
}

async function buildUser(supaUser: SupabaseUser): Promise<AuthUser> {
  const email = supaUser.email ?? ''
  const nickname = await ensureProfile(supaUser.id, email, fallbackNickname(supaUser))
  return { id: supaUser.id, email, nickname }
}

/** Supabase 에러 메시지를 UI 코드로 매핑. */
function mapAuthError(message: string | undefined): string {
  const msg = (message ?? '').toLowerCase()
  if (msg.includes('invalid login credentials')) return 'invalid_credentials'
  if (msg.includes('email not confirmed')) return 'email_not_confirmed'
  if (msg.includes('already registered') || msg.includes('already been registered'))
    return 'email_taken'
  if (msg.includes('signup') && msg.includes('disabled')) return 'signup_disabled'
  if (msg.includes('provider') && msg.includes('not enabled')) return 'provider_not_enabled'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'rate_limited'
  return message || 'unknown_error'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  // 동시에 도착하는 auth 이벤트가 오래된 사용자로 덮어쓰지 않도록 최신 세션만 반영
  const latestUserId = useRef<string | null>(null)

  useEffect(() => {
    // 미설정 시 loading 초기값이 이미 false (isSupabaseConfigured) 이므로 추가 작업 없음
    if (!supabase) return
    let active = true

    async function syncFromSession(session: Session | null) {
      const supaUser = session?.user ?? null
      latestUserId.current = supaUser?.id ?? null
      if (!supaUser) {
        if (active) setUser(null)
        return
      }
      const built = await buildUser(supaUser)
      // 그 사이 더 최신 이벤트가 들어왔으면 무시
      if (active && latestUserId.current === supaUser.id) setUser(built)
    }

    supabase.auth
      .getSession()
      .then(({ data }) => syncFromSession(data.session))
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncFromSession(session)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return 'not_configured'
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return error ? mapAuthError(error.message) : null
  }, [])

  const signUpWithPassword = useCallback(
    async (email: string, password: string, nickname: string) => {
      if (!supabase) return 'not_configured'
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nickname: nickname.trim() },
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) return mapAuthError(error.message)
      // 이메일 확인이 켜져 있으면 세션 없이 user만 반환됨 → 확인 안내
      if (data.user && !data.session) return 'confirm_email'
      return null
    },
    [],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return 'not_configured'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error ? mapAuthError(error.message) : null
    // 성공 시 브라우저가 구글로 리다이렉트되므로 이후 코드는 실행되지 않음
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const updateNickname = useCallback(
    async (nickname: string) => {
      if (!supabase || !user) return 'not_configured'
      const trimmed = nickname.trim()
      await saveNickname(user.id, trimmed, user.email)
      await supabase.auth.updateUser({ data: { nickname: trimmed } })
      setUser((prev) => (prev ? { ...prev, nickname: trimmed } : prev))
      return null
    },
    [user],
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        configured: isSupabaseConfigured,
        signInWithPassword,
        signUpWithPassword,
        signInWithGoogle,
        signOut,
        updateNickname,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
