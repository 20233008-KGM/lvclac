import { useCallback, useEffect, useState } from 'react'
import { calculateEvaluate, calculateOrder } from './calc/leverage'
import { AuthPage } from './components/auth/AuthPage'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { DisclaimerModal } from './components/ServiceDisclaimer'
import { LanguageToggle } from './components/LanguageToggle'
import { SiteFooter } from './components/SiteFooter'
import { useAuth } from './context/AuthContext'
import { useLanguage } from './i18n'
import { prefsRepo } from './db'
import { useDebouncedSave } from './hooks/useDebouncedSave'
import './App.css'

function CalculatorApp() {
  const { t } = useLanguage()
  const { user, inputs, updateInputs, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    if (user) setShowAuth(false)
  }, [user])

  const evaluateResult = calculateEvaluate(inputs)
  const orderResult = calculateOrder(inputs)

  const savePrefs = useCallback(
    (value: typeof inputs) => {
      if (user) prefsRepo.savePreferences(user.id, value)
    },
    [user],
  )

  useDebouncedSave(inputs, savePrefs)

  return (
    <PageShell>
      <div className="calc-viewport">
        <header className="app-header">
          <div className="header-left">
            <h1>{t.siteTitle}</h1>
            <p className="app-intro">{t.appIntro}</p>
          </div>
          <div className="header-right">
            <LanguageToggle variant="header" />
            {user ? (
              <>
                <span className="user-badge">{user.username}</span>
                <button type="button" className="btn btn-ghost" onClick={() => logout()}>
                  {t.logout}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setShowAuth(true)}>
                {t.login}
              </button>
            )}
          </div>
        </header>
        <main className="calc-grid">
          <InputPanel inputs={inputs} onChange={updateInputs} />
          <ResultPanel
            mode={inputs.mode}
            positionSide={inputs.positionSide}
            evaluateResult={evaluateResult}
            orderResult={orderResult}
          />
        </main>
      </div>
      <SiteFooter />
      {showAuth && (
        <div
          className="disclaimer-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuth(false)
          }}
        >
          <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <button
              type="button"
              className="auth-modal-close"
              aria-label={t.close}
              onClick={() => setShowAuth(false)}
            >
              ×
            </button>
            <AuthPage variant="modal" />
          </div>
        </div>
      )}
    </PageShell>
  )
}

function App() {
  const { t } = useLanguage()
  const { loading } = useAuth()

  return (
    <>
      <DisclaimerModal />
      {loading ? (
        <div className="loading-screen">
          <p>{t.loading}</p>
        </div>
      ) : (
        <CalculatorApp />
      )}
    </>
  )
}

export default App
