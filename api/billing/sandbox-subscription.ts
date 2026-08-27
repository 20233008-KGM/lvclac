/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'
import { createBillingDeps, readBillingConfig } from '../../scripts/billing/billingConfig.js'
import { handleSandboxSubscription } from '../../scripts/billing/billingHandlers.js'
import {
  bearerToken,
  readJsonBody,
  sendJson,
} from '../../scripts/billing/nodeAdapter.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  }
  try {
    const config = readBillingConfig(process.env)
    const deps = config ? createBillingDeps(config) : null
    const body = await readJsonBody(req)
    const result = await handleSandboxSubscription(
      config,
      { accessToken: bearerToken(req), action: body.action },
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
