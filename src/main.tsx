import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { PublicCalculatorProvider } from './context/PublicCalculatorContext.tsx'
import { LanguageProvider } from './i18n'
import { LanguageToggle } from './components/LanguageToggle.tsx'
import { PresetSelect } from './components/PresetSelect.tsx'

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
        <PublicCalculatorProvider>
          <LanguageToggle variant="fixed" />
          <PresetSelect variant="fixed" />
          <App />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </PublicCalculatorProvider>
    </LanguageProvider>
  </StrictMode>,
)
