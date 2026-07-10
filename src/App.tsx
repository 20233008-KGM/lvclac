import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from 'react'
import { InputPanel } from './components/InputPanel'
import { PageShell } from './components/PageShell'
import { ResultPanel } from './components/ResultPanel'
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { AuthButton } from './components/auth/AuthButton'
import { HowToUseButton } from './components/HowToUseButton'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { SiteFooter } from './components/SiteFooter'
import { parseBoardPath } from './config/boards'
import {
  isAboutPath,
  isAdminFeedbackPath,
  isFormulasPath,
  isGuidePath,
  isLegalPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
} from './config/routes'
import { isPreviewModeActive } from './calc/mtmLink'
import { LayoutProvider } from './context/LayoutContext'
import { useCalculator } from './context/CalculatorContext'
import type { CalculatorHistoryMove } from './context/calculatorHistory'
import { usePathname } from './hooks/usePathname'
import { useGridResize } from './hooks/useGridResize'
import { useLayoutOverflow } from './hooks/useLayoutOverflow'
import { usePrecisionRisk } from './hooks/usePrecisionRisk'
import { useLanguage } from './i18n'
import type { Messages } from './i18n/types'
import type { CalculatorInputs } from './types'
import { formatNumber } from './utils/format'
import './App.css'

const FeedbackBoardPage = lazy(() =>
  import('./components/FeedbackBoardPage').then((mod) => ({ default: mod.FeedbackBoardPage })),
)
const AdminFeedbackPage = lazy(() =>
  import('./components/AdminFeedbackPage').then((mod) => ({ default: mod.AdminFeedbackPage })),
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
const MyPage = lazy(() =>
  import('./components/MyPage').then((mod) => ({ default: mod.MyPage })),
)
const RecordsArchivePage = lazy(() =>
  import('./components/RecordsArchivePage').then((mod) => ({ default: mod.RecordsArchivePage })),
)
const ProductReviewPage = lazy(() =>
  import('./components/PaddleReviewPages').then((mod) => ({ default: mod.ProductReviewPage })),
)
const PricingReviewPage = lazy(() =>
  import('./components/PaddleReviewPages').then((mod) => ({ default: mod.PricingReviewPage })),
)
const PublicLegalPage = lazy(() =>
  import('./components/PaddleReviewPages').then((mod) => ({ default: mod.PublicLegalPage })),
)

type CalculatorHistoryCopy = Messages['calculatorHistory']

function HistoryIcon() {
  return (
    <svg
      className="calculator-history-btn__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function replaceHistoryTokens(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

function formatHistoryValue(value: number | undefined): string {
  return value == null ? '-' : formatNumber(value)
}

function countChangedFields(before: CalculatorInputs, after: CalculatorInputs): number {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)])
  let count = 0
  keys.forEach((key) => {
    const field = key as keyof CalculatorInputs
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) count += 1
  })
  return count
}

function describeHistoryTarget(
  before: CalculatorInputs,
  after: CalculatorInputs,
  copy: CalculatorHistoryCopy,
): string {
  if (!before.orderScenarioRevertSnapshot && after.orderScenarioRevertSnapshot) {
    return copy.diff.orderPreview
  }
  if (before.orderScenarioRevertSnapshot && !after.orderScenarioRevertSnapshot) {
    return copy.diff.orderApply
  }
  if (!before.scenarioRevertSnapshot && after.scenarioRevertSnapshot) {
    return copy.diff.scenarioPreview
  }
  if (before.scenarioRevertSnapshot && !after.scenarioRevertSnapshot) {
    return copy.diff.scenarioApply
  }

  const fieldDiffs: Array<{
    before: number | undefined
    after: number | undefined
    template: string
  }> = [
    { before: before.accountEval, after: after.accountEval, template: copy.diff.accountEval },
    { before: before.currentPrice, after: after.currentPrice, template: copy.diff.currentPrice },
    { before: before.contracts, after: after.contracts, template: copy.diff.contracts },
  ].filter((entry) => entry.before !== entry.after)

  if (fieldDiffs.length === 1) {
    const [entry] = fieldDiffs
    return replaceHistoryTokens(entry.template, {
      before: formatHistoryValue(entry.before),
      after: formatHistoryValue(entry.after),
    })
  }

  const changedCount = countChangedFields(before, after)
  if (changedCount > 1) {
    return replaceHistoryTokens(copy.diff.multiple, { count: changedCount })
  }

  return copy.diff.generic
}

function isFocusLeavingHistory(root: HTMLElement, event: FocusEvent<HTMLElement>) {
  const next = event.relatedTarget
  return !(next instanceof Node && root.contains(next))
}

function CalculatorHistoryMenu({
  copy,
  currentInputs,
  undoHistory,
  redoHistory,
  jumpHistory,
}: {
  copy: CalculatorHistoryCopy
  currentInputs: CalculatorInputs
  undoHistory: CalculatorHistoryMove[]
  redoHistory: CalculatorHistoryMove[]
  jumpHistory: (direction: CalculatorHistoryMove['direction'], steps: number) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const hasHistory = undoHistory.length > 0 || redoHistory.length > 0

  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function renderMoves(sectionLabel: string, moves: CalculatorHistoryMove[]) {
    if (moves.length === 0) return null
    return (
      <div className="calculator-history-menu__section">
        <div className="calculator-history-menu__section-title">{sectionLabel}</div>
        {moves.map((move) => (
          <button
            key={`${move.direction}-${move.steps}`}
            type="button"
            role="menuitem"
            className="calculator-history-menu__item"
            onClick={() => {
              jumpHistory(move.direction, move.steps)
              setMenuOpen(false)
            }}
          >
            <span className="calculator-history-menu__item-main">
              {describeHistoryTarget(currentInputs, move.target, copy)}
            </span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="calculator-history"
      ref={rootRef}
      onMouseEnter={() => setMenuOpen(true)}
      onMouseLeave={() => setMenuOpen(false)}
      onFocus={() => setMenuOpen(true)}
      onBlur={(event) => {
        if (isFocusLeavingHistory(event.currentTarget, event)) setMenuOpen(false)
      }}
    >
      <button
        type="button"
        className={`calculator-history-btn${menuOpen ? ' calculator-history-btn--active' : ''}`}
        aria-label={copy.buttonLabel}
        title={copy.buttonLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onContextMenu={(event) => {
          event.preventDefault()
          setMenuOpen(true)
        }}
      >
        <HistoryIcon />
      </button>
      {menuOpen && (
        <div className="calculator-history-menu" role="menu" aria-label={copy.menuTitle}>
          <div className="calculator-history-menu__title">{copy.menuTitle}</div>
          {hasHistory ? (
            <>
              {renderMoves(copy.undoSection, undoHistory)}
              {renderMoves(copy.redoSection, redoHistory)}
            </>
          ) : (
            <p className="calculator-history-menu__empty">{copy.empty}</p>
          )}
        </div>
      )}
    </div>
  )
}

function CalculatorApp() {
  const { t } = useLanguage()
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
  } = useCalculator()
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'z' || !(e.ctrlKey || e.metaKey) || e.altKey) return

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
                  <CalculatorHistoryMenu
                    copy={t.calculatorHistory}
                    currentInputs={inputs}
                    undoHistory={undoHistory}
                    redoHistory={redoHistory}
                    jumpHistory={jumpHistory}
                  />
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
  const legalKind = isLegalPath(pathname)

  if (isAdminFeedbackPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter">
          <AdminFeedbackPage />
        </div>
      </Suspense>
    )
  }
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
  if (isMyPagePath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter">
          <MyPage />
        </div>
      </Suspense>
    )
  }
  if (isRecordsPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter">
          <RecordsArchivePage />
        </div>
      </Suspense>
    )
  }
  if (isProductPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <ProductReviewPage />
        </div>
      </Suspense>
    )
  }
  if (isPricingPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <PricingReviewPage />
        </div>
      </Suspense>
    )
  }
  if (legalKind) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <PublicLegalPage kind={legalKind} />
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
