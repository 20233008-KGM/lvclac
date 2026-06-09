import { useState, type FormEvent } from 'react'
import { validatePassword, validateUsername } from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'

function mapAuthError(message: string | null, t: ReturnType<typeof useLanguage>['t']): string | null {
  if (!message) return null
  if (message === 'username_taken') return t.auth.usernameTaken
  return message
}

export function RegisterForm() {
  const { t } = useLanguage()
  const { register, checkUsername } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleUsernameBlur() {
    const err = validateUsername(username)
    if (err) {
      setUsernameStatus(err)
      return
    }
    const available = await checkUsername(username)
    setUsernameStatus(available ? null : t.auth.usernameTaken)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const available = await checkUsername(username)
    if (!available) {
      setError(t.auth.usernameTaken)
      setSubmitting(false)
      return
    }

    const err = await register(username, password)
    if (err) setError(mapAuthError(err, t))
    setSubmitting(false)
  }

  const pwErr = password ? validatePassword(password) : null

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t.auth.username}</span>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setUsernameStatus(null)
          }}
          onBlur={handleUsernameBlur}
          autoComplete="username"
          required
        />
        {usernameStatus && <span className="hint hint-warn">{usernameStatus}</span>}
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
        {pwErr && <span className="hint hint-warn">{pwErr}</span>}
      </label>
      {error && <p className="error-msg">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting || !!pwErr}>
        {submitting ? '…' : t.auth.submitRegister}
      </button>
    </form>
  )
}
