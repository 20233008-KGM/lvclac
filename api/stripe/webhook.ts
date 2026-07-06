/**
 * Vercel Function: Stripe webhook 수신 → subscriptions 동기화.
 * POST /api/stripe/webhook  (header: stripe-signature)
 *
 * bodyParser를 끄고 원문(raw) 본문을 그대로 읽어야 서명 검증이 가능하다.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingDeps, readBillingConfig } from '../../scripts/billing/billingConfig'
import { handleWebhook } from '../../scripts/billing/billingHandlers'
import { headerValue, readRawBody, sendJson } from '../../scripts/billing/nodeAdapter'

// Vercel Node 런타임이 본문을 미리 파싱하지 않도록 한다(서명 검증용 raw 본문 보존).
export const config = { api: { bodyParser: false } }

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  try {
    const billingConfig = readBillingConfig(process.env)
    const deps = billingConfig ? createBillingDeps(billingConfig) : null
    const rawBody = await readRawBody(req)
    const result = await handleWebhook(
      billingConfig,
      { rawBody, signature: headerValue(req, 'stripe-signature') },
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
