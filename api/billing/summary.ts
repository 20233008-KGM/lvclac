/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingDeps, readBillingConfig } from '../../scripts/billing/billingConfig.js'
import { handleSubscriptionSummary } from '../../scripts/billing/billingHandlers.js'
import { bearerToken, sendJson } from '../../scripts/billing/nodeAdapter.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('cache-control', 'private, no-store')
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  if (!bearerToken(req)) return sendJson(res, 401, { ok: false, error: 'missing_access_token' })
  try {
    const config = readBillingConfig(process.env)
    if (!config) return sendJson(res, 500, { ok: false, error: 'billing_not_configured' })
    const result = await handleSubscriptionSummary(config, { accessToken: bearerToken(req) }, createBillingDeps(config))
    sendJson(res, result.status, result.body)
  } catch {
    sendJson(res, 502, { ok: false, error: 'subscription_lookup_failed' })
  }
}
