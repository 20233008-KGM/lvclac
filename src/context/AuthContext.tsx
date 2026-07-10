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
import {
  ensureProfile,
  fetchIsAdmin,
  saveAutoSaveOrderHistory,
  saveNickname,
  type AuthUser,
} from '../db/profile'
import { consumeForcedConsent } from '../db/devFirstLogin'
import {
  fetchSubscription,
  isActiveSubscription,
  type SubscriptionRecord,
} from '../db/billing'

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
  /** 주문 적용 시 order_history 자동 저장 여부를 갱신 */
  setAutoSaveOrderHistory: (enabled: boolean) => Promise<string | null>
  /** 현재 계정에 연결된 로그인 수단(provider) 목록. 예: ['email', 'google'] */
  linkedProviders: string[]
  /** 로그인 상태에서 Google identity를 현재 계정에 연동. 성공 시 Google로 리다이렉트됨. */
  linkGoogle: () => Promise<string | null>
  /** 현재 계정에서 Google 연동을 해제. 마지막 로그인 수단이면 'last_identity' 반환. */
  unlinkGoogle: () => Promise<string | null>
  /** OAuth-only 등 이메일 identity가 없는 로그인 계정에 비밀번호를 설정해 이메일 로그인을 추가. */
  setPasswordForCurrentUser: (password: string) => Promise<string | null>
  /** 현재 구독 상태. 미구독/비로그인이면 null. */
  subscription: SubscriptionRecord | null
  /** 유료(Pro) 여부. active/trialing 구독이면 true. */
  isPro: boolean
  /** 결제 성공 후 등 구독 상태를 다시 읽어온다. */
  refreshSubscription: () => Promise<void>
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
  const { nickname, autoSaveOrderHistory } = await ensureProfile(
    supaUser.id,
    email,
    fallbackNickname(supaUser),
  )
  const isAdmin = await fetchIsAdmin(supaUser.id)
  return { id: supaUser.id, email, nickname, autoSaveOrderHistory, isAdmin }
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
  if (msg.includes('manual linking is disabled')) return 'manual_linking_disabled'
  if (msg.includes('identity is already linked') || msg.includes('already linked'))
    return 'identity_already_linked'
  if (msg.includes('at least 1 identity') || msg.includes('single identity'))
    return 'last_identity'
  if (msg.includes('password') && (msg.includes('weak') || msg.includes('common')))
    return 'password_too_common'
  if (msg.includes('password') && msg.includes('at least')) return 'password_too_short'
  return message || 'unknown_error'
}

/** 세션 user의 identities·app_metadata에서 연결된 provider 목록을 추출. */
function providersOf(supaUser: SupabaseUser): string[] {
  const fromIdentities = (supaUser.identities ?? []).map((identity) => identity.provider)
  const appProviders = supaUser.app_metadata?.providers
  if (!Array.isArray(appProviders)) return fromIdentities

  const merged = new Set(fromIdentities)
  for (const provider of appProviders) {
    if (typeof provider === 'string') merged.add(provider)
  }
  return [...merged]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [linkedProviders, setLinkedProviders] = useState<string[]>([])
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null)
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
        if (active) {
          setUser(null)
          setLinkedProviders([])
          setSubscription(null)
        }
        return
      }
      const providers = providersOf(supaUser)
      const built = await buildUser(supaUser)
      // 그 사이 더 최신 이벤트가 들어왔으면 무시
      if (active && latestUserId.current === supaUser.id) {
        setUser(built)
        setLinkedProviders(providers)
      }
      const subResult = await fetchSubscription(supaUser.id)
      if (active && latestUserId.current === supaUser.id) {
        setSubscription(subResult.data)
      }
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
      // Supabase는 이메일 열거 공격 방지를 위해 이미 가입된 이메일도 200 + 에러 없이 반환한다.
      // 이 경우 반환된 user의 identities가 빈 배열이라는 점으로만 기존 계정 여부를 구분할 수 있다.
      if (data.user && data.user.identities?.length === 0) return 'email_taken'
      // 이메일 확인이 켜져 있으면 세션 없이 user만 반환됨 → 확인 안내
      if (data.user && !data.session) return 'confirm_email'
      return null
    },
    [],
  )

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return 'not_configured'
    // [개발] 테스트 계정 완전 삭제 직후 1회, 구글 동의/계정선택 화면을 강제로 다시 띄워
    // 첫 로그인 경험을 재현한다. 프로덕션 빌드에서는 DEV가 false라 이 분기가 제거된다.
    const forceFirstLogin = import.meta.env.DEV && consumeForcedConsent()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        ...(forceFirstLogin
          ? { queryParams: { prompt: 'consent select_account' } }
          : {}),
      },
    })
    return error ? mapAuthError(error.message) : null
    // 성공 시 브라우저가 구글로 리다이렉트되므로 이후 코드는 실행되지 않음
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setLinkedProviders([])
    setSubscription(null)
  }, [])

  const refreshSubscription = useCallback(async () => {
    const userId = latestUserId.current
    if (!supabase || !userId) return
    const result = await fetchSubscription(userId)
    if (latestUserId.current === userId) setSubscription(result.data)
  }, [])

  const linkGoogle = useCallback(async () => {
    if (!supabase) return 'not_configured'
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    return error ? mapAuthError(error.message) : null
    // 성공 시 브라우저가 구글로 리다이렉트되므로 이후 코드는 실행되지 않음
  }, [])

  const unlinkGoogle = useCallback(async () => {
    if (!supabase) return 'not_configured'
    const { data, error } = await supabase.auth.getUserIdentities()
    if (error) return mapAuthError(error.message)
    const identities = data?.identities ?? []
    const google = identities.find((identity) => identity.provider === 'google')
    // 이미 연동이 없으면 성공으로 간주(멱등)
    if (!google) {
      setLinkedProviders((prev) => prev.filter((provider) => provider !== 'google'))
      return null
    }
    // 마지막 로그인 수단은 해제 불가
    if (identities.length <= 1) return 'last_identity'
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(google)
    if (unlinkError) return mapAuthError(unlinkError.message)
    setLinkedProviders((prev) => prev.filter((provider) => provider !== 'google'))
    return null
  }, [])

  const setPasswordForCurrentUser = useCallback(
    async (password: string) => {
      if (!supabase || !user) return 'not_configured'
      if (!user.email.trim()) return 'email_required'

      const { error } = await supabase.auth.updateUser({ password })
      if (error) return mapAuthError(error.message)

      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) return mapAuthError(refreshError.message)

      const { data: userData, error: getUserError } = await supabase.auth.getUser()
      if (getUserError) return mapAuthError(getUserError.message)
      if (userData.user && latestUserId.current === userData.user.id) {
        setLinkedProviders(providersOf(userData.user))
      }
      return null
    },
    [user],
  )

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

  const setAutoSaveOrderHistory = useCallback(
    async (enabled: boolean) => {
      if (!supabase || !user) return 'not_configured'
      const error = await saveAutoSaveOrderHistory(user.id, enabled)
      if (error) return error === 'supabase_not_configured' ? 'not_configured' : 'profile_update_failed'
      setUser((prev) => (prev ? { ...prev, autoSaveOrderHistory: enabled } : prev))
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
        setAutoSaveOrderHistory,
        linkedProviders,
        linkGoogle,
        unlinkGoogle,
        setPasswordForCurrentUser,
        subscription,
        isPro: isActiveSubscription(subscription?.status),
        refreshSubscription,
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
