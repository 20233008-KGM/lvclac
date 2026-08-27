export type BillingView = 'loading' | 'free' | 'pro' | 'failed' | 'success'

interface ResolveBillingViewOptions {
  authLoading: boolean
  checkoutSucceeded: boolean
  isPro: boolean
  subscriptionStatus: string | null | undefined
}

/** 구독 확인 전에는 Free로 단정하지 않아 기존 Pro 사용자의 업그레이드 화면 플래시를 막는다. */
export function resolveBillingView({
  authLoading,
  checkoutSucceeded,
  isPro,
  subscriptionStatus,
}: ResolveBillingViewOptions): BillingView {
  if (checkoutSucceeded) return 'success'
  if (authLoading) return 'loading'
  if (isPro) return 'pro'
  if (subscriptionStatus === 'past_due') return 'failed'
  return 'free'
}
