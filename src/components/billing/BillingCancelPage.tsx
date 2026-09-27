import { useEffect, useRef, useState } from 'react'
import { BILLING_PATH, localizedPublicPath } from '../../config/routes'
import { useAuth } from '../../context/AuthContext'
import { cancelSubscription, fetchSubscriptionSummary, type SubscriptionCancellation, type SubscriptionSummary } from '../../db/billing'
import { useNavigate } from '../../hooks/usePathname'
import { useLanguage } from '../../i18n'
import { isCancellationScheduled, subscriptionAccessEnd } from './subscriptionPresentation'
import '../../styles/pages.css'
import './billingCancel.css'

export function BillingCancelPage() {
  const { t, locale } = useLanguage()
  const { user, loading: authLoading, refreshSubscription } = useAuth()
  const navigate = useNavigate()
  const page = t.myPage.billing.page
  const copy = page.cancellation
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null)
  const [receipt, setReceipt] = useState<SubscriptionCancellation | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelAttempted, setCancelAttempted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const submitting = useRef(false)
  const userId = user?.id

  useEffect(() => {
    if (authLoading || !userId) return
    let disposed = false
    void fetchSubscriptionSummary().then(result => {
      if (disposed) return
      setSummary(result.data)
      setError(result.error)
      setLoading(false)
    }).catch(() => {
      if (!disposed) { setError('request_failed'); setLoading(false) }
    })
    return () => { disposed = true }
  }, [authLoading, userId, attempt])

  const ended = receipt?.status === 'canceled' || summary?.status === 'canceled'
  const scheduled = !!receipt?.effectiveAt || isCancellationScheduled(summary)
  const complete = ended || scheduled
  const effectiveAt = receipt?.effectiveAt ?? subscriptionAccessEnd(summary)
  const endDate = effectiveAt && !Number.isNaN(Date.parse(effectiveAt))
    ? new Date(effectiveAt).toLocaleDateString(t.lang, { year: 'numeric', month: 'long', day: 'numeric' }) : null
  const configurationMissing = summary?.cancellationAvailable === false || error === 'billing_not_configured'
  const ready = !!user && !authLoading && !loading && !error && !!summary && !!endDate
    && !configurationMissing
    && (summary.status === 'active' || summary.status === 'trialing')
    && !summary.scheduledChangeAction && !complete
  const signedOut = !authLoading && !user
  const waiting = !signedOut && (authLoading || loading)
  const errorText = signedOut ? copy.loginRequired
    : !waiting && !complete && configurationMissing ? copy.configurationRequired
    : error ? (error === 'subscription_not_active' || error === 'subscription_change_scheduled' ? copy.inactive
      : cancelAttempted ? copy.failed : copy.unavailable)
    : !waiting && !complete && !ready ? copy.inactive : null

  async function confirmCancellation() {
    if (!ready || submitting.current) return
    submitting.current = true
    setBusy(true)
    setCancelAttempted(true)
    try {
      const result = await cancelSubscription()
      if (result.error !== null) { setError(result.error); return }
      setReceipt(result.data)
      // The receipt is authoritative even if the subsequent app refresh fails.
      await refreshSubscription().catch(() => undefined)
    } catch {
      setError('subscription_cancel_failed')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  function reload() {
    setLoading(true)
    setError(null)
    setCancelAttempted(false)
    setAttempt(value => value + 1)
  }

  return (
    <main className="billing-switch-page billing-cancel-page" aria-labelledby="billing-cancel-heading">
      <section className="billing-switch-card billing-cancel-card">
        <div className="billing-switch-card__brand">
          <img src="/favicon.svg" width="22" height="22" alt="" /><span>LiqGuard</span>
        </div>
        <header className="billing-switch-card__header">
          <h1 id="billing-cancel-heading">{scheduled ? copy.successTitle : page.cancelAction}</h1>
          <p>{ended ? copy.endedBody : scheduled ? copy.successBody : copy.subtitle}</p>
        </header>
        {waiting && <div className="billing-switch-loading" role="status">
          <span className="my-page-route-loading__spinner" aria-hidden="true" />{copy.loading}
        </div>}
        {!waiting && !signedOut && summary && !ended && (
          <dl className="billing-switch-summary billing-cancel-summary">
            <div><dt>{copy.planLabel}</dt><dd>LiqGuard Pro{summary.plan
              ? ` · ${summary.plan === 'monthly' ? page.management.monthly : page.management.yearly}` : ''}</dd></div>
            <div><dt>{copy.renewalLabel}</dt><dd>{copy.renewalOff}</dd></div>
            <div className="billing-switch-summary__primary"><dt>{copy.endsLabel}</dt><dd>{endDate ?? page.summaryPending}</dd></div>
          </dl>
        )}
        <div className="billing-switch-checkout">
          {!waiting && !signedOut && !ended && (ready || scheduled) && (
            <div className="billing-switch-confirmation billing-cancel-notice">
              <p>{copy.afterEnd}</p><p>{copy.noRefund}</p>
            </div>
          )}
          {errorText && <p className="billing-switch-message billing-switch-message--error" role="alert">{errorText}</p>}
          {receipt && <p className="billing-switch-message billing-switch-message--success" role="status">
            {receipt.syncPending ? copy.syncPending : ended ? copy.endedBody : page.cancelScheduledBody}
          </p>}
          <div className="billing-switch-actions">
            {ready && <button type="button" className="billing-switch-actions__primary billing-cancel-confirm"
              disabled={busy} onClick={() => void confirmCancellation()}>{busy ? copy.busy : copy.confirm}</button>}
            {!signedOut && error && !waiting && !configurationMissing && <button type="button" className="billing-switch-actions__primary" onClick={reload}>{copy.retry}</button>}
            <button type="button" className={complete ? 'billing-switch-actions__primary' : 'billing-switch-actions__secondary'}
              disabled={busy} onClick={() => navigate(localizedPublicPath(BILLING_PATH, locale))}>
              {ready ? copy.keep : copy.back}
            </button>
          </div>
        </div>
        <p className="billing-switch-card__processor">{page.management.provider}</p>
      </section>
    </main>
  )
}
