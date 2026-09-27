import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { useNavigate } from '../../hooks/usePathname'
import { BILLING_YEARLY_SWITCH_PATH, localizedPublicPath } from '../../config/routes'
import { trackGoogleAdsConversion, trackLiqGuardEvent } from '../../lib/analytics'
import {
  controlSandboxSubscription,
  openBillingPortal,
  startCheckout,
  type BillingPlan,
} from '../../db/billing'
import { BillingUpgrade } from './BillingUpgrade'
import { BillingManagement } from './BillingManagement'
import { resolveBillingView } from './billingView'
import '../../styles/pages.css'

type BusyState = BillingPlan | 'portal' | 'sandbox-sync' | null
const CHECKOUT_REFRESH_DELAYS = [0, 750, 1500, 2500, 4000, 6000]

const AuthModal = lazy(() =>
  import('../auth/AuthModal').then((mod) => ({ default: mod.AuthModal })),
)

/** ISO 날짜 문자열을 현재 언어의 긴 날짜 형식으로. 파싱 실패 시 원문 반환. */
function formatDate(iso: string, lang: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** 결제 리다이렉트 복귀 파라미터(?checkout=)를 읽는다. */
function readCheckoutParam(): 'success' | 'cancel' | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('checkout')
  return value === 'success' || value === 'cancel' ? value : null
}

function readCheckoutPlanParam(): BillingPlan | null {
  if (typeof window === 'undefined') return null
  const value = new URLSearchParams(window.location.search).get('plan')
  return value === 'monthly' || value === 'yearly' ? value : null
}

/** 결제 에러 코드를 사용자 문구로 매핑. BillingPanel과 동일 규칙. */
function useCheckoutError() {
  const { t } = useLanguage()
  const copy = t.myPage.billing
  return (error: string) => (error === 'not_configured' ? copy.notConfigured : copy.checkoutError)
}

function CheckIcon() {
  return (
    <svg
      className="billing-benefit__check"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3L2 20h20L12 3z" />
      <path d="M12 10v4M12 17.5v.01" />
    </svg>
  )
}

function SuccessCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}

/**
 * 구독 결제 전용 페이지(/billing). useAuth + URL 파라미터에서 파생된 5개 상태를 분기한다.
 * - loading : 로그인 세션과 구독 상태 확인 중
 * - free    : 플랜 선택
 * - pro     : 구독 관리(활성 구독)
 * - failed  : 결제 실패 배너 + 플랜 선택(status === 'past_due')
 * - success : 결제 완료(?checkout=success)
 * 결제 로직은 코드베이스의 startCheckout / openBillingPortal을 그대로 재사용한다.
 */
export function BillingPage() {
  const { t, locale } = useLanguage()
  const loadingLabel = t.myPage.loadingBody
  const copy = t.myPage.billing
  const page = copy.page
  const homeHref = localizedPublicPath('/', locale)
  const yearlySwitchHref = localizedPublicPath(BILLING_YEARLY_SWITCH_PATH, locale)
  const { user, loading: authLoading, isPro, subscription, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const mapError = useCheckoutError()

  const [busy, setBusy] = useState<BusyState>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(() =>
    readCheckoutParam() === 'cancel' ? copy.checkoutCanceled : null,
  )
  // 배너 닫기(결제 실패에서 "다시 시도")와 결제 완료에서 "구독 관리 보기" 전환용 로컬 상태.
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [leftSuccess, setLeftSuccess] = useState(false)
  const [checkoutPending, setCheckoutPending] = useState(() => readCheckoutParam() === 'success')

  // Paddle Customer Portal에서 브라우저 뒤로가기로 돌아오면 bfcache가 busy 상태를 복원할 수 있다.
  useEffect(() => {
    const clearPortalBusy = () => {
      setBusy((current) => (current === 'portal' ? null : current))
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') clearPortalBusy()
    }

    window.addEventListener('pageshow', clearPortalBusy)
    window.addEventListener('focus', clearPortalBusy)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pageshow', clearPortalBusy)
      window.removeEventListener('focus', clearPortalBusy)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // ?checkout= 값은 최초 렌더에서 한 번만 확정한다(아래 effect가 URL을 정리해도 뷰가 흔들리지 않도록).
  const checkoutParam = useMemo(() => readCheckoutParam(), [])
  const checkoutPlan = useMemo(() => readCheckoutPlanParam(), [])

  // 결제 복귀 시 webhook/DB 반영이 늦을 수 있으므로 성공 화면을 유지한 채 재조회한다.
  useEffect(() => {
    if (!checkoutParam) return
    const params = new URLSearchParams(window.location.search)
    params.delete('checkout')
    params.delete('plan')
    const query = params.toString()
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )

    if (checkoutParam !== 'success') return

    const purchaseValue = checkoutPlan === 'yearly' ? 48 : checkoutPlan === 'monthly' ? 5 : undefined
    trackLiqGuardEvent('purchase_completed', {
      plan: checkoutPlan,
      provider: 'paddle',
    })
    trackGoogleAdsConversion('purchase', {
      value: purchaseValue,
      currency: purchaseValue == null ? undefined : 'USD',
    })

    let cancelled = false
    const timers: number[] = []
    CHECKOUT_REFRESH_DELAYS.forEach((delay, index) => {
      const timer = window.setTimeout(() => {
        void refreshSubscription().then(() => {
          if (cancelled) return
          if (index === CHECKOUT_REFRESH_DELAYS.length - 1) setCheckoutPending(false)
        })
      }, delay)
      timers.push(timer)
    })

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [checkoutParam, checkoutPlan, refreshSubscription])

  const view = resolveBillingView({
    authLoading,
    checkoutSucceeded: checkoutParam === 'success' && (!leftSuccess || (checkoutPending && !isPro)),
    isPro,
    subscriptionStatus: subscription?.status,
  })

  const handleCheckout = useCallback(
    async (plan: BillingPlan) => {
      if (!user) {
        setAuthModalOpen(true)
        return
      }
      setBusy(plan)
      setMessage(null)
      const error = await startCheckout(plan)
      if (error) {
        setBusy(null)
        setMessage(mapError(error))
        return
      }
      setBusy(null)
    },
    [mapError, user],
  )

  const handleManage = useCallback(async () => {
    setBusy('portal')
    setMessage(null)
    const error = await openBillingPortal()
    if (error) {
      setBusy(null)
      setMessage(mapError(error))
    }
  }, [mapError])

  const handleSwitchYearly = useCallback(async () => {
    setMessage(null)
    navigate(yearlySwitchHref)
  }, [navigate, yearlySwitchHref])

  const handleSandboxSync = useCallback(async () => {
    setBusy('sandbox-sync')
    setMessage(null)
    const error = await controlSandboxSubscription('sync')
    if (error) {
      setBusy(null)
      setMessage(page.sandboxError)
      return
    }
    await refreshSubscription()
    setBusy(null)
    setMessage(page.sandboxSyncSuccess)
  }, [page.sandboxError, page.sandboxSyncSuccess, refreshSubscription])

  const busyAny = busy !== null

  if (view === 'loading') {
    return (
      <main className="my-page-route-loading" role="status" aria-label={loadingLabel}>
        <span className="my-page-route-loading__spinner" aria-hidden="true" />
        <span>{loadingLabel}</span>
      </main>
    )
  }

  const showSandboxTools = user?.isAdmin === true && import.meta.env.VITE_PADDLE_ENV === 'sandbox'

  // 상태 배지: 상태에 따라 라벨·색을 달리한다.
  const statusVariant = view === 'failed' ? 'failed' : view === 'pro' || view === 'success' ? 'pro' : 'free'
  const statusLabel =
    statusVariant === 'failed' ? copy.statusPastDue : statusVariant === 'pro' ? copy.statusPro : copy.statusFree

  const benefits = (title: string) => (
    <div className="billing-benefits-section">
      <p className="billing-benefits-title">{title}</p>
      <ul className="billing-benefits">
        {page.benefits.map((benefit) => (
          <li key={benefit} className="billing-benefit">
            <CheckIcon />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <p className="billing-note-policy">* {copy.notePolicy}</p>
    </div>
  )

  const planSelect = (
    <section className="my-page-panel billing-panel" aria-labelledby="billing-plan-title">
      <div className="billing-panel-head">
        <h2 id="billing-plan-title">{page.planSelectTitle}</h2>
        <p>{copy.freeBody}</p>
      </div>

      <div className="my-page-plans">
        {/* 월간 */}
        <div className="my-page-plan-card billing-plan-card">
          <div className="billing-plan-card__head">
            <span className="my-page-plan-card-name">{copy.monthlyName}</span>
            <span className="billing-plan-card__code">{page.monthlyCode}</span>
          </div>
          <div className="billing-plan-card__price">
            <span className="billing-plan-card__amount">{page.monthlyAmount}</span>
            <span className="billing-plan-card__unit">{page.perMonth}</span>
          </div>
          <p className="billing-plan-card__desc">{page.monthlyDesc}</p>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busyAny}
            onClick={() => void handleCheckout('monthly')}
          >
            {busy === 'monthly' ? copy.redirecting : copy.choosePlan}
          </button>
        </div>

        {/* 연간 (하이라이트) */}
        <div className="my-page-plan-card is-highlighted billing-plan-card billing-plan-card--annual">
          <span className="billing-plan-card__badge">{page.yearlyBadge}</span>
          <div className="billing-plan-card__head">
            <span className="my-page-plan-card-name">{copy.yearlyName}</span>
            <span className="billing-plan-card__code billing-plan-card__code--accent">
              {page.yearlyCode}
            </span>
          </div>
          <div className="billing-plan-card__price">
            <span className="billing-plan-card__amount">{page.yearlyAmount}</span>
            <span className="billing-plan-card__unit">{page.perYear}</span>
            <span className="billing-plan-card__strike">{page.yearlyStrike}</span>
          </div>
          <p className="billing-plan-card__desc">{page.yearlyDesc}</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busyAny}
            onClick={() => void handleCheckout('yearly')}
          >
            {busy === 'yearly' ? copy.redirecting : copy.choosePlan}
          </button>
        </div>
      </div>

      {benefits(page.benefitsTitle)}

      <p className="my-page-field-help billing-tax-note">{copy.taxNote}</p>
    </section>
  )

  const success = (
    <section className="my-page-panel billing-panel billing-success" aria-labelledby="billing-success-title">
      <div className="billing-success__icon" aria-hidden="true">
        <SuccessCheck />
      </div>
      <h2 id="billing-success-title" className="billing-success__title">
        {page.successTitle}
      </h2>
      <p className="billing-success__body">{page.successBody}</p>

      <div className="billing-summary">
        <div className="billing-summary__row">
          <span className="billing-summary__label">{page.summaryPlan}</span>
          <span>{page.proPlanName}</span>
        </div>
        <div className="billing-summary__row">
          <span className="billing-summary__label">{page.summaryNextBilling}</span>
          <span>
            {subscription?.currentPeriodEnd
              ? formatDate(subscription.currentPeriodEnd, t.lang)
              : page.summaryPending}
          </span>
        </div>
      </div>

      <div className="billing-cta">
        <button
          type="button"
          className="btn btn-primary billing-cta__primary"
          onClick={() => navigate(homeHref)}
        >
          {page.goToCalculator}
        </button>
        <button
          type="button"
          className="btn btn-ghost billing-cta__ghost"
          onClick={() => setLeftSuccess(true)}
        >
          {page.viewSubscription}
        </button>
      </div>
    </section>
  )

  const showBanner = view === 'failed' && !bannerDismissed

  // free(업그레이드) 화면은 세로 스크롤 스냅 리디자인을 전폭으로 렌더한다.
  // 결제 실패·완료 화면은 기존 셸을 유지한다.
  if (view === 'free') {
    const checkoutBusy = busy === 'monthly' || busy === 'yearly' || busy === 'portal' ? busy : null
    return (
      <>
        <BillingUpgrade
          copy={copy}
          busy={checkoutBusy}
          message={message}
          homeHref={homeHref}
          onCheckout={(plan) => void handleCheckout(plan)}
        />
        {authModalOpen && (
          <Suspense fallback={null}>
            <AuthModal onClose={() => setAuthModalOpen(false)} />
          </Suspense>
        )}
      </>
    )
  }

  if (view === 'pro') {
    return (
      <BillingManagement
        key={`${user?.id}:${subscription?.provider}:${subscription?.status}:${subscription?.currentPeriodEnd}:${subscription?.scheduledChangeAction}:${subscription?.scheduledChangeEffectiveAt}`}
        subscription={subscription}
        homeHref={homeHref}
        busy={busyAny}
        portalBusy={busy === 'portal'}
        message={message}
        onManage={() => void handleManage()}
        onSwitchYearly={() => void handleSwitchYearly()}
      >
        {showSandboxTools && (
          <section className="billing-sandbox" aria-labelledby="billing-sandbox-title">
            <div className="billing-sandbox__copy">
              <p id="billing-sandbox-title" className="billing-sandbox__title">{page.sandboxTitle}</p>
              <p className="billing-sandbox__body">{page.sandboxBody}</p>
            </div>
            <div className="billing-sandbox__actions">
              <button type="button" className="btn btn-ghost billing-sandbox__button" disabled={busyAny} onClick={() => void handleSandboxSync()}>
                {busy === 'sandbox-sync' ? page.sandboxBusy : page.sandboxSyncAction}
              </button>
            </div>
          </section>
        )}
      </BillingManagement>
    )
  }

  return (
    <div className="my-page-shell billing-shell">
      <div className="my-page billing-page">
        <header className="my-page-header billing-page-header">
          <a className="my-page-back" href={homeHref}>
            {page.backToCalculator}
          </a>
          <div className="billing-hero">
            <div className="billing-hero__copy">
              <h1>{page.pageTitle}</h1>
              <p>{page.pageSubtitle}</p>
            </div>
            <div className="billing-hero__status">
              <span className="billing-hero__status-label">{page.statusLabel}</span>
              <span className={`billing-status billing-status--${statusVariant}`}>
                <span className="billing-status__dot" aria-hidden="true" />
                {statusLabel}
              </span>
            </div>
          </div>
        </header>

        {showBanner && (
          <div className="billing-banner" role="alert">
            <span className="billing-banner__icon" aria-hidden="true">
              <WarningIcon />
            </span>
            <div className="billing-banner__body">
              <p className="billing-banner__title">{page.failedTitle}</p>
              <p className="billing-banner__text">{page.failedBody}</p>
            </div>
            <button
              type="button"
              className="btn btn-danger billing-banner__retry"
              onClick={() => setBannerDismissed(true)}
            >
              {page.retryAction}
            </button>
          </div>
        )}

        {view === 'success' ? success : planSelect}

        {message && (
          <p className="my-page-form-message billing-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
