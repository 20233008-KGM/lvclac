import { supabase } from './supabaseClient'

export type BillingPlan = 'monthly' | 'yearly'

export interface SubscriptionRecord {
  status: string
  provider?: string | null
  currentPeriodEnd: string | null
  scheduledChangeAction: string | null
  scheduledChangeEffectiveAt: string | null
}

type BillingResult<T> = { data: T; error: null } | { data: null; error: string }

export function isActiveSubscription(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing'
}

interface SubscriptionRow {
  status: string
  provider: string | null
  current_period_end: string | null
  scheduled_change_action: string | null
  scheduled_change_effective_at: string | null
}

function clientPaddleEnvironment(): PaddleEnvironment | null {
  const environment = import.meta.env.VITE_PADDLE_ENV
  return environment === 'sandbox' || environment === 'live' ? environment : null
}

export function clientSubscriptionProviders(environment: PaddleEnvironment | null): string[] {
  // Manual grants do not depend on a configured Paddle checkout environment.
  // Without one, exclude every Paddle provider rather than guessing Live or Sandbox.
  if (!environment) return ['manual']
  return environment === 'live'
    ? ['paddle_live', 'manual']
    : ['paddle_sandbox', 'paddle', 'manual']
}

export async function fetchSubscription(
  userId: string,
): Promise<BillingResult<SubscriptionRecord | null>> {
  if (!supabase) return { data: null, error: 'supabase_not_configured' }
  const environment = clientPaddleEnvironment()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      'status,provider,current_period_end,scheduled_change_action,scheduled_change_effective_at',
    )
    .eq('user_id', userId)
    .in('provider', clientSubscriptionProviders(environment))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>()

  if (error) return { data: null, error: error.message }
  return {
    data: data
      ? {
          status: data.status,
          provider: data.provider,
          currentPeriodEnd: data.current_period_end,
          scheduledChangeAction: data.scheduled_change_action,
          scheduledChangeEffectiveAt: data.scheduled_change_effective_at,
        }
      : null,
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

interface PaddleEvent {
  name?: string
}

interface PaddleGlobal {
  Environment?: { set(environment: PaddleEnvironment): void }
  Initialize(options: { token: string; eventCallback?: (event: PaddleEvent) => void }): void
  Checkout: { open(options: PaddleCheckoutOptions): void; close(): void }
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal
  }
}

const PADDLE_JS_URL = 'https://cdn.paddle.com/paddle/v2/paddle.js'
let paddleLoadPromise: Promise<PaddleGlobal> | null = null
let initializedPaddleKey: string | null = null
let checkoutOverlayOpen = false
let checkoutHistoryArmed = false
let closingCheckoutFromHistory = false
let suppressNextCheckoutPop = false
let checkoutPopstateBound = false

function bindCheckoutBackButton(): void {
  if (typeof window === 'undefined' || checkoutPopstateBound) return
  checkoutPopstateBound = true
  window.addEventListener('popstate', () => {
    if (suppressNextCheckoutPop) {
      suppressNextCheckoutPop = false
      return
    }
    if (!checkoutOverlayOpen) return

    closingCheckoutFromHistory = true
    checkoutOverlayOpen = false
    checkoutHistoryArmed = false
    window.Paddle?.Checkout.close()
    closingCheckoutFromHistory = false
  })
}

function markCheckoutOpened(): void {
  if (typeof window === 'undefined') return
  bindCheckoutBackButton()
  checkoutOverlayOpen = true
  checkoutHistoryArmed = true
  window.history.pushState(
    { ...(window.history.state ?? {}), paddleCheckoutOverlay: true },
    '',
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  )
}

function markCheckoutClosed(): void {
  if (!checkoutOverlayOpen && !checkoutHistoryArmed) return
  checkoutOverlayOpen = false
  if (checkoutHistoryArmed && !closingCheckoutFromHistory) {
    checkoutHistoryArmed = false
    suppressNextCheckoutPop = true
    window.history.back()
    return
  }
  checkoutHistoryArmed = false
}

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
    paddle.Initialize({
      token: config.token,
      eventCallback(event) {
        if (event.name === 'checkout.closed') markCheckoutClosed()
      },
    })
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
    markCheckoutOpened()
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

export interface SubscriptionSummary extends SubscriptionRecord {
  plan: BillingPlan | null
  recurringAmount: string | null
  currencyCode: string | null
  nextBilledAt: string | null
  canSwitchYearly: boolean
}

export async function fetchSubscriptionSummary(): Promise<BillingResult<SubscriptionSummary>> {
  const result = await postBilling<{ summary?: SubscriptionSummary }>('/api/billing/summary')
  if (result.error !== null) return result
  return result.data.summary
    ? { data: result.data.summary, error: null }
    : { data: null, error: 'subscription_payload_missing' }
}

export type SubscriptionSwitchAction = 'switched_to_yearly' | 'already_yearly'

export interface SubscriptionSwitchPreview {
  action: 'preview_yearly' | 'already_yearly'
  amount: string | null
  currencyCode: string | null
  recurringAmount: string | null
  nextBilledAt: string | null
}

export async function previewSubscriptionToYearly(): Promise<
  { preview: SubscriptionSwitchPreview | null; error: null } | { preview: null; error: string }
> {
  const result = await postBilling<{ preview?: SubscriptionSwitchPreview }>(
    '/api/billing/switch-yearly-preview',
  )
  if (result.error !== null) return { preview: null, error: result.error }
  return { preview: result.data.preview ?? null, error: null }
}

export async function switchSubscriptionToYearly(): Promise<
  { action: SubscriptionSwitchAction | null; error: null } | { action: null; error: string }
> {
  const result = await postBilling<{ action?: string }>('/api/billing/switch-yearly')
  if (result.error !== null) return { action: null, error: result.error }
  const action =
    result.data.action === 'switched_to_yearly' || result.data.action === 'already_yearly'
      ? result.data.action
      : null
  return { action, error: null }
}

export type SandboxSubscriptionAction = 'sync' | 'cancel_now'

export async function controlSandboxSubscription(
  action: SandboxSubscriptionAction,
): Promise<string | null> {
  const result = await postBilling<{ action?: string }>('/api/billing/sandbox-subscription', {
    action,
  })
  return result.error
}
