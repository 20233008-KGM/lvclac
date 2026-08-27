import { isActiveSubscription } from '../db/billing'

export function shouldShowSandboxSubscriptionReset(
  paddleEnvironment: string | undefined,
  userId: string | undefined,
  subscriptionStatus: string | null | undefined,
): boolean {
  return (
    paddleEnvironment === 'sandbox' &&
    Boolean(userId) &&
    isActiveSubscription(subscriptionStatus)
  )
}
