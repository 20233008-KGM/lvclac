import { useState, type FormEvent } from 'react'
import { validateEmail, validatePassword } from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'

export function LoginForm() {
  const { t } = useLanguage()
  const { signInWithPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailErr = validateEmail(email) ?? validatePassword(password)
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
      <label className="field">
        <span>{t.auth.password}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="error-msg">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '…' : t.auth.submitLogin}
      </button>
    </form>
  )
}
