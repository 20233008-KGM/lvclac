import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { useNavigate } from '../../hooks/usePathname'
import { openBillingPortal, startCheckout, type BillingPlan } from '../../db/billing'
import '../../styles/pages.css'

type BusyState = BillingPlan | 'portal' | null
type BillingView = 'free' | 'pro' | 'failed' | 'success'

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

function ReceiptIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 9.5h19" />
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
 * 구독 결제 전용 페이지(/billing). useAuth + URL 파라미터에서 파생된 4개 상태를 분기한다.
 * - free    : 플랜 선택
 * - pro     : 구독 관리(활성 구독)
 * - failed  : 결제 실패 배너 + 플랜 선택(status === 'past_due')
 * - success : 결제 완료(?checkout=success)
 * 결제 로직은 코드베이스의 startCheckout / openBillingPortal을 그대로 재사용한다.
 */
export function BillingPage() {
  const { t } = useLanguage()
  const copy = t.myPage.billing
  const page = copy.page
  const { isPro, subscription, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const mapError = useCheckoutError()

  const [busy, setBusy] = useState<BusyState>(null)
  const [message, setMessage] = useState<string | null>(() =>
    readCheckoutParam() === 'cancel' ? copy.checkoutCanceled : null,
  )
  // 배너 닫기(결제 실패에서 "다시 시도")와 결제 완료에서 "구독 관리 보기" 전환용 로컬 상태.
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [leftSuccess, setLeftSuccess] = useState(false)

  // ?checkout= 값은 최초 렌더에서 한 번만 확정한다(아래 effect가 URL을 정리해도 뷰가 흔들리지 않도록).
  const checkoutParam = useMemo(() => readCheckoutParam(), [])

  // 결제 복귀 시 구독 상태를 다시 읽고, URL의 ?checkout= 흔적을 정리한다(부수효과만).
  useEffect(() => {
    if (!checkoutParam) return
    if (checkoutParam === 'success') void refreshSubscription()
    const params = new URLSearchParams(window.location.search)
    params.delete('checkout')
    const query = params.toString()
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )
  }, [checkoutParam, refreshSubscription])

  const view: BillingView =
    checkoutParam === 'success' && !leftSuccess
      ? 'success'
      : isPro
        ? 'pro'
        : subscription?.status === 'past_due'
          ? 'failed'
          : 'free'

  const handleCheckout = useCallback(
    async (plan: BillingPlan) => {
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
    [mapError],
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

  const busyAny = busy !== null
  const renewsLabel = subscription?.currentPeriodEnd
    ? copy.renewsOn.replace('{date}', formatDate(subscription.currentPeriodEnd, t.lang))
    : null

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

  const proManage = (
    <section className="my-page-panel billing-panel" aria-labelledby="billing-manage-title">
      <div className="billing-panel-head">
        <h2 id="billing-manage-title">{page.manageTitle}</h2>
      </div>

      <div className="billing-current">
        <div className="billing-current__info">
          <div className="billing-current__name-row">
            <span className="billing-current__name">{page.proPlanName}</span>
            <span className="billing-current__badge">{page.activeBadge}</span>
          </div>
          <p className="billing-current__body">{copy.proBody}</p>
          {renewsLabel && <p className="billing-current__renews">{renewsLabel}</p>}
        </div>
        <button
          type="button"
          className="btn btn-primary billing-current__manage"
          disabled={busyAny}
          onClick={() => void handleManage()}
        >
          {busy === 'portal' ? copy.redirecting : page.portalAction}
        </button>
      </div>

      <div className="billing-actions">
        <button
          type="button"
          className="billing-action"
          disabled={busyAny}
          onClick={() => void handleManage()}
        >
          <span className="billing-action__icon" aria-hidden="true">
            <ReceiptIcon />
          </span>
          <span>{page.receiptsAction}</span>
        </button>
        <button
          type="button"
          className="billing-action"
          disabled={busyAny}
          onClick={() => void handleManage()}
        >
          <span className="billing-action__icon" aria-hidden="true">
            <CardIcon />
          </span>
          <span>{page.paymentMethodAction}</span>
        </button>
      </div>

      {benefits(page.benefitsTitleActive)}

      <div className="billing-cancel-row">
        <p className="billing-cancel-note">{page.cancelNote}</p>
        <button
          type="button"
          className="billing-cancel-btn"
          disabled={busyAny}
          onClick={() => void handleManage()}
        >
          {page.cancelAction}
        </button>
      </div>
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
        <button type="button" className="btn btn-primary billing-cta__primary" onClick={() => navigate('/')}>
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

  return (
    <div className="my-page-shell billing-shell">
      <div className="my-page billing-page">
        <header className="my-page-header billing-page-header">
          <a className="my-page-back" href="/">
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

        {view === 'success' ? success : view === 'pro' ? proManage : planSelect}

        {message && (
          <p className="my-page-form-message billing-message" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
