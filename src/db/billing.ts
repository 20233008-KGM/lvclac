import { supabase } from './supabaseClient'

export type BillingPlan = 'monthly' | 'yearly'

export interface SubscriptionRecord {
  status: string
  currentPeriodEnd: string | null
}

type BillingResult<T> = { data: T; error: null } | { data: null; error: string }

export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

interface SubscriptionRow {
  status: string
  current_period_end: string | null
}

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

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {}
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface CheckoutPayload {
  priceId?: string
  transactionId?: string
  customData?: Record<string, unknown>
  customerEmail?: string | null
  successUrl?: string
}

interface PortalPayload {
  url?: string
}

type PaddleEnvironment = 'sandbox' | 'live'

interface PaddleCheckoutOptions {
  settings: {
    displayMode: 'overlay'
    successUrl: string
  }
  items?: Array<{ priceId: string; quantity: number }>
  transactionId?: string
  customData?: Record<string, unknown>
  customer?: { email: string }
}

interface PaddleGlobal {
  Environment?: { set(environment: PaddleEnvironment): void }
  Initialize(options: { token: string }): void
  Checkout: { open(options: PaddleCheckoutOptions): void }
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal
  }
}

const PADDLE_JS_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js'
let paddleLoadPromise: Promise<PaddleGlobal> | null = null
let initializedPaddleKey: string | null = null

function paddleClientConfig(): { token: string; environment: PaddleEnvironment } | null {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
  const environment = import.meta.env.VITE_PADDLE_ENV
  if (typeof token !== 'string' || !token) return null
  if (environment !== 'sandbox' && environment !== 'live') return null
  return { token, environment }
}

function loadPaddle(): Promise<PaddleGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window_unavailable'))
  if (window.Paddle) return Promise.resolve(window.Paddle)
  if (paddleLoadPromise) return paddleLoadPromise

  paddleLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PADDLE_JS_URL}"]`,
    )
    const script = existing ?? document.createElement('script')
    script.src = PADDLE_JS_URL
    script.async = true
    script.onload = () => {
      if (window.Paddle) resolve(window.Paddle)
      else reject(new Error('paddle_unavailable'))
    }
    script.onerror = () => reject(new Error('paddle_load_failed'))
    if (!existing) document.head.appendChild(script)
  })

  return paddleLoadPromise
}

async function initializedPaddle(): Promise<{ paddle: PaddleGlobal } | { error: string }> {
  const config = paddleClientConfig()
  if (!config) return { error: 'not_configured' }

  let paddle: PaddleGlobal
  try {
    paddle = await loadPaddle()
  } catch {
    return { error: 'network_error' }
  }

  const key = `${config.environment}:${config.token}`
  if (initializedPaddleKey !== key) {
    if (config.environment === 'sandbox') paddle.Environment?.set('sandbox')
    paddle.Initialize({ token: config.token })
    initializedPaddleKey = key
  }

  return { paddle }
}

async function postBilling<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<BillingResult<T>> {
  if (!supabase) return { data: null, error: 'not_configured' }
  let res: Response
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify(body ?? {}),
    })
  } catch {
    return { data: null, error: 'network_error' }
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: string }) | null
  if (!res.ok || !json) return { data: null, error: json?.error || 'request_failed' }
  return { data: json, error: null }
}

export function startCheckout(plan: BillingPlan): Promise<string | null> {
  return (async () => {
    const result = await postBilling<CheckoutPayload>('/api/billing/checkout', { plan })
    if (result.error !== null) return result.error

    const { priceId, transactionId, customData, customerEmail, successUrl } = result.data
    if (!successUrl) return 'checkout_payload_invalid'
    if (!priceId && !transactionId) return 'checkout_payload_invalid'

    const paddleReady = await initializedPaddle()
    if ('error' in paddleReady) return paddleReady.error
    const paddle = paddleReady.paddle

    const checkout: PaddleCheckoutOptions = {
      settings: { displayMode: 'overlay', successUrl },
      customData,
      ...(transactionId
        ? { transactionId }
        : { items: [{ priceId: priceId as string, quantity: 1 }] }),
      ...(customerEmail ? { customer: { email: customerEmail } } : {}),
    }
    paddle.Checkout.open(checkout)
    return null
  })()
}

export function openBillingPortal(): Promise<string | null> {
  return (async () => {
    const result = await postBilling<PortalPayload>('/api/billing/portal')
    if (result.error !== null) return result.error
    if (!result.data.url) return 'request_failed'
    window.location.href = result.data.url
    return null
  })()
}
