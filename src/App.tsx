import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { LanguageToggle } from './components/LanguageToggle'
import { SiteFooter } from './components/SiteFooter'
import { useCalculator } from './context/CalculatorContext'
import { useLanguage } from './i18n'
import './App.css'

function CalculatorApp() {
  const { t } = useLanguage()
  const { inputs, updateInputs } = useCalculator()

  return (
    <PageShell>
      <div className="calc-viewport" id="calculator">
        <header className="app-header">
          <div className="header-left">
            <h1>{t.siteTitle}</h1>
            <p className="app-intro">{t.appIntro}</p>
          </div>
          <div className="header-right">
            <LanguageToggle variant="header" />
          </div>
        </header>
        <main className="calc-grid">
          <InputPanel inputs={inputs} onChange={updateInputs} />
          <ResultPanel inputs={inputs} onChange={updateInputs} />
        </main>
        <ContentRiskNotice />
      </div>
      <SiteFooter />
    </PageShell>
  )
}

function App() {
  return (
    <DisclaimerProvider>
      <CalculatorApp />
    </DisclaimerProvider>
  )
}

export default App
