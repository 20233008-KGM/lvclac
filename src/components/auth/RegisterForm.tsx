import { useState, type FormEvent } from 'react'
import {
  validateEmail,
  validateNickname,
  validatePassword,
} from '../../auth/validation'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'

export function RegisterForm() {
  const { t } = useLanguage()
  const { signUpWithPassword } = useAuth()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationErr =
      validateNickname(nickname) ?? validateEmail(email) ?? validatePassword(password)
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
      setError(authErrorMessage(err, t))
    }
    // err === null 이면 AuthProvider가 세션을 받아 모달이 자동으로 닫힘
    setSubmitting(false)
  }

  const pwErr = password ? authErrorMessage(validatePassword(password), t) : null

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
        {pwErr && <span className="hint hint-warn">{pwErr}</span>}
      </label>
      {error && <p className="error-msg">{error}</p>}
      {notice && <p className="hint hint-ok">{notice}</p>}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '…' : t.auth.submitRegister}
      </button>
    </form>
  )
}
