/**
 * Stripe 구독 객체 → Supabase `subscriptions` 행 동기화 로직.
 * webhook 핸들러에서 사용하며, 순수하게 테스트 가능하도록 deps(admin)를 인자로 받는다.
 */
import type Stripe from 'stripe'
import type { BillingDeps } from './billingConfig'

/** DB check 제약이 허용하는 status 집합. */
export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

/**
 * Stripe subscription.status → DB status.
 * incomplete / incomplete_expired / paused 등 미허용 값은 'inactive'로 접는다.
 */
export function mapStripeStatus(status: string | null | undefined): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
      return 'unpaid'
    case 'canceled':
      return 'canceled'
    default:
      return 'inactive'
  }
}

/**
 * 현재 결제 주기 종료 시각(ISO)을 구한다.
 * 신규 API 버전에서는 current_period_end가 subscription item으로 이동했으므로
 * top-level → 첫 item 순으로 방어적으로 조회한다.
 */
export function getPeriodEndIso(sub: Stripe.Subscription): string | null {
  const record = sub as unknown as {
    current_period_end?: number | null
    items?: { data?: Array<{ current_period_end?: number | null }> }
  }
  const seconds =
    record.current_period_end ?? record.items?.data?.[0]?.current_period_end ?? null
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return null
  return new Date(seconds * 1000).toISOString()
}

/** Stripe customer id를 문자열로 정규화. */
export function customerIdOf(
  customer: string | { id: string } | null | undefined,
): string | null {
  if (!customer) return null
  return typeof customer === 'string' ? customer : customer.id
}

export interface SubscriptionPatch {
  provider_customer_id: string | null
  provider_subscription_id: string | null
  status: SubscriptionStatus
  current_period_end: string | null
  updated_at: string
}

/**
 * user_id 기준으로 구독 행을 upsert한다. user_id에 unique 제약을 두지 않으므로
 * (numberSets와 동일하게) 존재하면 update, 없으면 insert 한다.
 */
export async function upsertSubscriptionByUser(
  deps: BillingDeps,
  userId: string,
  patch: SubscriptionPatch,
): Promise<{ ok: boolean; error?: string }> {
  const existing = await deps.admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle<{ id: string }>()

  if (existing.error) return { ok: false, error: existing.error.message }

  if (existing.data) {
    const { error } = await deps.admin
      .from('subscriptions')
      .update(patch)
      .eq('id', existing.data.id)
    return error ? { ok: false, error: error.message } : { ok: true }
  }

  const { error } = await deps.admin
    .from('subscriptions')
    .insert({ user_id: userId, provider: 'stripe', ...patch })
  return error ? { ok: false, error: error.message } : { ok: true }
}

/**
 * webhook 이벤트에서 user_id를 결정한다.
 * 1) 명시적 hint(client_reference_id / metadata.user_id)
 * 2) provider_customer_id로 기존 행 역조회
 * 3) Stripe customer.metadata.user_id 조회
 * 셋 다 실패하면 null(매핑 불가 → 안전하게 스킵).
 */
export async function resolveUserId(
  deps: BillingDeps,
  hint: string | null | undefined,
  customerId: string | null,
): Promise<string | null> {
  if (hint) return hint

  if (customerId) {
    const byCustomer = await deps.admin
      .from('subscriptions')
      .select('user_id')
      .eq('provider_customer_id', customerId)
      .maybeSingle<{ user_id: string }>()
    if (byCustomer.data?.user_id) return byCustomer.data.user_id

    try {
      const customer = await deps.stripe.customers.retrieve(customerId)
      if (customer && !customer.deleted) {
        const metaUserId = (customer.metadata as Record<string, string> | undefined)?.user_id
        if (metaUserId) return metaUserId
      }
    } catch {
      // customer 조회 실패는 무시하고 매핑 불가로 처리
    }
  }

  return null
}

/** Stripe subscription을 받아 DB에 반영한다. */
export async function syncSubscription(
  deps: BillingDeps,
  sub: Stripe.Subscription,
  userIdHint: string | null,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const customerId = customerIdOf(sub.customer)
  const metaUserId = (sub.metadata as Record<string, string> | undefined)?.user_id ?? null
  const userId = await resolveUserId(deps, userIdHint || metaUserId, customerId)
  if (!userId) return { ok: true, skipped: true }

  const result = await upsertSubscriptionByUser(deps, userId, {
    provider_customer_id: customerId,
    provider_subscription_id: sub.id,
    status: mapStripeStatus(sub.status),
    current_period_end: getPeriodEndIso(sub),
    updated_at: new Date().toISOString(),
  })
  return result
}
