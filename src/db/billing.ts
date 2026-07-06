import { supabase } from './supabaseClient'

/** 구독 플랜(Stripe Price와 매핑). */
export type BillingPlan = 'monthly' | 'yearly'

export interface SubscriptionRecord {
  status: string
  currentPeriodEnd: string | null
}

type BillingResult<T> = { data: T; error: null } | { data: null; error: string }

/** active/trialing이면 Pro로 간주한다(isPro). */
export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

interface SubscriptionRow {
  status: string
  current_period_end: string | null
}

/** 로그인 사용자의 구독 상태를 읽는다(RLS로 본인 행만 조회됨). */
export async function fetchSubscription(
  userId: string,
): Promise<BillingResult<SubscriptionRecord | null>> {
  if (!supabase) return { data: null, error: 'supabase_not_configured' }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status,current_period_end')
    .eq('user_id', userId)
    .maybeSingle<SubscriptionRow>()

  if (error) return { data: null, error: error.message }
  return {
    data: data ? { status: data.status, currentPeriodEnd: data.current_period_end } : null,
    error: null,
  }
}

/** 현재 세션의 access token을 Authorization 헤더로 만든다. */
async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 결제 API 호출 → 반환된 Stripe URL로 리다이렉트. 성공 시 null, 실패 시 에러 코드. */
async function redirectToStripe(
  path: string,
  body?: Record<string, unknown>,
): Promise<string | null> {
  if (!supabase) return 'not_configured'
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body ?? {}),
    })
  } catch {
    return 'network_error'
  }
  const json = (await res.json().catch(() => null)) as { url?: string; error?: string } | null
  if (!res.ok || !json?.url) return json?.error || 'request_failed'
  window.location.href = json.url
  return null
}

/** 구독 Checkout으로 이동. 성공 시 브라우저가 Stripe로 리다이렉트된다. */
export function startCheckout(plan: BillingPlan): Promise<string | null> {
  return redirectToStripe('/api/stripe/checkout', { plan })
}

/** 구독 관리(Customer Portal)로 이동. */
export function openBillingPortal(): Promise<string | null> {
  return redirectToStripe('/api/stripe/portal')
}
