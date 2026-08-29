import { loadEnv, type Plugin } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import type { ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { createBillingDeps, readBillingConfig } from './scripts/billing/billingConfig'
import {
  handleCheckout,
  handlePortal,
  handleSandboxSubscription,
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
import { adsTxtContent, transformPublicIndexHtml } from './scripts/publicLaunchAssets'
import { assertPublicLaunchReady } from './scripts/publicLaunchValidation'
import { writePublicRouteHtmlAssets } from './scripts/publicSeoAssets'

/**
 * 로컬 dev(`npm run dev`)에서 Paddle 결제 엔드포인트를 프로덕션(api/billing/*)과 동일하게 노출한다.
 * `apply: 'serve'`라 프로덕션 빌드에는 포함되지 않으며, 실제 배포는 Vercel Function이 처리한다.
 * PADDLE_API_KEY 등 비밀은 비-VITE 접두사라 클라이언트 번들에 노출되지 않는다.
 */
function billingDevPlugin(env: Record<string, string>): Plugin {
  const config = readBillingConfig(env)
  return {
    name: 'paddle-billing-dev',
    apply: 'serve',
    configureServer(server) {
      const deps = config ? createBillingDeps(config) : null
      const guard = (res: ServerResponse, error: unknown) => {
        const message = error instanceof Error ? error.message : 'server_error'
        sendBillingJson(res, 500, { ok: false, error: message })
      }

      server.middlewares.use('/api/billing/checkout', (req, res, next) => {
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

      server.middlewares.use('/api/billing/portal', (req, res, next) => {
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

      server.middlewares.use('/api/billing/sandbox-subscription', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const body = await readBillingJson(req)
            const result = await handleSandboxSubscription(
              config,
              { accessToken: bearerToken(req), action: body.action },
              deps as never,
            )
            sendBillingJson(res, result.status, result.body)
          } catch (error) {
            guard(res, error)
          }
        })()
      })

      server.middlewares.use('/api/billing/webhook', (req, res, next) => {
        if (req.method !== 'POST') return next()
        void (async () => {
          try {
            const rawBody = await readRawBody(req)
            const result = await handleWebhook(
              config,
              { rawBody, signature: headerValue(req, 'paddle-signature') },
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

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowIndexing = env.ALLOW_INDEXING === 'true'
  const adsenseClient = env.VITE_ADSENSE_CLIENT?.trim()
  const generatedAdsTxt = adsTxtContent(adsenseClient)
  const siteUrl = env.VITE_SITE_URL?.trim() || 'https://liqguard.com'

  if (command === 'build' && mode === 'production') assertPublicLaunchReady(env)

  return {
    plugins: [
      react(),
      {
        name: 'public-launch-assets',
        transformIndexHtml(html) {
          return transformPublicIndexHtml(html, { allowIndexing, adsenseClient })
        },
        generateBundle() {
          if (!generatedAdsTxt) return
          this.emitFile({ type: 'asset', fileName: 'ads.txt', source: generatedAdsTxt })
        },
        closeBundle() {
          writePublicRouteHtmlAssets('dist', siteUrl)
        },
      },
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
    test: {
      exclude: [...configDefaults.exclude, '**/.recovery/**', 'e2e/**'],
    },
  }
})
