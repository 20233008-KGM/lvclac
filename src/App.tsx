import {
  Suspense,
  lazy,
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
import { ContentRiskNotice, DisclaimerProvider } from './components/ServiceDisclaimer'
import { FieldHintBanner } from './components/FieldHintBanner'
import {
  fieldHintActive,
  readFieldHintDismissed,
  readTraderStage,
  writeFieldHintDismissed,
} from './components/fieldHint'
import { AuthButton } from './components/auth/AuthButton'
import { useAuth } from './context/AuthContext'
import { HowToUseButton } from './components/HowToUseButton'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { SiteFooter } from './components/SiteFooter'
import { parseBoardPath } from './config/boards'
import {
  isAboutPath,
  isAdminFeedbackPath,
  isBillingPath,
  isCompanyPath,
  isFormulasPath,
  isGuidePath,
  isLegalPath,
  isKitPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
} from './config/routes'
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
const CompanyPage = lazy(() =>
  import('./components/CompanyPage').then((mod) => ({ default: mod.CompanyPage })),
)
const MyPage = lazy(() =>
  import('./components/MyPage').then((mod) => ({ default: mod.MyPage })),
)
const BillingPage = lazy(() =>
  import('./components/billing/BillingPage').then((mod) => ({ default: mod.BillingPage })),
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
const ResetPasswordScreen = lazy(() =>
  import('./components/auth/ResetPasswordScreen').then((mod) => ({
    default: mod.ResetPasswordScreen,
  })),
)
const KitGallery = lazy(() =>
  import('./components/KitGallery').then((mod) => ({ default: mod.KitGallery })),
)

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
                  <AuthButton variant="header" />
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
  const boardId = parseBoardPath(pathname)
  const legalKind = isLegalPath(pathname)

  // 컴포넌트 전시장(UI 키트) — Figma export용. 미링크·noindex라 일반 사용자에겐 노출되지 않지만,
  // 배포본 URL로 html.to.design가 가져올 수 있도록 프로덕션에서도 라우팅한다.
  // TODO: 정식 공개(런칭) 전 제거 또는 재게이팅.
  if (isKitPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <KitGallery />
      </Suspense>
    )
  }
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
  if (isCompanyPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <CompanyPage />
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
  if (isBillingPath(pathname)) {
    return (
      <Suspense fallback={null}>
        <div key={pathname} className="route-enter">
          <BillingPage />
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
  const { recoveryMode } = useAuth()
  return (
    <DisclaimerProvider>
      {recoveryMode ? (
        <Suspense fallback={null}>
          <ResetPasswordScreen />
        </Suspense>
      ) : (
        <AppRouter />
      )}
    </DisclaimerProvider>
  )
}

export default App
