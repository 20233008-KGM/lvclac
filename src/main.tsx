import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CalculatorProvider } from './context/CalculatorContext.tsx'
import { LanguageProvider } from './i18n'
import { LanguageToggle } from './components/LanguageToggle.tsx'
import { PresetSelect } from './components/PresetSelect.tsx'
import { isKitPath } from './config/routes.ts'

// UI 키트 전시장(/kit)에선 떠다니는 고정 위젯을 숨긴다(제목과 겹침 방지, 깔끔한 export).
const showFixedWidgets = !isKitPath(window.location.pathname)

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
          {showFixedWidgets && <LanguageToggle variant="fixed" />}
          {showFixedWidgets && <PresetSelect variant="fixed" />}
          <App />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </CalculatorProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
)
