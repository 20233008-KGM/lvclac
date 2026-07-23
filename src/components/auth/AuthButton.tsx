import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useAuth } from '../../context/AuthContext'
import type { AuthUser } from '../../db/profile'
import { useLanguage } from '../../i18n'
import { BILLING_PATH, MY_PAGE_PATH } from '../../config/routes'
import { useNavigate } from '../../hooks/usePathname'
import { prefetchMyPage } from '../../routes/lazyPages'
import { onAccountMenuNavigate } from './accountMenuNavigation'

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

interface AccountMenuProps {
  copy: {
    myPage: string
    billing: string
    logout: string
  }
  user: AuthUser
  onClose: () => void
  onMyPageClick: (event: ReactMouseEvent<HTMLAnchorElement>) => void
  onSignOut: () => void
}

export function AccountMenu({ copy, user, onClose, onMyPageClick, onSignOut }: AccountMenuProps) {
  const initial = initialOf(user.nickname)

  return (
    <div className="auth-menu" role="menu">
      <div className="auth-menu__header">
        <span className="auth-avatar auth-avatar--lg" aria-hidden="true">
          {initial}
        </span>
        <span className="auth-menu__name" title={user.nickname}>
          {user.nickname}
        </span>
      </div>
      <a role="menuitem" className="auth-menu__item" href={MY_PAGE_PATH} onClick={onMyPageClick}>
        {copy.myPage}
      </a>
      <a role="menuitem" className="auth-menu__item" href={BILLING_PATH} onClick={onClose}>
        {copy.billing}
      </a>
      <button
        type="button"
        role="menuitem"
        className="auth-menu__item"
        onClick={() => {
          onClose()
          onSignOut()
        }}
      >
        {copy.logout}
      </button>
    </div>
  )
}

export function AuthButton({ variant = 'default' }: AuthButtonProps) {
  const { t } = useLanguage()
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!user) return
    const preload = () => prefetchMyPage()
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload, { timeout: 2000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(preload, 500)
    return () => window.clearTimeout(id)
  }, [user])

  const handleMyPageClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    onAccountMenuNavigate(event, () => {
      setMenuOpen(false)
      navigate(MY_PAGE_PATH)
    })
  }

  if (loading) {
    return (
      <button
        type="button"
        className={isHeader ? 'auth-header-btn auth-header-btn--loading' : 'btn btn-ghost'}
        disabled
        aria-hidden="true"
      >
        <span className="auth-header-btn__loading-text">{t.loading}</span>
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
          onClick={() => {
            prefetchMyPage()
            setMenuOpen((open) => !open)
          }}
          onPointerEnter={prefetchMyPage}
          onFocus={prefetchMyPage}
        >
          <span className="auth-avatar" aria-hidden="true">
            {initial}
          </span>
          <span className="auth-avatar-btn__name">{user.nickname}</span>
          <span className="auth-avatar-btn__caret" aria-hidden="true" />
        </button>
        {menuOpen && (
          <AccountMenu
            copy={{ myPage: t.myPage.title, billing: t.myPage.billing.page.pageTitle, logout: t.logout }}
            user={user}
            onClose={() => setMenuOpen(false)}
            onMyPageClick={handleMyPageClick}
            onSignOut={() => void signOut()}
          />
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
