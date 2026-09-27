import { useEffect, useState, type ReactNode } from 'react'
import { REFUND_POLICY_PATH, localizedPublicPath } from '../../config/routes'
import { fetchSubscriptionSummary, type SubscriptionRecord, type SubscriptionSummary } from '../../db/billing'
import { useLanguage } from '../../i18n'
import { isCancellationScheduled, subscriptionAccessEnd } from './subscriptionPresentation'
import './billingManagement.css'

function formatAmount(amount: string | null, currency: string | null, lang: string): string | null {
  if (amount === null || !/^\d+$/.test(amount) || !currency || !/^[A-Z]{3}$/.test(currency)) return null
  const value = Number(amount)
  if (!Number.isSafeInteger(value)) return null
  try {
    const formatter = new Intl.NumberFormat(lang, { style: 'currency', currency })
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(value / 10 ** digits)
  } catch {
    return null
  }
}

function formatDate(value: string | null | undefined, lang: string): string | null {
  if (!value || Number.isNaN(Date.parse(value))) return null
  return new Date(value).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })
}

interface Props {
  subscription: SubscriptionRecord | null
  homeHref: string
  busy: boolean
  portalBusy: boolean
  message: string | null
  onManage: () => void
  onSwitchYearly: () => void
  children?: ReactNode
}

export function BillingManagement({ subscription, homeHref, busy, portalBusy, message, onManage, onSwitchYearly, children }: Props) {
  const { t, locale } = useLanguage()
  const copy = t.myPage.billing
  const page = copy.page
  const labels = page.management
  const manual = subscription?.provider === 'manual'
  const [result, setResult] = useState<{ data: SubscriptionSummary | null; loaded: boolean }>({ data: null, loaded: false })

  useEffect(() => {
    if (manual) return
    let request = 0
    const load = () => {
      const current = ++request
      void fetchSubscriptionSummary().then(response => {
        if (current === request) setResult({ data: response.data, loaded: true })
      }).catch(() => {
        if (current === request) setResult({ data: null, loaded: true })
      })
    }
    load()
    window.addEventListener('pageshow', load)
    window.addEventListener('focus', load)
    return () => {
      request++
      window.removeEventListener('pageshow', load)
      window.removeEventListener('focus', load)
    }
  }, [manual])

  const summary = result.data
  const current = summary ?? subscription
  const cancelScheduled = isCancellationScheduled(current)
  const ended = current?.status === 'canceled'
  const paused = current?.status === 'paused'
  const pastDue = current?.status === 'past_due' || current?.status === 'unpaid'
  const statusLabel = cancelScheduled ? page.cancelScheduledBadge : ended ? labels.ended
    : paused ? labels.paused : pastDue ? copy.statusPastDue
    : current?.status === 'trialing' ? labels.trial : page.activeBadge
  const amount = formatAmount(summary?.recurringAmount ?? null, summary?.currencyCode ?? null, t.lang)
  const pending = !manual && !result.loaded
  const unavailable = pending ? labels.loading : labels.unavailable
  const period = summary?.plan === 'monthly' ? labels.monthly : summary?.plan === 'yearly' ? labels.yearly : unavailable
  const unit = summary?.plan === 'monthly' ? page.perMonth : summary?.plan === 'yearly' ? page.perYear : null
  const endDate = formatDate(subscriptionAccessEnd(current), t.lang)
  // A missing next_billed_at is not a confirmed renewal. Only the DB-only fallback uses its period end.
  const nextDate = formatDate(summary ? summary.nextBilledAt : subscription?.currentPeriodEnd, t.lang)
  const date = cancelScheduled || manual || ended ? endDate : nextDate
  const incomplete = !manual && result.loaded && (!summary || !amount || !summary.plan)

  return (
    <div className="billing-management-shell">
      <header className="billing-management-topbar">
        <a className="billing-management-brand" href={homeHref}>LiqGuard</a>
        <a className="billing-management-back" href={homeHref}>{page.backToCalculator}</a>
      </header>
      <main className="billing-management">
        <header className="billing-management-heading">
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </header>
        <section className="billing-management-plan" aria-labelledby="billing-plan-name">
          <div className="billing-management-plan__head">
            <div className="billing-management-plan__name">
              <h2 id="billing-plan-name">LiqGuard {page.proPlanName}</h2>
              <span className={`billing-management-status${cancelScheduled || paused || pastDue ? ' is-attention' : ended ? ' is-ended' : ''}`}>
                <span aria-hidden="true" />{statusLabel}
              </span>
            </div>
            {summary?.canSwitchYearly && !manual && (
              <button type="button" className="billing-management-button" disabled={busy} onClick={onSwitchYearly}>{page.switchYearlyAction}</button>
            )}
          </div>
          <dl className="billing-management-facts" aria-busy={pending}>
            <div><dt>{labels.priceLabel}</dt><dd className={amount ? 'billing-management-amount' : undefined}>
              {manual ? labels.manual : amount ?? unavailable}
              {amount && unit && <span>{unit}</span>}
            </dd></div>
            <div><dt>{labels.cycleLabel}</dt><dd>{manual ? labels.noRenewal : period}</dd></div>
            <div><dt>{cancelScheduled || manual || ended ? labels.endsLabel : labels.renewsLabel}</dt>
              <dd>{date ?? (manual || ended || paused ? '—' : unavailable)}</dd></div>
          </dl>
          {manual ? <p className="billing-management-note">{labels.manualBody}</p>
            : cancelScheduled ? <p className="billing-management-note">{page.cancelScheduledBody} {page.noFurtherBilling}</p>
            : amount ? <p className="billing-management-note">{labels.amountNote}</p> : null}
          {incomplete && <p className="billing-management-note" role="status">{labels.unavailableBody}</p>}
          <details className="billing-management-benefits">
            <summary>{labels.benefits}</summary>
            <ul>{page.benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
            <p>{copy.notePolicy}</p>
          </details>
        </section>
        {!manual && <>
          <section className="billing-management-row" aria-labelledby="billing-payments-title">
            <div><h2 id="billing-payments-title">{labels.paymentsTitle}</h2><p>{labels.paymentsBody}</p></div>
            <button type="button" className="billing-management-button billing-management-button--primary" disabled={busy} onClick={onManage}>
              {portalBusy ? copy.redirecting : labels.portalAction}<span aria-hidden="true">↗</span>
            </button>
          </section>
          {!ended && <section className="billing-management-row billing-management-row--cancel" aria-labelledby="billing-cancel-title">
            <div><h2 id="billing-cancel-title">{cancelScheduled ? page.manageCancellationAction : labels.cancelTitle}</h2>
              <p>{cancelScheduled ? page.noFurtherBilling : page.cancelNote}</p></div>
            <button type="button" className="billing-management-link" disabled={busy} onClick={onManage}>
              {cancelScheduled ? page.manageCancellationAction : page.cancelAction}<span aria-hidden="true">↗</span>
            </button>
          </section>}
        </>}
        {message && <p className="billing-management-message" role="status">{message}</p>}
        {children}
        <footer className="billing-management-footer">
          {!manual && <span>{labels.provider}</span>}
          <a href={localizedPublicPath(REFUND_POLICY_PATH, locale)}>{page.switchYearlyRefundLink}</a>
        </footer>
      </main>
    </div>
  )
}
