import type { IncomingMessage, ServerResponse } from 'node:http'
import { bearerToken, sendJson } from './nodeAdapter'

const READ_PATHS = new Set(['/api/billing/summary', '/api/billing/switch-yearly-preview'])

export function localBillingReadOrigin(env: Record<string, string>): string | null {
  const origin = env.BILLING_DEV_READ_ORIGIN?.replace(/\/$/, '')
  if (!origin) return null
  const expected = env.VITE_PADDLE_ENV === 'live' ? 'https://liqguard.com'
    : env.VITE_PADDLE_ENV === 'sandbox' ? 'https://devpilgrm.liqguard.com' : null
  if (origin !== expected) throw new Error('BILLING_DEV_READ_ORIGIN must match the trusted LiqGuard deployment for VITE_PADDLE_ENV.')
  return origin
}

export async function proxyBillingRead(
  origin: string,
  path: string,
  req: IncomingMessage,
  res: ServerResponse,
  cancellationAvailable = false,
): Promise<void> {
  res.setHeader('cache-control', 'private, no-store')
  if (!READ_PATHS.has(path)) return sendJson(res, 404, { ok: false, error: 'not_found' })
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' })
  const token = bearerToken(req)
  if (!token) return sendJson(res, 401, { ok: false, error: 'missing_access_token' })
  try {
    // Only forward the user's bearer token, never local secrets, cookies, or arbitrary paths.
    const response = await fetch(`${origin}${path}`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: '{}',
    })
    const body = await response.json()
    if (response.ok && path === '/api/billing/summary' && body && typeof body === 'object'
      && 'summary' in body && body.summary
      && typeof body.summary === 'object' && !Array.isArray(body.summary)) {
      // Remote reads do not imply that this local server can execute cancellation.
      body.summary = { ...body.summary, cancellationAvailable }
    }
    sendJson(res, response.status, body)
  } catch {
    sendJson(res, 502, { ok: false, error: 'subscription_lookup_failed' })
  }
}
