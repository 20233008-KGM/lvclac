import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { openBillingPortal, startCheckout, type BillingPlan } from '../../db/billing'

type BusyState = BillingPlan | 'portal' | null

/** 결제 에러 코드를 사용자 문구로 매핑. */
function useCheckoutError() {
  const { t } = useLanguage()
  const copy = t.myPage.billing
  return (error: string) => (error === 'not_configured' ? copy.notConfigured : copy.checkoutError)
}

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

/**
 * 마이페이지 구독 패널. Free 사용자는 플랜 선택 → Stripe Checkout,
 * Pro 사용자는 Customer Portal로 구독을 관리한다. 자체적으로 useAuth를 쓰므로
 * MyPageView(순수 뷰)에는 노드로 주입된다(devResetPanel과 동일 패턴).
 */
export function BillingPanel() {
  const { t } = useLanguage()
  const copy = t.myPage.billing
  const { isPro, subscription, refreshSubscription } = useAuth()
  const [busy, setBusy] = useState<BusyState>(null)
  // 리다이렉트 복귀 메시지는 최초 렌더에서 URL로부터 초기화(effect 내 setState 회피).
  const [message, setMessage] = useState<string | null>(() => {
    const checkout = readCheckoutParam()
    if (checkout === 'success') return copy.checkoutSuccess
    if (checkout === 'cancel') return copy.checkoutCanceled
    return null
  })
  const mapError = useCheckoutError()

  // 결제 복귀 시 구독 상태를 다시 읽고, URL의 ?checkout= 흔적을 정리한다(부수효과만).
  useEffect(() => {
    const checkout = readCheckoutParam()
    if (!checkout) return
    if (checkout === 'success') void refreshSubscription()
    const params = new URLSearchParams(window.location.search)
    params.delete('checkout')
    const query = params.toString()
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}`,
    )
  }, [refreshSubscription])

  const handleCheckout = useCallback(
    async (plan: BillingPlan) => {
      setBusy(plan)
      setMessage(null)
      const error = await startCheckout(plan)
      // 성공 시 브라우저가 Stripe로 리다이렉트되어 아래는 실행되지 않음
      if (error) {
        setBusy(null)
        setMessage(mapError(error))
      }
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

  const status = subscription?.status
  const badge =
    status === 'trialing'
      ? copy.statusTrial
      : isPro
        ? copy.statusPro
        : status === 'past_due'
          ? copy.statusPastDue
          : copy.statusFree

  return (
    <section
      id="my-page-plan"
      className="my-page-panel"
      aria-labelledby="my-page-plan-title"
    >
      <div className="my-page-panel-head">
        <h2 id="my-page-plan-title">{t.myPage.planTitle}</h2>
        <span
          className={`my-page-badge${isPro ? '' : ' my-page-badge--muted'}`}
        >
          {badge}
        </span>
      </div>

      {isPro ? (
        <div className="my-page-billing">
          <p className="my-page-billing-headline">{copy.proHeadline}</p>
          <p>{copy.proBody}</p>
          {subscription?.currentPeriodEnd && (
            <p className="my-page-field-help">
              {copy.renewsOn.replace('{date}', formatDate(subscription.currentPeriodEnd, t.lang))}
            </p>
          )}
          <div className="my-page-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy !== null}
              onClick={() => void handleManage()}
            >
              {busy === 'portal' ? copy.redirecting : copy.manageAction}
            </button>
          </div>
        </div>
      ) : (
        <div className="my-page-billing">
          <p className="my-page-billing-headline">{copy.freeHeadline}</p>
          <p>{copy.freeBody}</p>
          <div className="my-page-plans">
            <PlanCard
              name={copy.monthlyName}
              price={copy.monthlyPrice}
              action={copy.choosePlan}
              busyLabel={copy.redirecting}
              busy={busy === 'monthly'}
              disabled={busy !== null}
              onSelect={() => void handleCheckout('monthly')}
            />
            <PlanCard
              name={copy.yearlyName}
              price={copy.yearlyPrice}
              note={copy.yearlyNote}
              action={copy.choosePlan}
              busyLabel={copy.redirecting}
              busy={busy === 'yearly'}
              disabled={busy !== null}
              highlighted
              onSelect={() => void handleCheckout('yearly')}
            />
          </div>
          <p className="my-page-field-help">{copy.taxNote}</p>
        </div>
      )}

      {message && (
        <p className="my-page-form-message" role="status">
          {message}
        </p>
      )}
    </section>
  )
}

interface PlanCardProps {
  name: string
  price: string
  note?: string
  action: string
  busyLabel: string
  busy: boolean
  disabled: boolean
  highlighted?: boolean
  onSelect: () => void
}

function PlanCard({
  name,
  price,
  note,
  action,
  busyLabel,
  busy,
  disabled,
  highlighted,
  onSelect,
}: PlanCardProps) {
  return (
    <div className={`my-page-plan-card${highlighted ? ' is-highlighted' : ''}`}>
      <div className="my-page-plan-card-head">
        <span className="my-page-plan-card-name">{name}</span>
        <span className="my-page-plan-card-price">{price}</span>
      </div>
      {note && <span className="my-page-plan-card-note">{note}</span>}
      <button
        type="button"
        className={`btn ${highlighted ? 'btn-primary' : 'btn-ghost'}`}
        disabled={disabled}
        onClick={onSelect}
      >
        {busy ? busyLabel : action}
      </button>
    </div>
  )
}
