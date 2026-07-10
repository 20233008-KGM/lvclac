import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingDeps, readBillingConfig } from '../../scripts/billing/billingConfig'
import { handleWebhook } from '../../scripts/billing/billingHandlers'
import { headerValue, readRawBody, sendJson } from '../../scripts/billing/nodeAdapter'

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
      { rawBody, signature: headerValue(req, 'paddle-signature') },
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
