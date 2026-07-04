import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n'

const AuthModal = lazy(() => import('./AuthModal').then((mod) => ({ default: mod.AuthModal })))

interface AuthButtonProps {
  variant?: 'default' | 'header'
}

function UserIcon() {
  return (
    <svg
      className="auth-header-btn__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.8 3.6-6 8-6s8 2.2 8 6" />
    </svg>
  )
}

function initialOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export function AuthButton({ variant = 'default' }: AuthButtonProps) {
  const { t } = useLanguage()
  const { user, loading, signOut } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const isHeader = variant === 'header'

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

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
    if (!isHeader) {
      return (
        <div className="auth-user">
          <span className="auth-header-user__name" title={user.nickname}>
            {user.nickname}
          </span>
          <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
            {t.logout}
          </button>
        </div>
      )
    }

    const initial = initialOf(user.nickname)
    return (
      <div className="auth-header-account" ref={accountRef}>
        <button
          type="button"
          className="auth-avatar-btn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="auth-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="auth-avatar-btn__name">{user.nickname}</span>
          <span className="auth-avatar-btn__caret" aria-hidden="true">
            ▾
          </span>
        </button>
        {menuOpen && (
          <div className="auth-menu" role="menu">
            <div className="auth-menu__header">
              <span className="auth-avatar auth-avatar--lg" aria-hidden="true">
                {initial}
              </span>
              <span className="auth-menu__name" title={user.nickname}>
                {user.nickname}
              </span>
            </div>
            <button
              type="button"
              role="menuitem"
              className="auth-menu__item"
              onClick={() => {
                setMenuOpen(false)
                void signOut()
              }}
            >
              {t.logout}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        className={isHeader ? 'auth-header-btn auth-header-btn--primary' : 'btn btn-primary'}
        onClick={() => setModalOpen(true)}
      >
        {isHeader && <UserIcon />}
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
