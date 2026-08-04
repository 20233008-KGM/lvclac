import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { controlSandboxSubscription } from '../db/billing'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { shouldShowSandboxSubscriptionReset } from './sandboxSubscriptionResetVisibility'

/**
 * Paddle Sandbox에서 현재 로그인 사용자의 테스트 구독만 즉시 종료하는 개발용 고정 도구.
 * 실제 권한 경계는 서버가 Sandbox 환경과 인증 사용자 소유 구독을 다시 확인한다.
 */
export function SandboxSubscriptionReset() {
  const { user, subscription, refreshSubscription } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const copy = t.myPage.billing.page
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visible = shouldShowSandboxSubscriptionReset(
    import.meta.env.VITE_PADDLE_ENV,
    user?.id,
    subscription?.status,
  )

  const cancelNow = useCallback(async () => {
    setBusy(true)
    setError(null)
    const requestError = await controlSandboxSubscription('cancel_now')
    if (requestError) {
      setBusy(false)
      setError(copy.sandboxError)
      return
    }

    await refreshSubscription()
    setBusy(false)
    setConfirming(false)
    navigate('/billing')
  }, [copy.sandboxError, navigate, refreshSubscription])

  if (!visible) return null

  return (
    <div className="sandbox-subscription-reset">
      <button
        type="button"
        className="sandbox-subscription-reset__trigger"
        aria-expanded={confirming}
        disabled={busy}
        onClick={() => {
          setError(null)
          setConfirming((value) => !value)
        }}
      >
        {busy ? copy.sandboxBusy : copy.sandboxCancelNowAction}
      </button>

      {confirming && (
        <div
          className="sandbox-subscription-reset__confirm"
          role="alertdialog"
          aria-label={copy.sandboxCancelNowAction}
        >
          <p>{copy.sandboxCancelConfirm}</p>
          <div className="sandbox-subscription-reset__actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy}
              onClick={() => void cancelNow()}
            >
              {busy ? copy.sandboxBusy : copy.sandboxCancelConfirmAction}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              {copy.sandboxCancelDismissAction}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="sandbox-subscription-reset__error" role="status">
          {error}
        </p>
      )}
    </div>
  )
}
