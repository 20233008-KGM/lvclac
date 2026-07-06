/**
 * Vercel Function: 구독 Checkout 세션 생성.
 * POST /api/stripe/checkout  { plan: 'monthly' | 'yearly' }  (Authorization: Bearer <supabase access token>)
 * 로직은 scripts/billing 핸들러에 있고, 여기서는 얇게 감싸기만 한다.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingDeps, readBillingConfig } from '../../scripts/billing/billingConfig'
import { handleCheckout } from '../../scripts/billing/billingHandlers'
import { bearerToken, readJsonBody, requestOrigin, sendJson } from '../../scripts/billing/nodeAdapter'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  try {
    const config = readBillingConfig(process.env)
    const deps = config ? createBillingDeps(config) : null
    const body = await readJsonBody(req)
    const result = await handleCheckout(
      config,
      { accessToken: bearerToken(req), plan: body.plan, origin: requestOrigin(req) },
      // config가 null이면 핸들러가 deps 사용 전에 반환하므로 안전하다.
      deps as never,
    )
    sendJson(res, result.status, result.body)
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'server_error',
    })
  }
}
