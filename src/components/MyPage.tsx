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
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

const AuthModal = lazy(() => import('./auth/AuthModal').then((mod) => ({ default: mod.AuthModal })))

// 개발 빌드에서만 로드. 프로덕션에서는 import.meta.env.DEV가 false로 치환되어
// 아래 동적 import가 제거되므로 관련 코드/문자열이 번들에 포함되지 않는다.
const DevResetPanel = import.meta.env.DEV
  ? lazy(() => import('./DevResetPanel').then((mod) => ({ default: mod.DevResetPanel })))
  : null

type MyPageCopy = Messages['myPage']

interface MyPageViewProps {
  copy: MyPageCopy
  authLoading: boolean
  configured: boolean
  user: AuthUser | null
  nicknameDraft: string
  nicknameBusy: boolean
  nicknameMessage: string | null
  linkedProviders: string[]
  identityBusy: 'link' | 'unlink' | null
  identityMessage: string | null
  storageLoading: boolean
  storageError: string | null
  hasCloudInput: boolean
  orderHistoryCount: number
  accountSnapshotCount: number
  supportHref: string
  suggestionsHref: string
  /** 개발 전용 계정 초기화 패널. 프로덕션에서는 null. */
  devResetPanel?: ReactNode
  onNicknameChange: (value: string) => void
  onNicknameSubmit: () => void
  onLinkGoogle: () => void
  onUnlinkGoogle: () => void
  onLoginClick: () => void
  onSignOut: () => void
}

function countLabel(copy: MyPageCopy, count: number): string {
  return count > 0 ? copy.recordsCount.replace('{count}', String(count)) : copy.recordsEmpty
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

function StorageRow({
  title,
  value,
}: {
  title: string
  value: string
}) {
  return (
    <div className="my-page-storage-row">
      <dt>{title}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function MyPageView({
  copy,
  authLoading,
  configured,
  user,
  nicknameDraft,
  nicknameBusy,
  nicknameMessage,
  linkedProviders,
  identityBusy,
  identityMessage,
  storageLoading,
  storageError,
  hasCloudInput,
  orderHistoryCount,
  accountSnapshotCount,
  supportHref,
  suggestionsHref,
  devResetPanel,
  onNicknameChange,
  onNicknameSubmit,
  onLinkGoogle,
  onUnlinkGoogle,
  onLoginClick,
  onSignOut,
}: MyPageViewProps) {
  const hasEmail = linkedProviders.includes('email')
  const hasGoogle = linkedProviders.includes('google')
  const canUnlinkGoogle = hasGoogle && linkedProviders.length > 1
  const submitNickname = (event: FormEvent) => {
    event.preventDefault()
    onNicknameSubmit()
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
          <>
            <section className="my-page-identity-card" aria-label={copy.profileTitle}>
              <span className="my-page-avatar" aria-hidden="true">
                {user.nickname.trim().charAt(0).toUpperCase() || '?'}
              </span>
              <div className="my-page-identity-info">
                <strong title={user.nickname}>{user.nickname}</strong>
                <span className="my-page-identity-meta" title={user.email}>
                  {user.email}
                </span>
              </div>
              <span className="my-page-badge">{copy.planStatusValue}</span>
            </section>

            <main className="my-page-console">
              <section
                id="my-page-profile"
                className="my-page-panel"
                aria-labelledby="my-page-profile-title"
              >
                <div className="my-page-panel-head">
                  <div>
                    <h2 id="my-page-profile-title">{copy.profileTitle}</h2>
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
              </section>

              <section
                id="my-page-linked-logins"
                className="my-page-panel"
                aria-labelledby="my-page-linked-logins-title"
              >
                <h2 id="my-page-linked-logins-title">{copy.linkedLoginTitle}</h2>
                <p>{copy.linkedLoginBody}</p>
                <ul className="my-page-linked-list">
                  <li className="my-page-linked-row">
                    <span className="my-page-linked-icon">
                      <MailIcon />
                    </span>
                    <span className="my-page-linked-name">{copy.emailProvider}</span>
                    <span
                      className={`my-page-linked-badge ${hasEmail ? 'is-linked' : 'is-unlinked'}`}
                    >
                      {hasEmail ? copy.providerLinked : copy.providerNotLinked}
                    </span>
                    <span className="my-page-linked-action">
                      {hasEmail && (
                        <span className="my-page-linked-chip">{copy.primaryTag}</span>
                      )}
                    </span>
                  </li>
                  <li className="my-page-linked-row">
                    <span className="my-page-linked-icon">
                      <GoogleLogo className="my-page-linked-logo" />
                    </span>
                    <span className="my-page-linked-name">{copy.googleProvider}</span>
                    <span
                      className={`my-page-linked-badge ${hasGoogle ? 'is-linked' : 'is-unlinked'}`}
                    >
                      {hasGoogle ? copy.providerLinked : copy.providerNotLinked}
                    </span>
                    <span className="my-page-linked-action">
                      {hasGoogle ? (
                        <button
                          type="button"
                          className="btn btn-ghost"
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
                          className="btn btn-primary"
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
                {hasGoogle && !canUnlinkGoogle && (
                  <p className="my-page-field-help">{copy.lastIdentityNote}</p>
                )}
                {identityMessage && (
                  <p className="my-page-form-message" role="status">
                    {identityMessage}
                  </p>
                )}
              </section>

              <section
                id="my-page-storage"
                className="my-page-panel"
                aria-labelledby="my-page-storage-title"
              >
                <h2 id="my-page-storage-title">{copy.storageTitle}</h2>
                <p>{copy.storageBody}</p>
                {storageLoading ? (
                  <p className="my-page-muted" role="status">
                    {copy.storageLoading}
                  </p>
                ) : storageError ? (
                  <p className="my-page-alert" role="alert">
                    {storageError}
                  </p>
                ) : (
                  <dl className="my-page-storage-list">
                    <StorageRow
                      title={copy.cloudInputTitle}
                      value={hasCloudInput ? copy.cloudInputReady : copy.cloudInputEmpty}
                    />
                    <StorageRow
                      title={copy.snapshotsTitle}
                      value={countLabel(copy, accountSnapshotCount)}
                    />
                    <StorageRow
                      title={copy.orderHistoryTitle}
                      value={countLabel(copy, orderHistoryCount)}
                    />
                  </dl>
                )}
              </section>

              <section
                id="my-page-plan"
                className="my-page-panel"
                aria-labelledby="my-page-plan-title"
              >
                <div className="my-page-panel-head">
                  <h2 id="my-page-plan-title">{copy.planTitle}</h2>
                  <span className="my-page-badge my-page-badge--muted">{copy.planStatusValue}</span>
                </div>
                <p>{copy.planBody}</p>
              </section>

              <section
                id="my-page-privacy"
                className="my-page-panel"
                aria-labelledby="my-page-privacy-title"
              >
                <h2 id="my-page-privacy-title">{copy.privacyTitle}</h2>
                <p>{copy.privacyBody}</p>
                <ul className="my-page-note-list">
                  <li>{copy.localStorageNote}</li>
                  <li>{copy.cloudStorageNote}</li>
                </ul>
              </section>

              <section
                id="my-page-support"
                className="my-page-panel"
                aria-labelledby="my-page-support-title"
              >
                <div className="my-page-support-grid">
                  <div>
                    <h2 id="my-page-support-title">{copy.supportTitle}</h2>
                    <p>{copy.supportBody}</p>
                    <div className="my-page-actions">
                      <a className="btn btn-ghost" href={suggestionsHref}>
                        {copy.suggestionsLink}
                      </a>
                      <a className="btn btn-ghost" href={supportHref}>
                        {copy.emailLink}
                      </a>
                    </div>
                  </div>
                  <div className="my-page-delete-note">
                    <h3>{copy.deleteAccountTitle}</h3>
                    <p>{copy.deleteAccountBody}</p>
                    <a className="link-btn" href={supportHref}>
                      {copy.contactSupport}
                    </a>
                  </div>
                </div>
              </section>

              {devResetPanel}
            </main>
          </>
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
  const storageLoading = Boolean(user && storageState.userId !== user.id)
  const storageError = user && storageState.userId === user.id ? storageState.error : null
  const hasCloudInput = user && storageState.userId === user.id ? storageState.hasCloudInput : false
  const orderHistoryCount =
    user && storageState.userId === user.id ? storageState.orderHistoryCount : 0
  const accountSnapshotCount =
    user && storageState.userId === user.id ? storageState.accountSnapshotCount : 0

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

  return (
    <>
      <MyPageView
        copy={t.myPage}
        authLoading={loading}
        configured={configured}
        user={user}
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
