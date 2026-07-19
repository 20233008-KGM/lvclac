import { loadEnv } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  adsTxtContent,
  transformPublicIndexHtml,
} from './scripts/publicLaunchAssets'
import { assertPublicLaunchReady } from './scripts/publicLaunchValidation'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowIndexing = env.ALLOW_INDEXING === 'true'
  const adsenseClient = env.VITE_ADSENSE_CLIENT?.trim()
  const generatedAdsTxt = adsTxtContent(adsenseClient)

  if (command === 'build' && mode === 'production') {
    assertPublicLaunchReady(env)
  }

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
          this.emitFile({
            type: 'asset',
            fileName: 'ads.txt',
            source: generatedAdsTxt,
          })
        },
      },
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
