import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { PublicCalculatorProvider } from './context/PublicCalculatorContext.tsx'
import { GoogleConsentProvider } from './context/GoogleConsentContext.tsx'
import { LanguageProvider } from './i18n'
import { LanguageToggle } from './components/LanguageToggle.tsx'
import { PresetSelect } from './components/PresetSelect.tsx'

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((mod) => ({ default: mod.Analytics })),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <GoogleConsentProvider>
        <PublicCalculatorProvider>
          <LanguageToggle variant="fixed" />
          <PresetSelect variant="fixed" />
          <App />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </PublicCalculatorProvider>
      </GoogleConsentProvider>
    </LanguageProvider>
  </StrictMode>,
)
