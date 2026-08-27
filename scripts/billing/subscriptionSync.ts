import {
  paddleProvider,
  paddleProviderAliases,
  type BillingDeps,
  type PaddleEnvironment,
} from './billingConfig.js'

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'

export interface PaddleSubscription {
  id?: string | null
  customer_id?: string | null
  customer?: string | { id?: string | null } | null
  status?: string | null
  current_billing_period?: { ends_at?: string | null } | null
  next_billed_at?: string | null
  scheduled_change?: {
    action?: string | null
    effective_at?: string | null
  } | null
  custom_data?: Record<string, unknown> | null
}

export function mapPaddleStatus(status: string | null | undefined): SubscriptionStatus {
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

export function getPeriodEndIso(sub: PaddleSubscription): string | null {
  const value = sub.current_billing_period?.ends_at ?? sub.next_billed_at ?? null
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function getScheduledChangeAction(sub: PaddleSubscription): string | null {
  const action = sub.scheduled_change?.action
  return typeof action === 'string' && action ? action : null
}

export function getScheduledChangeEffectiveAtIso(sub: PaddleSubscription): string | null {
  const value = sub.scheduled_change?.effective_at
  if (typeof value !== 'string' || !value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function customerIdOf(
  value: PaddleSubscription | string | { id?: string | null } | null | undefined,
): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if ('customer_id' in value && typeof value.customer_id === 'string') return value.customer_id
  if ('customer' in value) return customerIdOf(value.customer)
  return typeof value.id === 'string' ? value.id : null
}

export interface SubscriptionPatch {
  provider_customer_id: string | null
  provider_subscription_id: string | null
  status: SubscriptionStatus
  current_period_end: string | null
  scheduled_change_action: string | null
  scheduled_change_effective_at: string | null
  updated_at: string
}

export async function upsertSubscriptionByUser(
  deps: BillingDeps,
  userId: string,
  environment: PaddleEnvironment,
  patch: SubscriptionPatch,
): Promise<{ ok: boolean; error?: string }> {
  const provider = paddleProvider(environment)
  const existing = await deps.admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .in('provider', paddleProviderAliases(environment))
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>()

  if (existing.error) return { ok: false, error: existing.error.message }

  if (existing.data) {
    const { error } = await deps.admin
      .from('subscriptions')
      .update({ provider, ...patch })
      .eq('id', existing.data.id)
    return error ? { ok: false, error: error.message } : { ok: true }
  }

  const { error } = await deps.admin
    .from('subscriptions')
    .insert({ user_id: userId, provider, ...patch })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function resolveUserId(
  deps: BillingDeps,
  environment: PaddleEnvironment,
  hint: string | null | undefined,
  customerId: string | null,
): Promise<string | null> {
  if (hint) return hint

  if (customerId) {
    const byCustomer = await deps.admin
      .from('subscriptions')
      .select('user_id')
      .eq('provider_customer_id', customerId)
      .in('provider', paddleProviderAliases(environment))
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ user_id: string }>()
    if (byCustomer.data?.user_id) return byCustomer.data.user_id
  }

  return null
}

export async function syncSubscription(
  deps: BillingDeps,
  sub: PaddleSubscription,
  userIdHint: string | null,
  environment: PaddleEnvironment,
): Promise<{ ok: boolean; error?: string; skipped?: boolean }> {
  const customerId = customerIdOf(sub)
  const customUserId = sub.custom_data?.user_id
  const metaUserId = typeof customUserId === 'string' ? customUserId : null
  const userId = await resolveUserId(deps, environment, userIdHint || metaUserId, customerId)
  if (!userId) return { ok: true, skipped: true }

  return upsertSubscriptionByUser(deps, userId, environment, {
    provider_customer_id: customerId,
    provider_subscription_id: sub.id ?? null,
    status: mapPaddleStatus(sub.status),
    current_period_end: getPeriodEndIso(sub),
    scheduled_change_action: getScheduledChangeAction(sub),
    scheduled_change_effective_at: getScheduledChangeEffectiveAtIso(sub),
    updated_at: new Date().toISOString(),
  })
}
