// Launch: unused — auth deferred
import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'

function mapAuthError(message: string | null, t: ReturnType<typeof useLanguage>['t']): string | null {
  if (!message) return null
  if (message === 'invalid_credentials') return t.auth.invalidCredentials
  if (message === 'username_taken') return t.auth.usernameTaken
  return message
}

export function LoginForm() {
  const { t } = useLanguage()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const err = await login(username, password)
    if (err) setError(mapAuthError(err, t))
    setSubmitting(false)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t.auth.username}</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
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
