/* eslint-disable react-refresh/only-export-components -- Vite client entry point */
import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { PublicCalculatorProvider } from './context/PublicCalculatorContext.tsx'
import { GoogleConsentProvider } from './context/GoogleConsentContext.tsx'
import { LanguageProvider } from './i18n'
import { LanguageToggle } from './components/LanguageToggle.tsx'
import { DisclaimerProvider } from './components/ServiceDisclaimer.tsx'

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <PublicCalculatorProvider>
        <DisclaimerProvider>
          <GoogleConsentProvider>
            {import.meta.env.DEV && <LanguageToggle variant="fixed" />}
            <App />
            <Suspense fallback={null}>
              <Analytics />
            </Suspense>
          </GoogleConsentProvider>
        </DisclaimerProvider>
      </PublicCalculatorProvider>
    </LanguageProvider>
  </StrictMode>,
)
