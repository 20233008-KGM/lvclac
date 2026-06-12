import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CalculatorProvider } from './context/CalculatorContext.tsx'
import { LanguageProvider } from './i18n'

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics })),
)

function scheduleAnalyticsInit() {
  const run = () => {
    void import('./lib/analytics.ts').then((mod) => mod.initAnalytics())
  }
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 3000 })
  } else {
    window.setTimeout(run, 2000)
  }
}

scheduleAnalyticsInit()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <CalculatorProvider>
          <App />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </CalculatorProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
