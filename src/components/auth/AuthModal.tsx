import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'
import { AuthPage } from './AuthPage'
import '../../styles/auth-dialog.css'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    if (user) onClose()
  }, [user, onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={t.close}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <AuthPage />
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
