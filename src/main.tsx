/* eslint-disable react-refresh/only-export-components -- application bootstrap entrypoint */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CalculatorProvider } from './context/CalculatorContext.tsx'
import { LanguageProvider } from './i18n'
import { analyticsExcluded, startEarlyAnalytics } from './lib/earlyAnalytics'

try { startEarlyAnalytics() } catch { /* Analytics failure must never block the calculator. */ }

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <CalculatorProvider>
          <App />
          <Suspense fallback={null}>
            <Analytics beforeSend={event => analyticsExcluded() ? null : event} />
          </Suspense>
        </CalculatorProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
