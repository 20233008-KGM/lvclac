/// <reference types="node" />

import type { IncomingMessage, ServerResponse } from 'node:http'
import { bearerToken, readJsonBody, sendJson } from '../../scripts/billing/nodeAdapter.js'
import {
  createFeedbackNotificationDeps,
  handleFeedbackNotification,
  readFeedbackNotificationConfig,
} from '../../scripts/feedback/feedbackNotification.js'

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  }

  try {
    const body = await readJsonBody(req)
    const config = readFeedbackNotificationConfig(process.env)
    const result = await handleFeedbackNotification(
      config,
      {
        accessToken: bearerToken(req),
        postId: typeof body.postId === 'string' ? body.postId : null,
      },
      config ? createFeedbackNotificationDeps(config) : null,
    )
    sendJson(res, result.status, result.body)
  } catch {
    sendJson(res, 500, {
      ok: false,
      error: 'server_error',
    })
  }
}
