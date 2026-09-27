import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BILLING_PATH, REFUND_POLICY_PATH, TERMS_PATH, localizedPublicPath } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import {
  previewSubscriptionToYearly,
  switchSubscriptionToYearly,
  type SubscriptionSwitchPreview,
} from '../../db/billing'
import { useNavigate } from '../../hooks/usePathname'
import { useLanguage } from '../../i18n'
import '../../styles/pages.css'

type SwitchState = 'loading' | 'ready' | 'already' | 'success' | 'error'

const ZERO_DECIMAL_CURRENCIES = new Set(['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'])

function formatDate(iso: string, lang: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatBillingAmount(amount: string | null, currencyCode: string | null, lang: string): string | null {
  if (!amount || !currencyCode) return null
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return null
  const currency = currencyCode.toUpperCase()
  const divisor = ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2,
  }).format(numeric / divisor)
}

export function BillingYearlySwitchPage() {
  const { t, locale } = useLanguage()
  const { user, loading: authLoading, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const copy = t.myPage.billing
  const page = copy.page
  const billingHref = localizedPublicPath(BILLING_PATH, locale)
  const [state, setState] = useState<SwitchState>('loading')
  const [preview, setPreview] = useState<SubscriptionSwitchPreview | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [acceptedPreview, setAcceptedPreview] = useState<SubscriptionSwitchPreview | null>(null)
  const submitting = useRef(false)

  const mapSwitchYearlyError = useCallback((error: string) => {
    switch (error) {
      case 'billing_not_configured':
      case 'not_configured':
        return copy.notConfigured
      case 'missing_access_token':
      case 'invalid_access_token':
        return page.switchYearlyLoginRequired
      case 'no_subscription':
        return page.switchYearlyNoSubscription
      case 'subscription_not_active':
        return page.switchYearlyInactive
      case 'unsupported_current_plan':
        return page.switchYearlyUnsupportedPlan
      case 'subscription_lookup_failed':
        return page.switchYearlyLookupFailed
      case 'subscription_preview_failed':
        return page.switchYearlyPreviewFailed
      case 'subscription_update_failed':
        return page.switchYearlyUpdateFailed
      case 'subscription_payload_missing':
      case 'sync_failed':
        return page.switchYearlySyncFailed
      case 'network_error':
      case 'request_failed':
        return page.switchYearlyNetworkError
      default:
        return copy.checkoutError
    }
  }, [copy.checkoutError, copy.notConfigured, page])

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    let cancelled = false
    void previewSubscriptionToYearly().then((result) => {
      if (cancelled) return
      if (result.error) {
        setState('error')
        setMessage(mapSwitchYearlyError(result.error))
        return
      }
      if (result.preview?.action === 'already_yearly') {
        setState('already')
        setPreview(result.preview)
        setMessage(page.switchYearlyAlready)
        return
      }
      setPreview(result.preview)
      setState('ready')
    })

    return () => {
      cancelled = true
    }
  }, [authLoading, mapSwitchYearlyError, page.switchYearlyAlready, user])

  const immediateAmount = useMemo(
    () => formatBillingAmount(preview?.amount ?? null, preview?.currencyCode ?? null, t.lang),
    [preview?.amount, preview?.currencyCode, t.lang],
  )
  const recurringAmount = useMemo(
    () => formatBillingAmount(preview?.recurringAmount ?? null, preview?.currencyCode ?? null, t.lang),
    [preview?.currencyCode, preview?.recurringAmount, t.lang],
  )
  const nextBilling = preview?.nextBilledAt ? formatDate(preview.nextBilledAt, t.lang) : null
  const signedOut = !authLoading && !user
  const visibleState: SwitchState = signedOut ? 'error' : state
  const visibleMessage = signedOut ? page.switchYearlyLoginRequired : message
  const termsAccepted = preview !== null && acceptedPreview === preview
  const canConfirm = visibleState === 'ready' && !authLoading && !!user
    && immediateAmount !== null && recurringAmount !== null && nextBilling !== null
    && termsAccepted && !busy

  const confirmSwitch = useCallback(async () => {
    if (!canConfirm || submitting.current) return
    submitting.current = true
    setBusy(true)
    setMessage(null)
    const result = await switchSubscriptionToYearly()
    if (result.error) {
      submitting.current = false
      setBusy(false)
      setState('error')
      setMessage(mapSwitchYearlyError(result.error))
      return
    }
    await refreshSubscription()
    submitting.current = false
    setBusy(false)
    setState(result.action === 'already_yearly' ? 'already' : 'success')
    setMessage(
      result.action === 'already_yearly'
        ? page.switchYearlyAlready
        : page.switchYearlySuccess,
    )
  }, [
    canConfirm,
    mapSwitchYearlyError,
    page.switchYearlyAlready,
    page.switchYearlySuccess,
    refreshSubscription,
  ])

  const showAmounts = visibleState === 'ready' || visibleState === 'success'

  return (
    <main className="billing-switch-page" aria-labelledby="billing-switch-title">
      <section className="billing-switch-card">
        <div className="billing-switch-card__brand">
          <img src="/footer-brand-mark.svg" width="22" height="22" alt="" />
          <span>LiqGuard</span>
        </div>

        <header className="billing-switch-card__header">
          <h1 id="billing-switch-title">{page.switchYearlyPreviewTitle}</h1>
          <p>{page.switchYearlyPlanChange}</p>
        </header>

        {visibleState === 'loading' && (
          <div className="billing-switch-loading" role="status">
            <span className="my-page-route-loading__spinner" aria-hidden="true" />
            <span>{page.switchYearlyPreviewBusy}</span>
          </div>
        )}

        {showAmounts && (
          <div className="billing-switch-receipt">
            <dl className="billing-switch-summary">
              <div>
                <dt>{page.switchYearlyPreviewRecurringAmount}</dt>
                <dd>{recurringAmount ?? page.summaryPending}</dd>
              </div>
              <div>
                <dt>{page.switchYearlyPreviewNextBilling}</dt>
                <dd>{nextBilling ?? page.summaryPending}</dd>
              </div>
              <div className="billing-switch-summary__primary">
                <dt>{page.switchYearlyPreviewImmediateAmount}</dt>
                <dd>{immediateAmount ?? page.summaryPending}</dd>
              </div>
            </dl>
            <p className="billing-switch-receipt__note">
              {immediateAmount === null ? page.switchYearlyPreviewNoAmount : page.switchYearlyCreditNote}
            </p>
          </div>
        )}

        {visibleState === 'ready' && (
          <div className="billing-switch-confirmation">
            <div className="billing-switch-confirmation__notice" id="billing-switch-payment-notice">
              <p>{page.switchYearlyPreviewBody}</p>
              <p>{page.switchYearlyRenewalNote}</p>
            </div>
            <label className="billing-switch-consent">
              <input
                type="checkbox"
                checked={termsAccepted}
                disabled={busy}
                onChange={(event) => setAcceptedPreview(event.target.checked ? preview : null)}
                aria-describedby="billing-switch-payment-notice"
              />
              <span>{page.switchYearlyConsent}</span>
            </label>
            <div className="billing-switch-policy-links">
              <a href={localizedPublicPath(TERMS_PATH, locale)} target="_blank" rel="noopener noreferrer">
                {page.switchYearlyTermsLink}
              </a>
              <a href={localizedPublicPath(REFUND_POLICY_PATH, locale)} target="_blank" rel="noopener noreferrer">
                {page.switchYearlyRefundLink}
              </a>
              <a href="https://www.paddle.com/legal/buyer-terms" target="_blank" rel="noopener noreferrer">
                {page.switchYearlyBuyerTermsLink}
              </a>
            </div>
          </div>
        )}

        {visibleMessage && (
          <p className={`billing-switch-message billing-switch-message--${visibleState}`} role="status">
            {visibleMessage}
          </p>
        )}

        <div className="billing-switch-actions">
          {visibleState === 'ready' && (
            <button
              type="button"
              className="billing-switch-actions__primary"
              disabled={!canConfirm}
              onClick={() => void confirmSwitch()}
            >
              {busy ? page.switchYearlyBusy : immediateAmount && Number(preview?.amount) > 0
                ? page.switchYearlyPayConfirm.replace('{amount}', immediateAmount)
                : page.switchYearlyPreviewConfirm}
            </button>
          )}
          {visibleState === 'success' && (
            <button
              type="button"
              className="billing-switch-actions__primary"
              onClick={() => navigate(billingHref)}
            >
              {page.viewSubscription}
            </button>
          )}
          {visibleState !== 'success' && (
            <button
              type="button"
              className="billing-switch-actions__secondary"
              disabled={busy}
              onClick={() => navigate(billingHref)}
            >
              {page.switchYearlyPreviewCancel}
            </button>
          )}
        </div>
        <p className="billing-switch-card__processor">{page.switchYearlyPaymentProvider}</p>
      </section>
    </main>
  )
}
