import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { handleDevReset, type DevResetConfig } from './scripts/devResetHandler'
import { createBillingDeps, readBillingConfig } from './scripts/billing/billingConfig'
import {
  handleCheckout,
  handlePortal,
  handleWebhook,
} from './scripts/billing/billingHandlers'
import {
  bearerToken,
  headerValue,
  readJsonBody as readBillingJson,
  readRawBody,
  requestOrigin,
  sendJson as sendBillingJson,
} from './scripts/billing/nodeAdapter'

/** 요청 body(JSON)를 안전하게 읽는다. 과도한 payload는 거부. */
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) reject(new Error('payload_too_large'))
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        reject(new Error('invalid_json'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

/**
 * 개발 전용 계정 초기화 미들웨어. `apply: 'serve'`라 프로덕션 빌드에는 존재하지 않는다.
 * service_role 키(비-VITE 접두사)는 서버(Node)에서만 읽히고 클라이언트로 나가지 않는다.
 */
function devResetPlugin(env: Record<string, string>): Plugin {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const config: DevResetConfig | null = url && serviceRoleKey ? { url, serviceRoleKey } : null

  return {
    name: 'dev-reset-account',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/reset-account', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const body = (await readJsonBody(req)) as Record<string, unknown>
            const result = await handleDevReset(config, {
              accessToken: body.accessToken,
              mode: body.mode,
            })
            sendJson(res, result.status, result.body)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'bad_request'
            sendJson(res, 400, { ok: false, error: message })
          }
        })()
      })
    },
  }
}

/**
 * 로컬 dev(`npm run dev`)에서 Stripe 결제 엔드포인트를 프로덕션(api/stripe/*)과 동일하게 노출한다.
 * `apply: 'serve'`라 프로덕션 빌드에는 포함되지 않으며, 실제 배포는 Vercel Function이 처리한다.
 * STRIPE_SECRET_KEY 등 비밀은 비-VITE 접두사라 클라이언트 번들에 노출되지 않는다.
 */
function billingDevPlugin(env: Record<string, string>): Plugin {
  const config = readBillingConfig(env)
  return {
    name: 'stripe-billing-dev',
    apply: 'serve',
    configureServer(server) {
      const deps = config ? createBillingDeps(config) : null
      const guard = (res: ServerResponse, error: unknown) => {
        const message = error instanceof Error ? error.message : 'server_error'
        sendBillingJson(res, 500, { ok: false, error: message })
      }

      server.middlewares.use('/api/stripe/checkout', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const body = await readBillingJson(req)
            const result = await handleCheckout(
              config,
              { accessToken: bearerToken(req), plan: body.plan, origin: requestOrigin(req) },
              deps as never,
            )
            sendBillingJson(res, result.status, result.body)
          } catch (error) {
            guard(res, error)
          }
        })()
      })

      server.middlewares.use('/api/stripe/portal', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const result = await handlePortal(
              config,
              { accessToken: bearerToken(req), origin: requestOrigin(req) },
              deps as never,
            )
            sendBillingJson(res, result.status, result.body)
          } catch (error) {
            guard(res, error)
          }
        })()
      })

      server.middlewares.use('/api/stripe/webhook', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const rawBody = await readRawBody(req)
            const result = await handleWebhook(
              config,
              { rawBody, signature: headerValue(req, 'stripe-signature') },
              deps as never,
            )
            sendBillingJson(res, result.status, result.body)
          } catch (error) {
            guard(res, error)
          }
        })()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowIndexing = env.ALLOW_INDEXING === 'true'

  return {
    plugins: [
      react(),
      {
        name: 'html-robots-meta',
        transformIndexHtml(html) {
          if (allowIndexing || html.includes('name="robots"')) return html
          return html.replace(
            '<head>',
            '<head>\n    <meta name="robots" content="noindex, nofollow" />',
          )
        },
      },
      devResetPlugin(env),
      billingDevPlugin(env),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'vendor'
            }
            if (id.includes('node_modules/@vercel/analytics')) return 'analytics'
            if (id.includes('/locales/ko')) return 'locale-ko'
            if (id.includes('/locales/en')) return 'locale-en'
          },
        },
      },
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      sourcemap: false,
    },
  }
})
