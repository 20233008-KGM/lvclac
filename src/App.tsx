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
import {
  ContentRiskNotice,
  DisclaimerProvider,
} from './components/ServiceDisclaimer'
import {
  fieldHintCalculationComplete,
  fieldHintActive,
  readFieldHintDismissed,
  readTraderStage,
  TRADER_STAGE_CHANGE_EVENT,
  writeFieldHintDismissed,
} from './components/fieldHint'
import { AuthButton } from './components/auth/AuthButton'
import { useAuth } from './context/AuthContext'
import { HowToUseButton } from './components/HowToUseButton'
import { SiteTitleTooltip } from './components/SiteTitleTooltip'
import { SiteFooter } from './components/SiteFooter'
import { PublicPageMetadata } from './components/PublicPageMetadata'
import { PublicHomeSeoSummary } from './components/PublicSeoContent'
import { parseBoardPath } from './config/boards'
import {
  isAboutPath,
  isAdminFeedbackPath,
  isBillingPath,
  isCompanyPath,
  isContactPath,
  isFormulasPath,
  isGuidePath,
  isLegalPath,
  isKitPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
  isUpdatesPath,
  updateIdFromPath,
} from './config/routes'
import { isPreviewModeActive } from './calc/mtmLink'
import { calculateEvaluate, calculateOrder } from './calc/leverage'
import { LayoutProvider } from './context/LayoutContext'
import { useFirstVisitWelcome } from './context/FirstVisitFlowContext'
import { useCalculator } from './context/CalculatorContext'
import { GoogleConsentProvider } from './context/GoogleConsentContext'
import { usePathname } from './hooks/usePathname'
import { useGridResize } from './hooks/useGridResize'
import { useLayoutOverflow } from './hooks/useLayoutOverflow'
import { usePrecisionRisk } from './hooks/usePrecisionRisk'
import { useLanguage } from './i18n'
import { loadMyPage } from './routes/lazyPages'
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
const ContactPage = lazy(() =>
  import('./components/ContactPage').then((mod) => ({ default: mod.ContactPage })),
)
const UpdatesPage = lazy(() =>
  import('./components/UpdatesPage').then((mod) => ({ default: mod.UpdatesPage })),
)
const UpdateDetailPage = lazy(() =>
  import('./components/UpdateDetailPage').then((mod) => ({ default: mod.UpdateDetailPage })),
)
const MyPage = lazy(() =>
  loadMyPage().then((mod) => ({ default: mod.MyPage })),
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
  const firstVisitWelcome = useFirstVisitWelcome()
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

  // 온보딩에서 고른 거래 상태 기반 필드 안내. 상단 사용법 버튼으로 언제든 다시 켤 수 있다.
  const [traderStage, setTraderStage] = useState(readTraderStage)
  const [fieldHintDismissed, setFieldHintDismissed] = useState(readFieldHintDismissed)
  const fieldHintOn = fieldHintActive(traderStage, fieldHintDismissed)
  const fieldHintComplete = useMemo(() => {
    if (!traderStage) return false
    return fieldHintCalculationComplete(
      traderStage,
      calculateEvaluate(inputs).liquidationPrice,
      calculateOrder(inputs).afterLiquidation,
    )
  }, [inputs, traderStage])
  const previousFieldHintComplete = useRef(fieldHintComplete)

  useEffect(() => {
    function syncTraderStage() {
      setTraderStage(readTraderStage())
    }

    window.addEventListener(TRADER_STAGE_CHANGE_EVENT, syncTraderStage)
    return () => window.removeEventListener(TRADER_STAGE_CHANGE_EVENT, syncTraderStage)
  }, [])

  useEffect(() => {
    if (fieldHintOn && fieldHintComplete && !previousFieldHintComplete.current) {
      writeFieldHintDismissed(true)
      setFieldHintDismissed(true)
    }
    previousFieldHintComplete.current = fieldHintComplete
  }, [fieldHintComplete, fieldHintOn])

  function toggleFieldHint() {
    const nextDismissed = fieldHintOn
    writeFieldHintDismissed(nextDismissed)
    setFieldHintDismissed(nextDismissed)
  }

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
                    <span className="product-stage-badge">BETA</span>
                    {isDevDeployment && <span className="deployment-badge">DEV</span>}
                    <SiteTitleTooltip />
                  </div>
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
                  {firstVisitWelcome?.welcomePending ? (
                    <button
                      type="button"
                      className="header-welcome-btn"
                      aria-label={t.welcome.headerCtaAriaLabel}
                      onClick={firstVisitWelcome.showWelcome}
                    >
                      <span>{t.welcome.headerCta}</span>
                      <span className="header-welcome-btn__meta">{t.welcome.headerCtaMeta}</span>
                    </button>
                  ) : (
                    <HowToUseButton
                      fieldGuideStage={traderStage}
                      fieldGuideActive={fieldHintOn}
                      onFieldGuideToggle={traderStage ? toggleFieldHint : undefined}
                    />
                  )}
                  <AuthButton variant="header" />
                </div>
              </header>
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
          </div>
        </div>
        <PublicHomeSeoSummary />
        <ContentRiskNotice />
        <SiteFooter />
      </PageShell>
    </LayoutProvider>
  )
}

function AppRouter() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const boardId = parseBoardPath(pathname)
  const legalKind = isLegalPath(pathname)
  const updateId = updateIdFromPath(pathname)
  const metadata = <PublicPageMetadata pathname={pathname} />

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
      <>{metadata}<Suspense fallback={null}><FormulasPage /></Suspense></>
    )
  }
  if (isGuidePath(pathname)) {
    return (
      <>{metadata}<Suspense fallback={null}><GuidePage /></Suspense></>
    )
  }
  if (isAboutPath(pathname)) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <AboutPage />
        </div>
      </Suspense></>
    )
  }
  if (isCompanyPath(pathname)) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <CompanyPage />
        </div>
      </Suspense></>
    )
  }
  if (isContactPath(pathname)) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <ContactPage />
        </div>
      </Suspense></>
    )
  }
  if (isUpdatesPath(pathname)) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <UpdatesPage />
        </div>
      </Suspense></>
    )
  }
  if (updateId) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <UpdateDetailPage updateId={updateId} />
        </div>
      </Suspense></>
    )
  }
  if (isMyPagePath(pathname)) {
    return (
      <Suspense
        fallback={(
          <main className="my-page-route-loading" role="status" aria-label={t.loading}>
            <span className="my-page-route-loading__spinner" aria-hidden="true" />
            <span>{t.loading}</span>
          </main>
        )}
      >
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
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <PricingReviewPage />
        </div>
      </Suspense></>
    )
  }
  if (legalKind) {
    return (
      <>{metadata}<Suspense fallback={null}>
        <div key={pathname} className="route-enter route-enter--contact">
          <PublicLegalPage kind={legalKind} />
        </div>
      </Suspense></>
    )
  }
  return <>{metadata}<CalculatorApp /></>
}

function App() {
  const { recoveryMode } = useAuth()
  return (
    <DisclaimerProvider>
      <GoogleConsentProvider>
        {recoveryMode ? (
          <Suspense fallback={null}>
            <ResetPasswordScreen />
          </Suspense>
        ) : (
          <AppRouter />
        )}
      </GoogleConsentProvider>
    </DisclaimerProvider>
  )
}

export default App
