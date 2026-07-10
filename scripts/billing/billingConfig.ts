import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type BillingPlan = 'monthly' | 'yearly'
export type PaddleEnvironment = 'sandbox' | 'live'

export const BILLING_PLANS: readonly BillingPlan[] = ['monthly', 'yearly']

export function isBillingPlan(value: unknown): value is BillingPlan {
  return value === 'monthly' || value === 'yearly'
}

export function isPaddleEnvironment(value: unknown): value is PaddleEnvironment {
  return value === 'sandbox' || value === 'live'
}

export interface FetchResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}

export type FetchLike = (
  input: string,
  init?: {
    method?: string
    headers?: Record<string, string>
    body?: string
  },
) => Promise<FetchResponseLike>

export interface BillingConfig {
  paddleApiKey: string
  webhookSecret: string
  paddleEnv: PaddleEnvironment
  supabaseUrl: string
  serviceRoleKey: string
  prices: Record<BillingPlan, string>
  appUrl?: string
}

export interface BillingDeps {
  admin: SupabaseClient
  fetch: FetchLike
}

export function readBillingConfig(
  env: Record<string, string | undefined>,
): BillingConfig | null {
  const paddleApiKey = env.PADDLE_API_KEY
  const webhookSecret = env.PADDLE_WEBHOOK_SECRET
  const paddleEnv = env.PADDLE_ENV
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const monthly = env.PADDLE_PRICE_MONTHLY
  const yearly = env.PADDLE_PRICE_YEARLY

  if (
    !paddleApiKey ||
    !webhookSecret ||
    !isPaddleEnvironment(paddleEnv) ||
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    return null
  }
  if (!monthly || !yearly) return null

  return {
    paddleApiKey,
    webhookSecret,
    paddleEnv,
    supabaseUrl,
    serviceRoleKey,
    prices: { monthly, yearly },
    appUrl: env.APP_URL || env.VITE_SITE_URL || undefined,
  }
}

export function createBillingDeps(config: BillingConfig): BillingDeps {
  const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { admin, fetch: fetch as FetchLike }
}

export function paddleApiBaseUrl(env: PaddleEnvironment): string {
  return env === 'sandbox' ? 'https://sandbox-api.paddle.com' : 'https://api.paddle.com'
}

export function resolveBaseUrl(config: BillingConfig, origin: unknown): string | null {
  if (config.appUrl) return config.appUrl.replace(/\/$/, '')
  if (typeof origin === 'string' && /^https?:\/\//.test(origin)) {
    return origin.replace(/\/$/, '')
  }
  return null
}
