import type { SubscriptionRecord } from '../../db/billing'

export function isCancellationScheduled(
  subscription: SubscriptionRecord | null | undefined,
): boolean {
  if (subscription?.scheduledChangeAction !== 'cancel') return false
  if (!subscription.scheduledChangeEffectiveAt) return false
  return !Number.isNaN(new Date(subscription.scheduledChangeEffectiveAt).getTime())
}

export function subscriptionAccessEnd(
  subscription: SubscriptionRecord | null | undefined,
): string | null {
  if (isCancellationScheduled(subscription)) return subscription!.scheduledChangeEffectiveAt
  return subscription?.currentPeriodEnd ?? null
}
