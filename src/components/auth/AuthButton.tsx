import { Suspense, lazy, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'

const AuthModal = lazy(() => import('./AuthModal').then((mod) => ({ default: mod.AuthModal })))

interface AuthButtonProps {
  variant?: 'default' | 'header'
}

export function AuthButton({ variant = 'default' }: AuthButtonProps) {
  const { t } = useLanguage()
  const { user, loading, logout } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const isHeader = variant === 'header'

  if (loading) {
    return (
      <button
        type="button"
        className={isHeader ? 'auth-header-btn auth-header-btn--loading' : 'btn btn-ghost'}
        disabled
        aria-hidden="true"
      >
        …
      </button>
    )
  }

  if (user) {
    return (
      <div className={isHeader ? 'auth-header-user' : 'auth-user'}>
        <span className="auth-header-user__name" title={user.username}>
          {user.username}
        </span>
        <button
          type="button"
          className={isHeader ? 'auth-header-btn' : 'btn btn-ghost'}
          onClick={() => logout()}
        >
          {t.logout}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        className={isHeader ? 'auth-header-btn' : 'btn btn-ghost'}
        onClick={() => setModalOpen(true)}
      >
        {t.login}
      </button>
      {modalOpen && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
