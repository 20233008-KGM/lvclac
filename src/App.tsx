import { FeedbackBoardPage } from './components/FeedbackBoardPage'
import { FormulasPage } from './components/FormulasPage'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { LanguageToggle } from './components/LanguageToggle'
import { SiteFooter } from './components/SiteFooter'
import { parseBoardPath } from './config/boards'
import { isFormulasPath } from './config/routes'
import { isScenarioModeActive } from './calc/mtmLink'
import { useCalculator } from './context/CalculatorContext'
import { usePathname } from './hooks/usePathname'
import { useLanguage } from './i18n'
import './App.css'

function CalculatorApp() {
  const { t } = useLanguage()
  const { inputs, updateInputs } = useCalculator()
  const scenarioMode = isScenarioModeActive(inputs)

  return (
    <PageShell>
      <div
        className={`calc-viewport${scenarioMode ? ' calc-viewport--scenario' : ''}`}
        id="calculator"
      >
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

function AppRouter() {
  const pathname = usePathname()
  const boardId = parseBoardPath(pathname)

  if (boardId) return <FeedbackBoardPage boardId={boardId} />
  if (isFormulasPath(pathname)) return <FormulasPage />
  return <CalculatorApp />
}

function App() {
  return (
    <DisclaimerProvider>
      <AppRouter />
    </DisclaimerProvider>
  )
}

export default App
