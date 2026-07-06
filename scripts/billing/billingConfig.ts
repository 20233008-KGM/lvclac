/**
 * 결제(Stripe) 서버 핸들러용 설정·의존성.
 *
 * 이 폴더(scripts/billing/)의 코드는 프레임워크에 의존하지 않는 순수 로직이며,
 * Vercel Function(api/stripe/*)과 Vite dev 미들웨어(vite.config.ts) 양쪽에서 재사용된다.
 * STRIPE_SECRET_KEY·SERVICE_ROLE_KEY 같은 비밀은 비-VITE 접두사라 클라이언트 번들에
 * 절대 포함되지 않는다(서버에서만 읽힘).
 */
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** 구독 플랜. Stripe Price ID로 매핑된다. */
export type BillingPlan = 'monthly' | 'yearly'

export const BILLING_PLANS: readonly BillingPlan[] = ['monthly', 'yearly']

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === 'monthly' || value === 'yearly'
}

export interface BillingConfig {
  stripeSecretKey: string
  webhookSecret: string
  supabaseUrl: string
  serviceRoleKey: string
  prices: Record<BillingPlan, string>
  /** 결제 후 돌아올 앱 base URL. 없으면 요청 origin을 사용. */
  appUrl?: string
}

export interface BillingDeps {
  stripe: Stripe
  /** service_role 키로 만든 admin 클라이언트. RLS를 우회해 subscriptions를 동기화한다. */
  admin: SupabaseClient
}

/**
 * 환경변수에서 결제 설정을 읽는다. 필수 값(비밀키/웹훅시크릿/Supabase/가격)이 하나라도
 * 없으면 null을 반환하고, 소비 측에서 "미설정" 응답으로 분기한다.
 */
export function readBillingConfig(
  env: Record<string, string | undefined>,
): BillingConfig | null {
  const stripeSecretKey = env.STRIPE_SECRET_KEY
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const monthly = env.STRIPE_PRICE_MONTHLY
  const yearly = env.STRIPE_PRICE_YEARLY

  if (!stripeSecretKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return null
  }
  if (!monthly || !yearly) {
    return null
  }

  return {
    stripeSecretKey,
    webhookSecret,
    supabaseUrl,
    serviceRoleKey,
    prices: { monthly, yearly },
    appUrl: env.APP_URL || env.VITE_SITE_URL || undefined,
  }
}

/** 기본 의존성 팩토리. 테스트에서는 stub deps를 주입한다. */
export function createBillingDeps(config: BillingConfig): BillingDeps {
  const stripe = new Stripe(config.stripeSecretKey, {
    // apiVersion은 계정 기본값을 사용(명시하지 않음)해 SDK 버전과의 리터럴 불일치를 피한다.
    typescript: true,
  })
  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { stripe, admin }
}

/** 결제 성공/취소 후 돌아올 base URL을 결정한다. */
export function resolveBaseUrl(config: BillingConfig, origin: unknown): string | null {
  if (config.appUrl) return config.appUrl.replace(/\/$/, '')
  if (typeof origin === 'string' && /^https?:\/\//.test(origin)) {
    return origin.replace(/\/$/, '')
  }
  return null
}
