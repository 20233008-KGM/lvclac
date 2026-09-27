import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localBillingReadOrigin, proxyBillingRead } from './devReadProxy'

afterEach(() => vi.unstubAllGlobals())

function response() {
  return { statusCode: 0, setHeader: vi.fn(), end: vi.fn() } as unknown as ServerResponse
}

function request(method = 'POST', authorization: string | undefined = 'Bearer user-token') {
  return { method, headers: { authorization, cookie: 'private=not-forwarded' } } as IncomingMessage
}

describe('local billing read origin', () => {
  it('leaves native billing alone without an explicit proxy', () => {
    expect(localBillingReadOrigin({})).toBeNull()
  })

  it.each([
    ['live', 'https://liqguard.com'], ['sandbox', 'https://devpilgrm.liqguard.com'],
  ])('accepts the trusted %s deployment', (env, origin) => {
    expect(localBillingReadOrigin({ VITE_PADDLE_ENV: env, BILLING_DEV_READ_ORIGIN: origin + '/' })).toBe(origin)
  })

  it.each(['http://liqguard.com', 'https://evil.example', 'https://liqguard.com.evil.example', 'https://devpilgrm.liqguard.com'])(
    'rejects mismatched or untrusted origins: %s', origin => {
      expect(() => localBillingReadOrigin({ VITE_PADDLE_ENV: 'live', BILLING_DEV_READ_ORIGIN: origin })).toThrow()
    })
})

describe('read-only proxy', () => {
  it.each(['/api/billing/summary', '/api/billing/switch-yearly-preview'])('forwards only bearer authentication for %s', async path => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true, summary: { amount: '4800' } }))
    vi.stubGlobal('fetch', fetch)
    const res = response()
    await proxyBillingRead('https://liqguard.com', path, request(), res)
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://liqguard.com' + path, {
      method: 'POST', redirect: 'error', signal: expect.any(AbortSignal),
      headers: { authorization: 'Bearer user-token', 'content-type': 'application/json' }, body: '{}',
    })
    expect(res.statusCode).toBe(200)
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'private, no-store')
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true, summary: { amount: '4800' } }))
  })

  it.each(['/api/billing/cancel-subscription', '/api/billing/switch-yearly', '/api/billing/checkout', '/api/billing/portal'])(
    'never proxies mutations: %s', async path => {
      const fetch = vi.fn()
      vi.stubGlobal('fetch', fetch)
      const res = response()
      await proxyBillingRead('https://liqguard.com', path, request(), res)
      expect(res.statusCode).toBe(404)
      expect(fetch).not.toHaveBeenCalled()
    })

  it.each([
    ['GET', 'Bearer user-token', 405], ['POST', '', 401], ['POST', 'Basic token', 401],
  ])('rejects invalid method/auth before forwarding: %s %s', async (method, token, status) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const res = response()
    await proxyBillingRead('https://liqguard.com', '/api/billing/summary', request(method, token), res)
    expect(res.statusCode).toBe(status)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('preserves the upstream authentication error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ok: false, error: 'invalid_access_token' }, { status: 401 })))
    const res = response()
    await proxyBillingRead('https://liqguard.com', '/api/billing/summary', request(), res)
    expect(res.statusCode).toBe(401)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: false, error: 'invalid_access_token' }))
  })

  it('reports transport failures without leaking error details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private upstream details')))
    const res = response()
    await proxyBillingRead('https://liqguard.com', '/api/billing/summary', request(), res)
    expect(res.statusCode).toBe(502)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: false, error: 'subscription_lookup_failed' }))
  })
})
