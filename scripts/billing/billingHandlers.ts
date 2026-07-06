/**
 * 결제 서버 핸들러 3종(순수 로직).
 *
 * - handleCheckout: 로그인 사용자를 확인하고 Stripe Checkout(구독) 세션 URL을 생성.
 * - handlePortal:   Stripe Customer Portal(구독 관리) 세션 URL을 생성.
 * - handleWebhook:  Stripe 서명을 검증하고 subscriptions 테이블을 동기화.
 *
 * 프레임워크 비의존. Vercel Function과 Vite dev 미들웨어가 얇게 감싸 호출한다.
 * deps(stripe/admin)를 주입받아 단위 테스트가 가능하다.
 */
import type { BillingConfig, BillingDeps, BillingPlan } from './billingConfig'
import { isBillingPlan, resolveBaseUrl } from './billingConfig'
import { customerIdOf, syncSubscription } from './subscriptionSync'

export interface BillingResult {
  status: number
  body: {
    ok: boolean
    url?: string
    received?: boolean
    error?: string
  }
}

function fail(status: number, error: string): BillingResult {
  return { status, body: { ok: false, error } }
}

/** access token으로 본인을 확인. 실패 시 에러 결과, 성공 시 user 반환. */
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

/** subscriptions 행에 저장된 Stripe customer를 찾고, 없으면 생성해 저장한다. */
async function ensureCustomer(
  deps: BillingDeps,
  userId: string,
  email: string | null,
): Promise<{ customerId: string } | { error: BillingResult }> {
  const existing = await deps.admin
    .from('subscriptions')
    .select('id, provider_customer_id')
    .eq('user_id', userId)
    .maybeSingle<{ id: string; provider_customer_id: string | null }>()

  if (existing.error) return { error: fail(500, existing.error.message) }
  if (existing.data?.provider_customer_id) {
    return { customerId: existing.data.provider_customer_id }
  }

  const customer = await deps.stripe.customers.create({
    email: email ?? undefined,
    metadata: { user_id: userId },
  })

  const patch = {
    provider: 'stripe',
    provider_customer_id: customer.id,
    updated_at: new Date().toISOString(),
  }
  const write = existing.data
    ? await deps.admin.from('subscriptions').update(patch).eq('id', existing.data.id)
    : await deps.admin
        .from('subscriptions')
        .insert({ user_id: userId, status: 'inactive', ...patch })
  if (write.error) return { error: fail(500, write.error.message) }

  return { customerId: customer.id }
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

  const customer = await ensureCustomer(deps, auth.user.id, auth.user.email)
  if ('error' in customer) return customer.error

  const session = await deps.stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: auth.user.id,
    subscription_data: { metadata: { user_id: auth.user.id } },
    allow_promotion_codes: true,
    success_url: `${baseUrl}/my?checkout=success`,
    cancel_url: `${baseUrl}/my?checkout=cancel`,
  })

  if (!session.url) return fail(502, 'checkout_session_no_url')
  return { status: 200, body: { ok: true, url: session.url } }
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

  const baseUrl = resolveBaseUrl(config, request.origin)
  if (!baseUrl) return fail(400, 'missing_origin')

  const auth = await requireUser(deps, request.accessToken)
  if ('error' in auth) return auth.error

  const row = await deps.admin
    .from('subscriptions')
    .select('provider_customer_id')
    .eq('user_id', auth.user.id)
    .maybeSingle<{ provider_customer_id: string | null }>()

  if (row.error) return fail(500, row.error.message)
  const customerId = row.data?.provider_customer_id
  if (!customerId) return fail(400, 'no_customer')

  const session = await deps.stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/my`,
  })
  return { status: 200, body: { ok: true, url: session.url } }
}

export interface WebhookRequest {
  rawBody?: unknown
  signature?: unknown
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
  const rawBody = request.rawBody
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    return fail(400, 'missing_body')
  }

  let event
  try {
    event = deps.stripe.webhooks.constructEvent(rawBody, request.signature, config.webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid_signature'
    return fail(400, `invalid_signature: ${message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const sub = await deps.stripe.subscriptions.retrieve(subId)
          const hint =
            session.client_reference_id ??
            (session.metadata as Record<string, string> | null)?.user_id ??
            null
          const result = await syncSubscription(deps, sub, hint)
          if (!result.ok) return fail(500, result.error ?? 'sync_failed')
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const result = await syncSubscription(deps, sub, null)
        if (!result.ok) return fail(500, result.error ?? 'sync_failed')
        break
      }
      default:
        // 관심 없는 이벤트는 200으로 무시(Stripe 재전송 방지).
        break
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'webhook_handler_error'
    return fail(500, message)
  }

  return { status: 200, body: { ok: true, received: true } }
}

// customerIdOf는 어댑터/테스트에서 재사용될 수 있어 재노출한다.
export { customerIdOf }
