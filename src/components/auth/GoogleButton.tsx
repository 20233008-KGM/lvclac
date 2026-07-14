import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { authErrorMessage } from './authMessages'
import { GoogleLogo } from './GoogleLogo'

export function GoogleButton() {
  const { t } = useLanguage()
  const { signInWithGoogle } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setSubmitting(true)
    setError(null)
    const err = await signInWithGoogle()
    // 성공이면 리다이렉트되어 이 줄에 도달하지 않음
    if (err) {
      setError(authErrorMessage(err, t))
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="google-btn"
        onClick={handleClick}
        disabled={submitting}
      >
        <GoogleLogo />
        <span>{t.auth.continueWithGoogle}</span>
      </button>
      {error && (
        <p className="auth-alert auth-alert--error" role="alert">
          {error}
        </p>
      )}
    </>
  )
}
