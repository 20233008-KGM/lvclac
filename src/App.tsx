import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { CalculatorHistoryMenu } from './components/CalculatorHistoryMenu'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice } from './components/ServiceDisclaimer'
import { FieldHintBanner } from './components/FieldHintBanner'
import { GuidePage } from './components/GuidePage'
import { FormulasPage } from './components/FormulasPage'
import { AboutPage } from './components/AboutPage'
import { HowToUseButton } from './components/HowToUseButton'
import {
  fieldHintActive,
  readFieldHintDismissed,
  readTraderStage,
  writeFieldHintDismissed,
} from './components/fieldHint'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { SiteFooter } from './components/SiteFooter'
import { PublicLegalPage } from './components/PublicLegalPage'
import { PublicPageMetadata } from './components/PublicPageMetadata'
import { UpdatesPage } from './components/UpdatesPage'
import {
  isAboutPath,
  isFormulasPath,
  isGuidePath,
  isLegalPath,
  isUpdatesPath,
} from './config/routes'
import { isPreviewModeActive } from './calc/mtmLink'
import { LayoutProvider } from './context/LayoutContext'
import { usePublicCalculator } from './context/PublicCalculatorContext'
import { usePathname } from './hooks/usePathname'
import { useGridResize } from './hooks/useGridResize'
import { useLayoutOverflow } from './hooks/useLayoutOverflow'
import { usePrecisionRisk } from './hooks/usePrecisionRisk'
import { useLanguage } from './i18n'
import './App.css'

function isTextEditingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLElement && target.isContentEditable)
}

function CalculatorApp() {
  const { t, preset } = useLanguage()
  const isDevDeployment = import.meta.env.VITE_DEPLOYMENT_CHANNEL === 'dev'
  const {
    inputs,
    updateInputs,
    undoInputs,
    redoInputs,
    canUndo,
    canRedo,
    undoHistory,
    redoHistory,
    jumpHistory,
    saveEnabled,
  } = usePublicCalculator()
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
  } = useGridResize(saveEnabled, t)

  const measureKey = useMemo(
    () => JSON.stringify({ inputs, locale: t.htmlLang, preset }),
    [inputs, t.htmlLang, preset],
  )

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'z' || !(e.ctrlKey || e.metaKey) || e.altKey) return
      if (isTextEditingTarget(e.target)) return

      if (e.shiftKey) {
        if (!canRedo) return
        e.preventDefault()
        redoInputs()
        return
      }

      if (!canUndo) return
      e.preventDefault()
      undoInputs()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canRedo, canUndo, redoInputs, undoInputs])

  // 온보딩에서 고른 거래 상태 기반 필드 인디케이터(첫 세션, X로 닫으면 영구 해제).
  const traderStage = useMemo(() => readTraderStage(), [])
  const [fieldHintDismissed, setFieldHintDismissed] = useState(readFieldHintDismissed)
  const fieldHintOn = fieldHintActive(traderStage, fieldHintDismissed)

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
                    {isDevDeployment && <span className="deployment-badge">DEV</span>}
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
                  <CalculatorHistoryMenu
                    messages={t}
                    undoHistory={undoHistory}
                    redoHistory={redoHistory}
                    jumpHistory={jumpHistory}
                  />
                  <HowToUseButton />
                </div>
              </header>
              {fieldHintOn && traderStage && (
                <FieldHintBanner
                  stage={traderStage}
                  onDismiss={() => {
                    writeFieldHintDismissed()
                    setFieldHintDismissed(true)
                  }}
                />
              )}
              <main
                className={`calc-grid${gridScanning ? ' calc-grid--scan' : ''}`}
                data-scan-gen={gridScanning ? scanGeneration : undefined}
                data-field-hint={fieldHintOn && traderStage ? traderStage : undefined}
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
  const legalKind = isLegalPath(pathname)
  const guidePath = isGuidePath(pathname)
  const formulasPath = isFormulasPath(pathname)
  const aboutPath = isAboutPath(pathname)
  const updatesPath = isUpdatesPath(pathname)

  useEffect(() => {
    if (
      pathname !== '/' &&
      !guidePath &&
      !formulasPath &&
      !aboutPath &&
      !updatesPath &&
      legalKind !== 'terms' &&
      legalKind !== 'privacy'
    ) {
      window.history.replaceState(null, '', '/')
    }
  }, [aboutPath, formulasPath, guidePath, legalKind, pathname, updatesPath])

  const metadata = <PublicPageMetadata pathname={pathname} />

  if (guidePath) {
    return (
      <>
        {metadata}
        <GuidePage />
      </>
    )
  }

  if (formulasPath) {
    return (
      <>
        {metadata}
        <FormulasPage />
      </>
    )
  }

  if (aboutPath) {
    return (
      <>
        {metadata}
        <AboutPage />
      </>
    )
  }

  if (updatesPath) {
    return (
      <>
        {metadata}
        <UpdatesPage />
      </>
    )
  }

  if (legalKind === 'terms' || legalKind === 'privacy') {
    return (
      <>
        {metadata}
        <PublicLegalPage kind={legalKind} />
      </>
    )
  }

  return (
    <>
      {metadata}
      <CalculatorApp />
    </>
  )
}

function App() {
  return <AppRouter />
}

export default App
