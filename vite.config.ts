import { loadEnv } from 'vite'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

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
      exclude: [...configDefaults.exclude, '**/.recovery/**'],
    },
  }
})
