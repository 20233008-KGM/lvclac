import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { boardPath } from '../config/boards'
import { CONTACT_EMAIL } from '../config/site'
import { useAuth } from '../context/AuthContext'
import { createAccountRecordsRepository } from '../db/accountRecords'
import { fetchLatestNumberSet } from '../db/numberSets'
import type { AuthUser } from '../db/profile'
import type { Messages } from '../i18n/types'
import { useLanguage } from '../i18n'
import { authErrorMessage } from './auth/authMessages'
import { GoogleLogo } from './auth/GoogleLogo'
import { validatePassword, validatePasswordConfirmation } from '../auth/validation'
import { BillingPanel } from './billing/BillingPanel'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

const AuthModal = lazy(() => import('./auth/AuthModal').then((mod) => ({ default: mod.AuthModal })))

// 개발 빌드에서만 로드. 프로덕션에서는 import.meta.env.DEV가 false로 치환되어
// 아래 동적 import가 제거되므로 관련 코드/문자열이 번들에 포함되지 않는다.
const DevResetPanel = import.meta.env.DEV
  ? lazy(() => import('./DevResetPanel').then((mod) => ({ default: mod.DevResetPanel })))
  : null

type MyPageCopy = Messages['myPage']

const MY_PAGE_NAV_ITEMS = [
  { href: '#my-page-profile', sectionIds: ['my-page-profile'] as const },
  { href: '#my-page-records-summary', sectionIds: ['my-page-records-summary'] as const },
  { href: '#my-page-preferences', sectionIds: ['my-page-preferences'] as const },
  { href: '#my-page-support', sectionIds: ['my-page-support'] as const },
] as const

function resolveMyPageNavHref(hash: string) {
  const normalized = hash.startsWith('#') ? hash : hash ? `#${hash}` : ''
  if (!normalized) return MY_PAGE_NAV_ITEMS[0].href

  const direct = MY_PAGE_NAV_ITEMS.find((item) => item.href === normalized)
  if (direct) return direct.href

  for (const item of MY_PAGE_NAV_ITEMS) {
    if (item.sectionIds.some((sectionId) => `#${sectionId}` === normalized)) {
      return item.href
    }
  }

  if (normalized === '#my-page-linked-logins' || normalized === '#my-page-plan') {
    return '#my-page-profile'
  }

  return MY_PAGE_NAV_ITEMS[0].href
}

function useMyPageNavActive(enabled: boolean) {
  const [activeHref, setActiveHref] = useState(() =>
    typeof window === 'undefined' ? MY_PAGE_NAV_ITEMS[0].href : resolveMyPageNavHref(window.location.hash),
  )

  useEffect(() => {
    if (!enabled) return

    const sectionToNav = new Map<string, string>()
    for (const item of MY_PAGE_NAV_ITEMS) {
      for (const sectionId of item.sectionIds) {
        sectionToNav.set(sectionId, item.href)
      }
    }

    const sections = [...sectionToNav.keys()]
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element != null)

    if (sections.length === 0) return

    const visibleRatios = new Map<string, number>()

    const syncActiveFromVisible = () => {
      let bestSectionId = sections[0].id
      let bestRatio = visibleRatios.get(bestSectionId) ?? 0

      for (const section of sections.slice(1)) {
        const ratio = visibleRatios.get(section.id) ?? 0
        if (ratio > bestRatio) {
          bestRatio = ratio
          bestSectionId = section.id
        }
      }

      const href = sectionToNav.get(bestSectionId)
      if (href) setActiveHref(href)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        syncActiveFromVisible()
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    for (const section of sections) {
      observer.observe(section)
    }

    const onHashChange = () => {
      setActiveHref(resolveMyPageNavHref(window.location.hash))
    }

    window.addEventListener('hashchange', onHashChange)
    return () => {
      observer.disconnect()
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [enabled])

  return activeHref
}

interface MyPageViewProps {
  copy: MyPageCopy
  authLoading: boolean
  configured: boolean
  user: AuthUser | null
  isPro: boolean
  nicknameDraft: string
  nicknameBusy: boolean
  nicknameMessage: string | null
  linkedProviders: string[]
  identityBusy: 'link' | 'unlink' | 'setPassword' | null
  identityMessage: string | null
  passwordFormOpen: boolean
  passwordDraft: string
  passwordConfirmationDraft: string
  supportHref: string
  suggestionsHref: string
  adminFeedbackHref?: string
  /** 구독 결제 패널. 로그인 사용자에게만 주입된다. */
  billingPanel?: ReactNode
  recordsSummaryPanel?: ReactNode
  preferencesPanel?: ReactNode
  /** 개발 전용 계정 초기화 패널. 프로덕션에서는 null. */
  devResetPanel?: ReactNode
  onNicknameChange: (value: string) => void
  onNicknameSubmit: () => void
  onLinkGoogle: () => void
  onUnlinkGoogle: () => void
  onPasswordFormToggle: () => void
  onPasswordDraftChange: (value: string) => void
  onPasswordConfirmationDraftChange: (value: string) => void
  onSetPasswordSubmit: () => void
  onLoginClick: () => void
  onSignOut: () => void
}

/** 이메일/비밀번호 수단용 단색 아이콘. Google 로고와 아이콘 컬럼을 대칭으로 맞춘다. */
function MailIcon() {
  return (
    <svg
      className="my-page-linked-logo"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LightbulbIcon() {
  return (
    <svg
      className="my-page-support-channel__svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z" />
    </svg>
  )
}

function InboxIcon() {
  return (
    <svg
      className="my-page-support-channel__svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

export function MyPageView({
  copy,
  authLoading,
  configured,
  user,
  isPro,
  nicknameDraft,
  nicknameBusy,
  nicknameMessage,
  linkedProviders,
  identityBusy,
  identityMessage,
  passwordFormOpen,
  passwordDraft,
  passwordConfirmationDraft,
  supportHref,
  suggestionsHref,
  adminFeedbackHref,
  billingPanel,
  recordsSummaryPanel,
  preferencesPanel,
  devResetPanel,
  onNicknameChange,
  onNicknameSubmit,
  onLinkGoogle,
  onUnlinkGoogle,
  onPasswordFormToggle,
  onPasswordDraftChange,
  onPasswordConfirmationDraftChange,
  onSetPasswordSubmit,
  onLoginClick,
  onSignOut,
}: MyPageViewProps) {
  const hasEmail = linkedProviders.includes('email')
  const hasGoogle = linkedProviders.includes('google')
  const canUnlinkGoogle = hasGoogle && linkedProviders.length > 1
  const canSetPassword = !hasEmail && Boolean(user?.email.trim())
  const emailStatusLabel = hasEmail
    ? `${copy.providerLinked} · ${copy.primaryTag}`
    : copy.providerNotLinked
  const googleStatusLabel = hasGoogle ? copy.providerLinked : copy.providerNotLinked
  const submitNickname = (event: FormEvent) => {
    event.preventDefault()
    onNicknameSubmit()
  }
  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    onSetPasswordSubmit()
  }
  const activeNavHref = useMyPageNavActive(Boolean(user))
  const navLabels: Record<(typeof MY_PAGE_NAV_ITEMS)[number]['href'], string> = {
    '#my-page-profile': copy.navAccount,
    '#my-page-records-summary': copy.navData,
    '#my-page-preferences': copy.preferencesTitle,
    '#my-page-support': copy.navSupport,
  }

  return (
    <div className="my-page-shell">
      <div className="my-page">
        <header className="my-page-header">
          <a className="my-page-back" href="/">
            {copy.backToCalculator}
          </a>
          <div className="my-page-hero">
            <div>
              <h1>{copy.title}</h1>
              <p>{copy.subtitle}</p>
            </div>
          </div>
        </header>

        {authLoading ? (
          <section className="my-page-panel my-page-login" aria-live="polite">
            <p>{copy.loginBody}</p>
          </section>
        ) : !user ? (
          <section className="my-page-panel my-page-login" aria-labelledby="my-page-login-title">
            <h2 id="my-page-login-title">{copy.loginTitle}</h2>
            <p>{copy.loginBody}</p>
            {!configured && <p className="my-page-alert">{copy.configuredWarning}</p>}
            <button
              type="button"
              className="btn btn-primary"
              disabled={!configured}
              onClick={onLoginClick}
            >
              {copy.loginAction}
            </button>
          </section>
        ) : (
          <div className="my-page-body">
              <nav className="my-page-nav" aria-label={copy.navLabel}>
                {MY_PAGE_NAV_ITEMS.map((item) => {
                  const isActive = activeNavHref === item.href
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={isActive ? 'is-active' : undefined}
                      aria-current={isActive ? 'location' : undefined}
                    >
                      {navLabels[item.href]}
                    </a>
                  )
                })}
              </nav>
              <main className="my-page-console">
              <section
                id="my-page-profile"
                className="my-page-panel"
                aria-labelledby="my-page-profile-title"
              >
                <div className="my-page-panel-head">
                  <div>
                    <h2 id="my-page-profile-title">{copy.navAccount}</h2>
                    <p className="my-page-account-email" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={onSignOut}>
                    {copy.signOut}
                  </button>
                </div>
                <form className="my-page-field my-page-nickname-form" onSubmit={submitNickname}>
                  <label htmlFor="my-page-nickname">{copy.nicknameLabel}</label>
                  <div className="my-page-inline-control">
                    <input
                      id="my-page-nickname"
                      value={nicknameDraft}
                      placeholder={copy.nicknamePlaceholder}
                      disabled={nicknameBusy}
                      onChange={(event) => onNicknameChange(event.currentTarget.value)}
                    />
                    <button type="submit" className="btn btn-primary" disabled={nicknameBusy}>
                      {nicknameBusy ? copy.savingNickname : copy.saveNickname}
                    </button>
                  </div>
                  <p className="my-page-field-help">{copy.nicknameHelp}</p>
                  {nicknameMessage && (
                    <p className="my-page-form-message" role="status">
                      {nicknameMessage}
                    </p>
                  )}
                </form>
                {billingPanel}
                <div
                  className="my-page-panel-section"
                  aria-labelledby="my-page-linked-logins-title"
                >
                  <h3 id="my-page-linked-logins-title">{copy.linkedLoginTitle}</h3>
                  <p>{copy.linkedLoginBody}</p>
                  <ul className="my-page-linked-list">
                  <li className="my-page-linked-row">
                    <span className="my-page-linked-icon" aria-hidden="true">
                      <MailIcon />
                    </span>
                    <span className="my-page-linked-name">{copy.emailProvider}</span>
                    <span
                      className={`my-page-linked-status ${hasEmail ? 'is-linked' : 'is-unlinked'}`}
                    >
                      {emailStatusLabel}
                    </span>
                    <span className="my-page-linked-action">
                      {!hasEmail && canSetPassword ? (
                        <button
                          type="button"
                          className="btn btn-primary my-page-linked-btn my-page-linked-btn--setup"
                          disabled={identityBusy !== null}
                          aria-expanded={passwordFormOpen}
                          aria-controls="my-page-set-password-form"
                          onClick={onPasswordFormToggle}
                        >
                          {copy.setPasswordAction}
                        </button>
                      ) : null}
                    </span>
                  </li>
                  <li className="my-page-linked-row">
                    <span className="my-page-linked-icon" aria-hidden="true">
                      <GoogleLogo className="my-page-linked-logo" />
                    </span>
                    <span className="my-page-linked-name">{copy.googleProvider}</span>
                    <span
                      className={`my-page-linked-status ${hasGoogle ? 'is-linked' : 'is-unlinked'}`}
                    >
                      {googleStatusLabel}
                    </span>
                    <span className="my-page-linked-action">
                      {hasGoogle ? (
                        <button
                          type="button"
                          className="btn btn-ghost my-page-linked-btn my-page-linked-btn--unlink"
                          disabled={identityBusy !== null || !canUnlinkGoogle}
                          onClick={onUnlinkGoogle}
                        >
                          {identityBusy === 'unlink'
                            ? copy.unlinkingInProgress
                            : copy.unlinkGoogleAction}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary my-page-linked-btn my-page-linked-btn--setup"
                          disabled={identityBusy !== null}
                          onClick={onLinkGoogle}
                        >
                          {identityBusy === 'link'
                            ? copy.linkingInProgress
                            : copy.linkGoogleAction}
                        </button>
                      )}
                    </span>
                  </li>
                </ul>
                {!hasEmail && user && !user.email.trim() && (
                  <p className="my-page-field-help">{copy.setPasswordNoEmail}</p>
                )}
                {passwordFormOpen && canSetPassword && user && (
                  <form
                    id="my-page-set-password-form"
                    className="my-page-set-password-form"
                    onSubmit={submitPassword}
                  >
                    <label className="my-page-field" htmlFor="my-page-set-password-email">
                      <span>{copy.emailLabel}</span>
                      <input
                        id="my-page-set-password-email"
                        type="email"
                        value={user.email}
                        readOnly
                        aria-readonly="true"
                      />
                    </label>
                    <p className="my-page-field-help">{copy.setPasswordEmailHelp}</p>
                    <label className="my-page-field" htmlFor="my-page-set-password">
                      <span>{copy.passwordLabel}</span>
                      <input
                        id="my-page-set-password"
                        type="password"
                        value={passwordDraft}
                        autoComplete="new-password"
                        disabled={identityBusy === 'setPassword'}
                        onChange={(event) => onPasswordDraftChange(event.currentTarget.value)}
                      />
                    </label>
                    <label className="my-page-field" htmlFor="my-page-set-password-confirm">
                      <span>{copy.passwordConfirmationLabel}</span>
                      <input
                        id="my-page-set-password-confirm"
                        type="password"
                        value={passwordConfirmationDraft}
                        autoComplete="new-password"
                        disabled={identityBusy === 'setPassword'}
                        onChange={(event) =>
                          onPasswordConfirmationDraftChange(event.currentTarget.value)
                        }
                      />
                    </label>
                    <div className="my-page-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={identityBusy === 'setPassword'}
                      >
                        {identityBusy === 'setPassword'
                          ? copy.settingPasswordInProgress
                          : copy.savePassword}
                      </button>
                    </div>
                  </form>
                )}
                {hasGoogle && !canUnlinkGoogle && (
                  <p className="my-page-field-help">{copy.lastIdentityNote}</p>
                )}
                {identityMessage && (
                  <p className="my-page-form-message" role="status">
                    {identityMessage}
                  </p>
                )}
              </section>
              {recordsSummaryPanel}

              {preferencesPanel}


<section
                id="my-page-support"
                className="my-page-panel"
                aria-labelledby="my-page-support-title"
              >
                <h2 id="my-page-support-title">{copy.supportTitle}</h2>
                <p>{copy.supportBody}</p>
                <div className="my-page-support-channels">
                  <a className="my-page-support-channel" href={suggestionsHref}>
                    <span className="my-page-support-channel__icon" aria-hidden="true">
                      <LightbulbIcon />
                    </span>
                    <span className="my-page-support-channel__body">
                      <span className="my-page-support-channel__title">{copy.suggestionsLink}</span>
                      <span className="my-page-support-channel__desc">{copy.suggestionsDesc}</span>
                    </span>
                    <span className="my-page-support-channel__arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                  <a className="my-page-support-channel" href={supportHref}>
                    <span className="my-page-support-channel__icon" aria-hidden="true">
                      <MailIcon />
                    </span>
                    <span className="my-page-support-channel__body">
                      <span className="my-page-support-channel__title">{copy.emailLink}</span>
                      <span className="my-page-support-channel__desc">{copy.emailDesc}</span>
                    </span>
                    <span className="my-page-support-channel__arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                  {adminFeedbackHref && (
                    <a className="my-page-support-channel" href={adminFeedbackHref}>
                      <span className="my-page-support-channel__icon" aria-hidden="true">
                        <InboxIcon />
                      </span>
                      <span className="my-page-support-channel__body">
                        <span className="my-page-support-channel__title">
                          {copy.adminFeedbackLink}
                        </span>
                        <span className="my-page-support-channel__desc">{copy.adminFeedbackDesc}</span>
                      </span>
                      <span className="my-page-support-channel__arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  )}
                </div>
                <div className="my-page-support-delete-card">
                  <h3>{copy.deleteAccountTitle}</h3>
                  <p>{copy.deleteAccountBody}</p>
                  <a className="link-btn" href={supportHref}>
                    {copy.contactSupport}
                  </a>
                </div>
              </section>

              {devResetPanel}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}

export function MyPage() {
  const { t } = useLanguage()
  const {
    user,
    loading,
    configured,
    updateNickname,
    signOut,
    linkedProviders,
    linkGoogle,
    unlinkGoogle,
    isPro,
  } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [identityBusy, setIdentityBusy] = useState<'link' | 'unlink' | null>(null)
  const [identityMessageState, setIdentityMessageState] = useState<{
    userId: string | null
    value: string | null
  }>({ userId: null, value: null })
  const [nicknameState, setNicknameState] = useState({
    userId: user?.id ?? null,
    value: user?.nickname ?? '',
  })
  const [nicknameBusy, setNicknameBusy] = useState(false)
  const [nicknameMessageState, setNicknameMessageState] = useState<{
    userId: string | null
    value: string | null
  }>({ userId: null, value: null })
  const [storageState, setStorageState] = useState<{
    userId: string | null
    error: string | null
    hasCloudInput: boolean
    orderHistoryCount: number
    accountSnapshotCount: number
  }>({
    userId: null,
    error: null,
    hasCloudInput: false,
    orderHistoryCount: 0,
    accountSnapshotCount: 0,
  })

  const nicknameDraft =
    nicknameState.userId === (user?.id ?? null) ? nicknameState.value : user?.nickname ?? ''
  const nicknameMessage =
    nicknameMessageState.userId === (user?.id ?? null) ? nicknameMessageState.value : null
  const identityMessage =
    identityMessageState.userId === (user?.id ?? null) ? identityMessageState.value : null
  const hasCloudInput = user && storageState.userId === user.id ? storageState.hasCloudInput : false
  const orderHistoryCount =
    user && storageState.userId === user.id ? storageState.orderHistoryCount : 0
  const accountSnapshotCount =
    user && storageState.userId === user.id ? storageState.accountSnapshotCount : 0

  useEffect(() => {
    if (!user) {
      setPasswordFormOpen(false)
      setPasswordDraft('')
      setPasswordConfirmationDraft('')
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      return
    }

    let active = true

    Promise.all([
      fetchLatestNumberSet(user.id),
      createAccountRecordsRepository().fetchRecordCounts(user.id),
    ])
      .then(([numberSetResult, recordCountResult]) => {
        if (!active) return
        if (numberSetResult.error || recordCountResult.error) {
          setStorageState({
            userId: user.id,
            error: t.myPage.storageError,
            hasCloudInput: false,
            orderHistoryCount: 0,
            accountSnapshotCount: 0,
          })
          return
        }
        if (!recordCountResult.data) {
          setStorageState({
            userId: user.id,
            error: t.myPage.storageError,
            hasCloudInput: false,
            orderHistoryCount: 0,
            accountSnapshotCount: 0,
          })
          return
        }
        setStorageState({
          userId: user.id,
          error: null,
          hasCloudInput: Boolean(numberSetResult.data),
          orderHistoryCount: recordCountResult.data.orderHistoryCount,
          accountSnapshotCount: recordCountResult.data.accountSnapshotCount,
        })
      })
      .catch(() => {
        if (active) {
          setStorageState({
            userId: user.id,
            error: t.myPage.storageError,
            hasCloudInput: false,
            orderHistoryCount: 0,
            accountSnapshotCount: 0,
          })
        }
      })

    return () => {
      active = false
    }
  }, [t.myPage.storageError, user])

  const submitNickname = useCallback(async () => {
    if (!user || nicknameBusy) return
    const trimmed = nicknameDraft.trim()
    if (!trimmed) {
      setNicknameMessageState({ userId: user.id, value: t.myPage.nicknameRequired })
      return
    }

    setNicknameBusy(true)
    setNicknameMessageState({ userId: user.id, value: null })
    const error = await updateNickname(trimmed)
    setNicknameBusy(false)
    setNicknameMessageState({
      userId: user.id,
      value: error ? t.myPage.nicknameError : t.myPage.nicknameSaved,
    })
  }, [nicknameBusy, nicknameDraft, t.myPage, updateNickname, user])

  const handleLinkGoogle = useCallback(async () => {
    if (!user || identityBusy) return
    setIdentityBusy('link')
    setIdentityMessageState({ userId: user.id, value: null })
    // 성공 시 Google로 리다이렉트되어 아래 코드는 실행되지 않음
    const error = await linkGoogle()
    setIdentityBusy(null)
    if (error) {
      setIdentityMessageState({ userId: user.id, value: authErrorMessage(error, t) })
    }
  }, [identityBusy, linkGoogle, t, user])

  const handleUnlinkGoogle = useCallback(async () => {
    if (!user || identityBusy) return
    setIdentityBusy('unlink')
    setIdentityMessageState({ userId: user.id, value: null })
    const error = await unlinkGoogle()
    setIdentityBusy(null)
    setIdentityMessageState({
      userId: user.id,
      value: error ? authErrorMessage(error, t) : t.myPage.googleUnlinked,
    })
  }, [identityBusy, t, unlinkGoogle, user])

  const handlePasswordFormToggle = useCallback(() => {
    if (!user || identityBusy) return
    setPasswordFormOpen((open) => !open)
    setIdentityMessageState({ userId: user.id, value: null })
  }, [identityBusy, user])

  const handleSetPassword = useCallback(async () => {
    if (!user || identityBusy) return
    const validationError =
      validatePassword(passwordDraft) ??
      validatePasswordConfirmation(passwordDraft, passwordConfirmationDraft)
    if (validationError) {
      setIdentityMessageState({
        userId: user.id,
        value: authErrorMessage(validationError, t),
      })
      return
    }

    setIdentityBusy('setPassword')
    setIdentityMessageState({ userId: user.id, value: null })
    const error = await setPasswordForCurrentUser(passwordDraft)
    setIdentityBusy(null)
    if (error) {
      setIdentityMessageState({ userId: user.id, value: authErrorMessage(error, t) })
      return
    }

    setPasswordFormOpen(false)
    setPasswordDraft('')
    setPasswordConfirmationDraft('')
    setIdentityMessageState({ userId: user.id, value: t.myPage.passwordSetSuccess })
  }, [
    identityBusy,
    passwordConfirmationDraft,
    passwordDraft,
    setPasswordForCurrentUser,
    t,
    user,
  ])

  return (
    <>
      <MyPageView
        copy={t.myPage}
        authLoading={loading}
        configured={configured}
        user={user}
        isPro={isPro}
        nicknameDraft={nicknameDraft}
        nicknameBusy={nicknameBusy}
        nicknameMessage={nicknameMessage}
        linkedProviders={linkedProviders}
        identityBusy={identityBusy}
        identityMessage={identityMessage}
        storageLoading={storageLoading}
        storageError={storageError}
        hasCloudInput={hasCloudInput}
        orderHistoryCount={orderHistoryCount}
        accountSnapshotCount={accountSnapshotCount}
        supportHref={`mailto:${CONTACT_EMAIL}`}
        suggestionsHref={boardPath('suggestions')}
        billingPanel={user ? <BillingPanel embedded /> : null}
        devResetPanel={
          DevResetPanel && user ? (
            <Suspense fallback={null}>
              <DevResetPanel />
            </Suspense>
          ) : null
        }
        onNicknameChange={(value) => {
          setNicknameState({ userId: user?.id ?? null, value })
          setNicknameMessageState({ userId: user?.id ?? null, value: null })
        }}
        onNicknameSubmit={submitNickname}
        onLinkGoogle={() => void handleLinkGoogle()}
        onUnlinkGoogle={() => void handleUnlinkGoogle()}
        onPasswordFormToggle={handlePasswordFormToggle}
        onPasswordDraftChange={setPasswordDraft}
        onPasswordConfirmationDraftChange={setPasswordConfirmationDraft}
        onSetPasswordSubmit={() => void handleSetPassword()}
        onLoginClick={() => setAuthModalOpen(true)}
        onSignOut={() => void signOut()}
      />
      <SiteFooter />
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
