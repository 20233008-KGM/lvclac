import { request } from 'node:http'
import type { AddressInfo } from 'node:net'
import { createServer, type ViteDevServer } from 'vite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { billingDevPlugin } from '../../vite.config'
import * as billingConfig from './billingConfig'

const servers: ViteDevServer[] = []
afterEach(async () => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  for (const server of servers.splice(0)) await server.close()
})

async function start(env: Record<string, string>) {
  const server = await createServer({
    configFile: false, logLevel: 'silent', plugins: [billingDevPlugin(env)],
    server: { host: '127.0.0.1', port: 0, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  servers.push(server)
  await server.listen()
  return `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`
}

function post(url: string, token = '', body = '{}') {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const req = request(url, {
      method: 'POST', agent: false, headers: token ? { authorization: `Bearer ${token}` } : {},
    }, res => {
      let body = ''
      res.on('data', chunk => { body += chunk })
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, body: JSON.parse(body) }) } catch (error) { reject(error) }
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.end(body)
  })
}

describe('Vite billing route wiring', () => {
  it('serves both read endpoints from two different local ports without server secrets', async () => {
    // Each request needs a new Response because its stream is consumed once.
    const upstream = vi.fn(async () => Response.json({ ok: true, summary: { amount: '4800' } }))
    vi.stubGlobal('fetch', upstream)
    const env = { VITE_PADDLE_ENV: 'live', BILLING_DEV_READ_ORIGIN: 'https://liqguard.com' }
    const first = await start(env)
    const second = await start(env)
    expect(first).not.toBe(second)
    for (const origin of [first, second]) {
      for (const path of ['/api/billing/summary', '/api/billing/switch-yearly-preview']) {
        expect(await post(origin + path, 'user-token')).toEqual({
          status: 200, body: { ok: true, summary: {
            amount: '4800', ...(path === '/api/billing/summary' ? { cancellationAvailable: false } : {}),
          } },
        })
      }
    }
    expect(upstream).toHaveBeenCalledTimes(4)
  })

  it('does not forward local cancellation or plan-change requests', async () => {
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const origin = await start({ VITE_PADDLE_ENV: 'live', BILLING_DEV_READ_ORIGIN: 'https://liqguard.com' })
    for (const path of ['/api/billing/cancel-subscription', '/api/billing/switch-yearly']) {
      expect(await post(origin + path, 'user-token')).toEqual({
        status: 500, body: { ok: false, error: 'billing_not_configured' },
      })
    }
    expect(upstream).not.toHaveBeenCalled()
  })

  it('enables only cancellation forwarding after explicit opt-in on different local ports', async () => {
    const cancellation = { status: 'active', effectiveAt: '2027-09-28T09:00:00Z', syncPending: false }
    const upstream = vi.fn(async (url: string) => Response.json(url.endsWith('/summary')
      ? { ok: true, summary: { status: 'active' } } : { ok: true, cancellation }))
    vi.stubGlobal('fetch', upstream)
    const env = { VITE_PADDLE_ENV: 'live', BILLING_DEV_READ_ORIGIN: 'https://liqguard.com', BILLING_DEV_ALLOW_CANCELLATION: 'true' }
    for (const origin of [await start(env), await start(env)]) {
      expect((await post(origin + '/api/billing/summary', 'user-token')).body)
        .toMatchObject({ summary: { cancellationAvailable: true } })
      expect(await post(origin + '/api/billing/cancel-subscription', 'user-token', JSON.stringify({ effective_from: 'immediately' })))
        .toEqual({ status: 200, body: { ok: true, cancellation } })
      expect(await post(origin + '/api/billing/switch-yearly', 'user-token')).toEqual({
        status: 500, body: { ok: false, error: 'billing_not_configured' },
      })
    }
    expect(upstream).toHaveBeenCalledTimes(4)
    expect(upstream).toHaveBeenLastCalledWith('https://liqguard.com/api/billing/cancel-subscription', expect.objectContaining({ body: '{}' }))
  })

  it('registers the native yearly routes and rejects missing authentication instead of 404', async () => {
    const origin = await start({})
    for (const path of ['/api/billing/summary', '/api/billing/switch-yearly-preview', '/api/billing/switch-yearly']) {
      expect(await post(origin + path)).toEqual({
        status: 401, body: { ok: false, error: 'missing_access_token' },
      })
    }
  })

  it('blocks cancellation when local credentials target a different billing environment', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, summary: { status: 'active' } })))
    const origin = await start({
      BILLING_DEV_READ_ORIGIN: 'https://liqguard.com', VITE_PADDLE_ENV: 'live',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      PADDLE_ENV: 'sandbox', PADDLE_API_KEY: 'test-key', PADDLE_WEBHOOK_SECRET: 'test-secret',
      PADDLE_PRICE_MONTHLY: 'pri_month', PADDLE_PRICE_YEARLY: 'pri_year',
      SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    })
    expect((await post(origin + '/api/billing/summary', 'user-token')).body)
      .toMatchObject({ summary: { cancellationAvailable: false } })
    expect(await post(origin + '/api/billing/cancel-subscription', 'user-token')).toEqual({
      status: 500, body: { ok: false, error: 'billing_not_configured' },
    })
  })

  it('keeps native checkout return URLs on the requesting local port', async () => {
    vi.spyOn(billingConfig, 'createBillingDeps').mockReturnValue({
      admin: { auth: { getUser: async () => ({ data: { user: { id: 'user-test', email: 'test@example.com' } } }) } },
      fetch: vi.fn(),
    } as unknown as billingConfig.BillingDeps)
    const origin = await start({
      PADDLE_API_KEY: 'test-key', PADDLE_WEBHOOK_SECRET: 'test-secret', PADDLE_ENV: 'sandbox',
      PADDLE_PRICE_MONTHLY: 'pri_month', PADDLE_PRICE_YEARLY: 'pri_year',
      SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
      VITE_PADDLE_ENV: 'sandbox', VITE_PADDLE_CLIENT_TOKEN: 'test_public', APP_URL: 'https://devpilgrm.liqguard.com',
    })
    const result = await post(origin + '/api/billing/checkout', 'user-token', JSON.stringify({ plan: 'yearly' }))
    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({ successUrl: origin + '/my?checkout=success&plan=yearly' })
  })
})
