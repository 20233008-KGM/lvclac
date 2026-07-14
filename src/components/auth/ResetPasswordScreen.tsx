import { useState, type FormEvent } from 'react'
import { validateNewPassword, validatePasswordConfirmation } from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'
import '../../styles/auth-dialog.css'

/**
 * 재설정 링크로 진입해 복구 세션(PASSWORD_RECOVERY)이 잡힌 상태에서 표시되는
 * 전체 화면. 로그인 모달은 세션이 잡히면 자동으로 닫히므로, 새 비밀번호 설정은
 * 모달이 아니라 App 레벨 화면으로 처리한다.
 */
export function ResetPasswordScreen() {
  const { t } = useLanguage()
  const { setPasswordForCurrentUser, clearRecoveryMode } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErr =
      validateNewPassword(password) ??
      validatePasswordConfirmation(password, confirmation)
    if (validationErr) {
      setError(authErrorMessage(validationErr, t))
      return
    }
    setSubmitting(true)
    setError(null)
    const err = await setPasswordForCurrentUser(password)
    if (err) {
      setError(authErrorMessage(err, t))
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  const pwErr = password ? authErrorMessage(validateNewPassword(password), t) : null
  const confirmErr =
    confirmation && password
      ? authErrorMessage(validatePasswordConfirmation(password, confirmation), t)
      : null

  return (
    <div className="auth-page reset-screen">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="auth-eyebrow">{t.auth.eyebrowPassword}</p>
          <h1>{t.auth.resetTitle}</h1>
          <p className="auth-subtitle">{t.auth.resetSubtitle}</p>
        </div>

        {done ? (
          <div className="auth-form">
            <p className="auth-alert auth-alert--success" role="status">
              {t.auth.resetSuccess}
            </p>
            <button type="button" className="btn btn-primary" onClick={clearRecoveryMode}>
              {t.auth.resetContinue}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{t.auth.newPassword}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <span className="hint">{t.auth.passwordRule}</span>
              <PasswordStrengthMeter password={password} />
              {pwErr && <span className="hint hint-warn">{pwErr}</span>}
            </label>
            <label className="field">
              <span>{t.auth.passwordConfirmation}</span>
              <input
                type="password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="new-password"
                required
              />
              {confirmErr && <span className="hint hint-warn">{confirmErr}</span>}
            </label>
            {error && (
              <p className="auth-alert auth-alert--error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? t.auth.resetSubmitting : t.auth.resetSubmit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
