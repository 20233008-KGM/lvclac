import { useState, type FormEvent } from 'react'
import { validateEmail, validateLoginPassword } from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'
import { PasswordField } from './PasswordField'

interface LoginFormProps {
  onForgotPassword?: () => void
}

export function LoginForm({ onForgotPassword }: LoginFormProps = {}) {
  const { t } = useLanguage()
  const { signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailErr = validateEmail(email) ?? validateLoginPassword(password)
    if (emailErr) {
      setError(authErrorMessage(emailErr, t))
      return
    }
    setSubmitting(true)
    setError(null)
    const err = await signInWithPassword(email, password)
    if (err) setError(authErrorMessage(err, t))
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
      <PasswordField
        label={t.auth.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />
      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}
      {onForgotPassword && (
        <p className="auth-forgot">
          <button type="button" className="auth-switch__btn" onClick={onForgotPassword}>
            {t.auth.forgotPasswordLink}
          </button>
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? t.auth.loginSubmitting : t.auth.submitLogin}
      </button>
    </form>
  )
}
