import { Suspense, lazy, useMemo, useRef, type CSSProperties } from 'react'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { AuthButton } from './components/auth/AuthButton'
import { HowToUseButton } from './components/HowToUseButton'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { SiteFooter } from './components/SiteFooter'
import { parseBoardPath } from './config/boards'
import { isAboutPath, isFormulasPath, isGuidePath } from './config/routes'
import { isPreviewModeActive } from './calc/mtmLink'
import { LayoutProvider } from './context/LayoutContext'
import { useCalculator } from './context/CalculatorContext'
import { usePathname } from './hooks/usePathname'
import { useGridResize } from './hooks/useGridResize'
import { useLayoutOverflow } from './hooks/useLayoutOverflow'
import { usePrecisionRisk } from './hooks/usePrecisionRisk'
import { useLanguage } from './i18n'
import './App.css'

const FeedbackBoardPage = lazy(() =>
  import('./components/FeedbackBoardPage').then((mod) => ({ default: mod.FeedbackBoardPage })),
)
const FormulasPage = lazy(() =>
  import('./components/FormulasPage').then((mod) => ({ default: mod.FormulasPage })),
)
const GuidePage = lazy(() =>
  import('./components/GuidePage').then((mod) => ({ default: mod.GuidePage })),
)
const AboutPage = lazy(() =>
  import('./components/AboutPage').then((mod) => ({ default: mod.AboutPage })),
)

function CalculatorApp() {
  const { t } = useLanguage()
  const { inputs, updateInputs, saveEnabled } = useCalculator()
  const previewMode = isPreviewModeActive(inputs)
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
    layoutVersion,
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
    layoutVersion,
  })

  const precisionRisk = usePrecisionRisk(inputs)

  return (
    <LayoutProvider layoutMode={layoutMode} fitScale={fitScale}>
      <PageShell>
        <div
          className={`calc-viewport${previewMode ? ' calc-viewport--scenario' : ''}`}
          id="calculator"
          style={{ '--calc-fit-scale': fitScale } as CSSProperties}
        >
          <div className="calc-fit-root">
            <div className="calc-scale-root" ref={fitRootRef}>
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
                  <AuthButton variant="header" />
                </div>
              </header>
              <main
                className={`calc-grid${gridScanning ? ' calc-grid--scan' : ''}`}
                data-scan-gen={gridScanning ? scanGeneration : undefined}
                ref={containerRef}
                style={gridStyle}
              >
                {precisionRisk && (
                  <div className="calc-grid__banner">
                    <p className="calc-precision-warning" role="alert">
                      {t.results.precisionWarning}
                    </p>
                  </div>
                )}
                <div {...getHandleProps('left')} aria-label={t.resizeColumns} />
                <InputPanel inputs={inputs} onChange={updateInputs} />
                <div {...getHandleProps('center')} aria-label={t.resizeColumns} />
                <ResultPanel inputs={inputs} onChange={updateInputs} />
                <div {...getHandleProps('right')} aria-label={t.resizeColumns} />
              </main>
            </div>
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

  if (boardId) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <FeedbackBoardPage boardId={boardId} />
        </div>
      </Suspense>
    )
  }
  if (isFormulasPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <FormulasPage />
      </Suspense>
    )
  }
  if (isGuidePath(pathname)) {
    return (
      <Suspense fallback={null}>
        <GuidePage />
      </Suspense>
    )
  }
  if (isAboutPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <AboutPage />
        </div>
      </Suspense>
    )
  }
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
