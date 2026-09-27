import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  BillingConfig,
  BillingDeps,
  BillingPlan,
  FetchResponseLike,
} from './billingConfig.js'
import {
  isBillingPlan,
  paddleApiBaseUrl,
  paddleProvider,
  paddleProviderAliases,
  resolveBaseUrl,
} from './billingConfig.js'
import {
  customerIdOf,
  syncSubscription,
  type PaddleSubscription,
} from './subscriptionSync.js'

type JsonObject = Record<string, unknown>
type PaddleFailurePhase = 'subscription_lookup' | 'subscription_preview' | 'subscription_update'

export interface BillingResult {
  status: number
  body: {
    ok: boolean
    url?: string
    priceId?: string
    customData?: JsonObject
    customerEmail?: string | null
    successUrl?: string
    received?: boolean
    action?: string
    error?: string
    reason?: string
    preview?: SubscriptionSwitchPreview
  }
}

function fail(status: number, error: string, reason?: string): BillingResult {
  return { status, body: { ok: false, error, ...(reason ? { reason } : {}) } }
}

function paddleFailureReason(status: number, payload: unknown): string {
  const root = asRecord(payload)
  const error = asRecord(root?.error)
  return (
    stringValue(error?.code) ??
    stringValue(error?.type) ??
    stringValue(root?.code) ??
    stringValue(root?.type) ??
    `http_${status}`
  )
}

function logPaddleFailure(
  phase: PaddleFailurePhase,
  response: FetchResponseLike,
  payload: unknown,
  subscriptionId: string,
): string {
  const reason = paddleFailureReason(response.status, payload)
  const requestId =
    stringValue(asRecord(asRecord(payload)?.meta)?.request_id) ??
    stringValue(asRecord(payload)?.request_id)
  const maskedSubscriptionId =
    subscriptionId.length > 12
      ? `${subscriptionId.slice(0, 7)}...${subscriptionId.slice(-5)}`
      : subscriptionId
  console.error('paddle_subscription_change_failed', {
    phase,
    status: response.status,
    reason,
    requestId,
    subscriptionId: maskedSubscriptionId,
  })
  return reason
}

async function requireUser(
  deps: BillingDeps,
  accessToken: unknown,
): Promise<{ user: { id: string; email: string | null } } | { error: BillingResult }> {
  if (typeof accessToken !== 'string' || !accessToken) {
    return { error: fail(401, 'missing_access_token') }
  }
  const { data, error } = await deps.admin.auth.getUser(accessToken)
  if (error || !data?.user) {
    return { error: fail(401, 'invalid_access_token') }
  }
  return { user: { id: data.user.id, email: data.user.email ?? null } }
}

export interface CheckoutRequest {
  accessToken?: unknown
  plan?: unknown
  origin?: unknown
}

export async function handleCheckout(
  config: BillingConfig | null,
  request: CheckoutRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')
  if (!isBillingPlan(request.plan)) return fail(400, 'invalid_plan')

  const plan: BillingPlan = request.plan
  const priceId = config.prices[plan]
  if (!priceId) return fail(500, 'price_not_configured')

  const baseUrl = resolveBaseUrl(config, request.origin)
  if (!baseUrl) return fail(400, 'missing_origin')

  const auth = await requireUser(deps, request.accessToken)
  if ('error' in auth) return auth.error

  return {
    status: 200,
    body: {
      ok: true,
      priceId,
      customData: { user_id: auth.user.id, plan, provider: paddleProvider(config.paddleEnv) },
      customerEmail: auth.user.email,
      successUrl: `${baseUrl}/my?checkout=success`,
    },
  }
}

export interface PortalRequest {
  accessToken?: unknown
  origin?: unknown
}

export async function handlePortal(
  config: BillingConfig | null,
  request: PortalRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')

  const auth = await requireUser(deps, request.accessToken)
  if ('error' in auth) return auth.error

  const row = await deps.admin
    .from('subscriptions')
    .select('provider_customer_id,provider_subscription_id')
    .eq('user_id', auth.user.id)
    .in('provider', paddleProviderAliases(config.paddleEnv))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<{
      provider_customer_id: string | null
      provider_subscription_id: string | null
    }>()

  if (row.error) return fail(500, row.error.message)
  const customerId = row.data?.provider_customer_id
  if (!customerId) return fail(400, 'no_customer')

  const subscriptionId = row.data?.provider_subscription_id
  const response = await deps.fetch(
    `${paddleApiBaseUrl(config.paddleEnv)}/customers/${encodeURIComponent(
      customerId,
    )}/portal-sessions`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${config.paddleApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(subscriptionId ? { subscription_ids: [subscriptionId] } : {}),
    },
  )

  const payload = await response.json().catch(() => null)
  if (!response.ok) return fail(502, 'portal_request_failed')

  const url = portalSessionUrl(payload)
  if (!url) return fail(502, 'portal_url_missing')
  return { status: 200, body: { ok: true, url } }
}

export type SandboxSubscriptionAction = 'sync' | 'cancel_now'

export interface SandboxSubscriptionRequest {
  accessToken?: unknown
  action?: unknown
}

/**
 * 개발자용 Sandbox 구독 제어. Live 환경에서는 항상 닫혀 있으며,
 * 현재 로그인 사용자가 소유한 구독만 서버에서 다시 확인한다.
 */
export async function handleSandboxSubscription(
  config: BillingConfig | null,
  request: SandboxSubscriptionRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')
  if (config.paddleEnv !== 'sandbox') return fail(404, 'sandbox_control_unavailable')
  if (request.action !== 'sync' && request.action !== 'cancel_now') {
    return fail(400, 'invalid_sandbox_action')
  }

  const auth = await requireUser(deps, request.accessToken)
  if ('error' in auth) return auth.error

  const subscriptionRow = await deps.admin
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', auth.user.id)
    .in('provider', paddleProviderAliases(config.paddleEnv))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ provider_subscription_id: string | null }>()
  if (subscriptionRow.error) return fail(500, subscriptionRow.error.message)

  const subscriptionId = subscriptionRow.data?.provider_subscription_id
  if (!subscriptionId) return fail(400, 'no_subscription')

  const endpoint = `${paddleApiBaseUrl(config.paddleEnv)}/subscriptions/${encodeURIComponent(
    subscriptionId,
  )}${request.action === 'cancel_now' ? '/cancel' : ''}`
  const response = await deps.fetch(endpoint, {
    method: request.action === 'cancel_now' ? 'POST' : 'GET',
    headers: {
      authorization: `Bearer ${config.paddleApiKey}`,
      'content-type': 'application/json',
    },
    ...(request.action === 'cancel_now'
      ? { body: JSON.stringify({ effective_from: 'immediately' }) }
      : {}),
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    return fail(
      502,
      request.action === 'cancel_now' ? 'sandbox_cancel_failed' : 'sandbox_sync_failed',
    )
  }
  const subscription = asRecord(asRecord(payload)?.data) as PaddleSubscription | null
  if (!subscription) return fail(502, 'subscription_payload_missing')

  const syncResult = await syncSubscription(deps, subscription, auth.user.id, config.paddleEnv)
  if (!syncResult.ok) return fail(500, syncResult.error ?? 'sync_failed')
  return { status: 200, body: { ok: true, action: request.action } }
}

export interface SwitchYearlyRequest {
  accessToken?: unknown
}

export interface SubscriptionSwitchPreview {
  action: 'preview_yearly' | 'already_yearly'
  amount: string | null
  currencyCode: string | null
  recurringAmount: string | null
  nextBilledAt: string | null
}

function paddleSubscriptionPriceId(subscription: JsonObject | null): string | null {
  const items = Array.isArray(subscription?.items) ? subscription.items : []
  for (const item of items) {
    const price = asRecord(asRecord(item)?.price)
    const id = stringValue(price?.id)
    if (id) return id
  }
  return null
}

function paddleSubscriptionStatus(subscription: JsonObject | null): string | null {
  return stringValue(subscription?.status)
}

function switchYearlyRequestBody(config: BillingConfig): JsonObject {
  return {
    proration_billing_mode: 'prorated_immediately',
    on_payment_failure: 'prevent_change',
    items: [{ price_id: config.prices.yearly, quantity: 1 }],
  }
}

function totalsAmount(value: unknown): string | null {
  const totals = asRecord(value)
  return (
    stringValue(totals?.grand_total) ??
    stringValue(totals?.balance) ??
    stringValue(totals?.total)
  )
}

function previewFromPaddlePayload(payload: unknown): SubscriptionSwitchPreview {
  const data = asRecord(asRecord(payload)?.data)
  const immediateTransaction = asRecord(data?.immediate_transaction)
  const immediateDetails = asRecord(immediateTransaction?.details)
  const immediateTotals = asRecord(immediateDetails?.totals)
  const recurringDetails = asRecord(data?.recurring_transaction_details)
  const recurringTotals = asRecord(recurringDetails?.totals)

  return {
    action: 'preview_yearly',
    amount: totalsAmount(immediateTotals),
    currencyCode:
      stringValue(immediateTransaction?.currency_code) ??
      stringValue(recurringDetails?.currency_code) ??
      stringValue(data?.currency_code),
    recurringAmount: totalsAmount(recurringTotals),
    nextBilledAt:
      stringValue(data?.next_billed_at) ??
      stringValue(asRecord(data?.next_transaction)?.billed_at),
  }
}

async function fetchOwnedSubscriptionId(
  config: BillingConfig,
  request: { accessToken?: unknown },
  deps: BillingDeps,
): Promise<
  | { userId: string; subscriptionId: string }
  | { error: BillingResult }
> {
  const auth = await requireUser(deps, request.accessToken)
  if ('error' in auth) return auth

  const subscriptionRow = await deps.admin
    .from('subscriptions')
    .select('provider_subscription_id')
    .eq('user_id', auth.user.id)
    .in('provider', paddleProviderAliases(config.paddleEnv))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ provider_subscription_id: string | null }>()
  if (subscriptionRow.error) return { error: fail(500, subscriptionRow.error.message) }

  const subscriptionId = subscriptionRow.data?.provider_subscription_id
  if (!subscriptionId) return { error: fail(400, 'no_subscription') }
  return { userId: auth.user.id, subscriptionId }
}

export async function handleSwitchYearly(
  config: BillingConfig | null,
  request: SwitchYearlyRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')

  const owned = await fetchOwnedSubscriptionId(config, request, deps)
  if ('error' in owned) return owned.error

  const endpoint = `${paddleApiBaseUrl(config.paddleEnv)}/subscriptions/${encodeURIComponent(
    owned.subscriptionId,
  )}`
  const currentResponse = await deps.fetch(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${config.paddleApiKey}`,
      'content-type': 'application/json',
    },
  })
  const currentPayload = await currentResponse.json().catch(() => null)
  if (!currentResponse.ok) {
    const reason = logPaddleFailure(
      'subscription_lookup',
      currentResponse,
      currentPayload,
      owned.subscriptionId,
    )
    return fail(502, 'subscription_lookup_failed', reason)
  }

  const currentSubscription = asRecord(asRecord(currentPayload)?.data)
  const currentStatus = paddleSubscriptionStatus(currentSubscription)
  if (currentStatus !== 'active' && currentStatus !== 'trialing') {
    return fail(400, 'subscription_not_active')
  }

  const currentPriceId = paddleSubscriptionPriceId(currentSubscription)
  if (currentPriceId === config.prices.yearly) {
    return { status: 200, body: { ok: true, action: 'already_yearly' } }
  }
  if (currentPriceId !== config.prices.monthly) {
    return fail(400, 'unsupported_current_plan')
  }

  const updateResponse = await deps.fetch(endpoint, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${config.paddleApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(switchYearlyRequestBody(config)),
  })
  const updatePayload = await updateResponse.json().catch(() => null)
  if (!updateResponse.ok) {
    const reason = logPaddleFailure(
      'subscription_update',
      updateResponse,
      updatePayload,
      owned.subscriptionId,
    )
    return fail(502, 'subscription_update_failed', reason)
  }

  const updatedSubscription = asRecord(asRecord(updatePayload)?.data) as PaddleSubscription | null
  if (!updatedSubscription) return fail(502, 'subscription_payload_missing')

  const syncResult = await syncSubscription(
    deps,
    updatedSubscription,
    owned.userId,
    config.paddleEnv,
  )
  if (!syncResult.ok) return fail(500, syncResult.error ?? 'sync_failed')
  return { status: 200, body: { ok: true, action: 'switched_to_yearly' } }
}

export async function handleSwitchYearlyPreview(
  config: BillingConfig | null,
  request: SwitchYearlyRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')

  const owned = await fetchOwnedSubscriptionId(config, request, deps)
  if ('error' in owned) return owned.error

  const endpoint = `${paddleApiBaseUrl(config.paddleEnv)}/subscriptions/${encodeURIComponent(
    owned.subscriptionId,
  )}`
  const currentResponse = await deps.fetch(endpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${config.paddleApiKey}`,
      'content-type': 'application/json',
    },
  })
  const currentPayload = await currentResponse.json().catch(() => null)
  if (!currentResponse.ok) {
    const reason = logPaddleFailure(
      'subscription_lookup',
      currentResponse,
      currentPayload,
      owned.subscriptionId,
    )
    return fail(502, 'subscription_lookup_failed', reason)
  }

  const currentSubscription = asRecord(asRecord(currentPayload)?.data)
  const currentStatus = paddleSubscriptionStatus(currentSubscription)
  if (currentStatus !== 'active' && currentStatus !== 'trialing') {
    return fail(400, 'subscription_not_active')
  }

  const currentPriceId = paddleSubscriptionPriceId(currentSubscription)
  if (currentPriceId === config.prices.yearly) {
    return {
      status: 200,
      body: {
        ok: true,
        action: 'already_yearly',
        preview: {
          action: 'already_yearly',
          amount: null,
          currencyCode: null,
          recurringAmount: null,
          nextBilledAt: null,
        },
      },
    }
  }
  if (currentPriceId !== config.prices.monthly) {
    return fail(400, 'unsupported_current_plan')
  }

  const previewResponse = await deps.fetch(`${endpoint}/preview`, {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${config.paddleApiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(switchYearlyRequestBody(config)),
  })
  const previewPayload = await previewResponse.json().catch(() => null)
  if (!previewResponse.ok) {
    const reason = logPaddleFailure(
      'subscription_preview',
      previewResponse,
      previewPayload,
      owned.subscriptionId,
    )
    return fail(502, 'subscription_preview_failed', reason)
  }

  return {
    status: 200,
    body: {
      ok: true,
      action: 'preview_yearly',
      preview: previewFromPaddlePayload(previewPayload),
    },
  }
}

export interface WebhookRequest {
  rawBody?: unknown
  signature?: unknown
}

function asRecord(value: unknown): JsonObject | null {
  return value && typeof value === 'object' ? (value as JsonObject) : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function portalSessionUrl(payload: unknown): string | null {
  const root = asRecord(payload)
  const data = asRecord(root?.data)
  const urls = asRecord(data?.urls)
  const general = asRecord(urls?.general)
  return stringValue(general?.overview) ?? stringValue(data?.url) ?? stringValue(root?.url)
}

function rawBodyBuffer(rawBody: unknown): Buffer | null {
  if (Buffer.isBuffer(rawBody)) return rawBody
  if (typeof rawBody === 'string') return Buffer.from(rawBody, 'utf8')
  return null
}

const PADDLE_SIGNATURE_TOLERANCE_SECONDS = 5

function parsePaddleSignature(signature: string): { ts: string; h1: string[] } | null {
  let ts: string | null = null
  const h1: string[] = []
  for (const part of signature.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    const value = rest.join('=')
    if (key === 'ts' && value) ts = value
    if (key === 'h1' && /^[0-9a-f]{64}$/i.test(value)) h1.push(value)
  }
  return ts && h1.length > 0 ? { ts, h1 } : null
}

function verifyPaddleSignature(
  rawBody: Buffer,
  signature: string,
  secret: string,
  nowMs = Date.now(),
): boolean {
  const parsed = parsePaddleSignature(signature)
  if (!parsed) return false
  const timestamp = Number(parsed.ts)
  if (!Number.isInteger(timestamp)) return false
  const ageSeconds = Math.abs(nowMs / 1000 - timestamp)
  if (ageSeconds > PADDLE_SIGNATURE_TOLERANCE_SECONDS) return false
  const digest = createHmac('sha256', secret)
    .update(Buffer.from(`${parsed.ts}:`, 'utf8'))
    .update(rawBody)
    .digest('hex')
  const expected = Buffer.from(digest, 'hex')
  return parsed.h1.some((candidate) => {
    const received = Buffer.from(candidate, 'hex')
    return expected.length === received.length && timingSafeEqual(expected, received)
  })
}

export async function handleWebhook(
  config: BillingConfig | null,
  request: WebhookRequest,
  deps: BillingDeps,
): Promise<BillingResult> {
  if (!config) return fail(500, 'billing_not_configured')
  if (typeof request.signature !== 'string' || !request.signature) {
    return fail(400, 'missing_signature')
  }
  const rawBody = rawBodyBuffer(request.rawBody)
  if (!rawBody) return fail(400, 'missing_body')
  if (!verifyPaddleSignature(rawBody, request.signature, config.webhookSecret)) {
    return fail(400, 'invalid_signature')
  }

  try {
    const event = JSON.parse(rawBody.toString('utf8')) as {
      event_type?: string
      type?: string
      occurred_at?: string
      data?: JsonObject
    }
    const eventType = event.event_type ?? event.type ?? ''
    if (eventType.startsWith('subscription.') && event.data) {
      const hint = stringValue(asRecord(event.data.custom_data)?.user_id)
      const result = await syncSubscription(
        deps,
        event.data,
        hint,
        config.paddleEnv,
        event.occurred_at,
      )
      if (!result.ok) return fail(500, result.error ?? 'sync_failed')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'webhook_handler_error'
    return fail(500, message)
  }

  return { status: 200, body: { ok: true, received: true } }
}

export { customerIdOf }
