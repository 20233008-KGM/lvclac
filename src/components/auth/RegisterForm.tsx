import { useState, type FormEvent } from 'react'
import {
  validateEmail,
  validateNewPassword,
  validateNickname,
  validatePasswordConfirmation,
  validateTermsAccepted,
} from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { LegalLinks } from '../ServiceDisclaimer'
import { authErrorMessage } from './authMessages'
import { PasswordStrengthMeter } from './PasswordStrengthMeter'

export function RegisterForm() {
  const { t } = useLanguage()
  const { signUpWithPassword } = useAuth()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErr =
      validateNickname(nickname) ??
      validateEmail(email) ??
      validateNewPassword(password) ??
      validatePasswordConfirmation(password, passwordConfirmation) ??
      validateTermsAccepted(termsAccepted)
    if (validationErr) {
      setError(authErrorMessage(validationErr, t))
      return
    }
    setSubmitting(true)
    setError(null)
    setNotice(null)
    const err = await signUpWithPassword(email, password, nickname)
    if (err === 'confirm_email') {
      setNotice(t.auth.confirmEmailSent)
    } else if (err) {
      // email_taken 포함 — "이미 가입된 이메일입니다" 등 authMessages의 코드별 안내 표시
      setError(authErrorMessage(err, t))
    }
    // err === null 이면 AuthProvider가 세션을 받아 모달이 자동으로 닫힘
    setSubmitting(false)
  }

  const pwErr = password ? authErrorMessage(validateNewPassword(password), t) : null
  const confirmationErr =
    passwordConfirmation && password
      ? authErrorMessage(validatePasswordConfirmation(password, passwordConfirmation), t)
      : null

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t.auth.nickname}</span>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          autoComplete="nickname"
          required
        />
      </label>
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
      <label className="field">
        <span>{t.auth.password}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <PasswordStrengthMeter password={password} />
        {pwErr && <span className="hint hint-warn">{pwErr}</span>}
      </label>
      <label className="field">
        <span>{t.auth.passwordConfirmation}</span>
        <input
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          autoComplete="new-password"
          required
        />
        {confirmationErr && <span className="hint hint-warn">{confirmationErr}</span>}
      </label>
      <label className="auth-consent">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          required
        />
        <span>{t.auth.termsConsent}</span>
      </label>
      <div className="auth-legal-links">
        <LegalLinks />
      </div>
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
        {submitting ? t.auth.registerSubmitting : t.auth.submitRegister}
      </button>
    </form>
  )
}
