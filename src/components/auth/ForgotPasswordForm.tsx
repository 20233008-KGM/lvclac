import { useState, type FormEvent } from 'react'
import { validateEmail } from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { t } = useLanguage()
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(authErrorMessage(emailErr, t))
      return
    }
    setSubmitting(true)
    setError(null)
    setNotice(null)
    const err = await sendPasswordReset(email)
    // 이메일 열거 방지: 레이트리밋·미설정만 에러로 노출하고, 그 외에는
    // 가입 여부와 무관하게 동일한 성공 안내를 보여 준다.
    if (err === 'rate_limited' || err === 'not_configured') {
      setError(authErrorMessage(err, t))
    } else {
      setNotice(t.auth.resetEmailSent)
    }
    setSubmitting(false)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t.auth.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>
      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="auth-alert auth-alert--success" role="status">
          {notice}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? t.auth.forgotSubmitting : t.auth.forgotSubmit}
      </button>
      <p className="auth-switch">
        <button type="button" className="auth-switch__btn" onClick={onBackToLogin}>
          {t.auth.backToLogin}
        </button>
      </p>
    </form>
  )
}
