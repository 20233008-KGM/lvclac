import { useMemo, useRef, type CSSProperties } from 'react'
import { FeedbackBoardPage } from './components/FeedbackBoardPage'
import { FormulasPage } from './components/FormulasPage'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { HowToUseButton } from './components/HowToUseButton'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { LanguageToggle } from './components/LanguageToggle'
import { SiteFooter } from './components/SiteFooter'
import { parseBoardPath } from './config/boards'
import { isFormulasPath } from './config/routes'
import { isScenarioModeActive } from './calc/mtmLink'
import { LayoutProvider } from './context/LayoutContext'
import { useCalculator } from './context/CalculatorContext'
import { usePathname } from './hooks/usePathname'
import { useGridResize } from './hooks/useGridResize'
import { useLayoutOverflow } from './hooks/useLayoutOverflow'
import { usePrecisionRisk } from './hooks/usePrecisionRisk'
import { useLanguage } from './i18n'
import './App.css'

function CalculatorApp() {
  const { t } = useLanguage()
  const { inputs, updateInputs, saveEnabled } = useCalculator()
  const scenarioMode = isScenarioModeActive(inputs)
  const fitRootRef = useRef<HTMLDivElement>(null)

  const {
    containerRef,
    gridStyle,
    gridScanning,
    scanGeneration,
    resetBtnGlowing,
    resetBtnGlowGeneration,
    getHandleProps,
    isCustom,
    layoutMode,
    reset,
    refreshGeometry,
    expandToFit,
    triggerResizerScan,
  } = useGridResize(saveEnabled)

  const measureKey = useMemo(() => JSON.stringify(inputs), [inputs])

  const { fitScale } = useLayoutOverflow({
    containerRef,
    fitRootRef,
    layoutMode,
    expandToFit,
    onAutoExpand: triggerResizerScan,
    refreshGeometry,
    measureKey,
  })

  const precisionRisk = usePrecisionRisk(inputs)

  return (
    <LayoutProvider layoutMode={layoutMode} fitScale={fitScale}>
      <PageShell>
        <div
          className={`calc-viewport${scenarioMode ? ' calc-viewport--scenario' : ''}`}
          id="calculator"
          style={{ '--calc-fit-scale': fitScale } as CSSProperties}
        >
          <div className="calc-fit-root" ref={fitRootRef}>
            <header className="app-header">
              <div className="header-left">
                <div className="site-title-row">
                  <h1>{t.siteTitle}</h1>
                  <SiteTitleTooltip />
                </div>
                <p className="app-intro">{t.appIntro}</p>
              </div>
              <div className="header-right">
                {isCustom && (
                  <button
                    type="button"
                    className={`layout-reset-btn${resetBtnGlowing ? ' layout-reset-btn--glow' : ''}`}
                    data-glow-gen={resetBtnGlowing ? resetBtnGlowGeneration : undefined}
                    onClick={reset}
                    aria-label={t.resetLayout}
                    title={t.resetLayout}
                  >
                    <span className="layout-reset-btn__icon" aria-hidden="true">
                      ⤢
                    </span>
                  </button>
                )}
                <HowToUseButton />
                <LanguageToggle variant="header" />
              </div>
            </header>
            {precisionRisk && (
              <p className="calc-precision-warning" role="alert">
                {t.results.precisionWarning}
              </p>
            )}
            <main
              className={`calc-grid${gridScanning ? ' calc-grid--scan' : ''}`}
              data-scan-gen={gridScanning ? scanGeneration : undefined}
              ref={containerRef}
              style={gridStyle}
            >
              <div {...getHandleProps('left')} aria-label={t.resizeColumns} />
              <InputPanel inputs={inputs} onChange={updateInputs} />
              <div {...getHandleProps('center')} aria-label={t.resizeColumns} />
              <ResultPanel inputs={inputs} onChange={updateInputs} />
              <div {...getHandleProps('right')} aria-label={t.resizeColumns} />
            </main>
            <ContentRiskNotice />
          </div>
        </div>
        <SiteFooter />
      </PageShell>
    </LayoutProvider>
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
