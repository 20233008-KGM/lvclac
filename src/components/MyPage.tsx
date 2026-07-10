import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { boardPath } from '../config/boards'
import { ADMIN_FEEDBACK_PATH, RECORDS_PATH } from '../config/routes'
import { CONTACT_EMAIL } from '../config/site'
import {
  useCalculator,
  type CalculatorNumberSet,
  type SaveStorageMode,
} from '../context/CalculatorContext'
import { useAuth } from '../context/AuthContext'
import {
  createAccountRecordsRepository,
  type AccountSnapshotRecord,
  type OrderHistoryRecord,
} from '../db/accountRecords'
import type {
  AccountSnapshotAutomationSettings,
  AccountSnapshotAutomationSettingsInput,
} from '../db/accountSnapshotAutomation'
import { fetchNumberSets } from '../db/numberSets'
import type { AuthUser } from '../db/profile'
import type { Messages } from '../i18n/types'
import { useLanguage } from '../i18n'
import {
  formatLeverageValue,
  formatNumber,
  formatPercent,
  formatSavedAtCompact,
} from '../utils/format'
import { authErrorMessage } from './auth/authMessages'
import { GoogleLogo } from './auth/GoogleLogo'
import { validateNewPassword, validatePasswordConfirmation } from '../auth/validation'
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
type AccountRecordsCopy = Messages['accountRecords']

const MY_PAGE_NAV_ITEMS = [
  { href: '#my-page-profile', sectionIds: ['my-page-profile'] as const },
  { href: '#my-page-records-summary', sectionIds: ['my-page-records-summary'] as const },
  { href: '#my-page-preferences', sectionIds: ['my-page-preferences'] as const },
  { href: '#my-page-support', sectionIds: ['my-page-support'] as const },
] as const

type MyPageNavHref = (typeof MY_PAGE_NAV_ITEMS)[number]['href']

function resolveMyPageNavHref(hash: string): MyPageNavHref {
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

    const sectionToNav = new Map<string, MyPageNavHref>()
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
  recordsSummaryPanel?: ReactNode
  preferencesPanel?: ReactNode
  /** 구독 결제 패널. 로그인 사용자에게만 주입된다. */
  billingPanel?: ReactNode
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

function LatestSnapshotSummary({
  copy,
  recordsCopy,
  snapshot,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  snapshot: AccountSnapshotRecord | null
}) {
  if (!snapshot) {
    return <p className="account-records-empty">{copy.latestSnapshotEmpty}</p>
  }

  const metrics = [
    {
      label: recordsCopy.summaryAccountEquity,
      value: formatNumber(snapshot.inputs.accountEval ?? null),
    },
    {
      label: recordsCopy.summaryLiquidationBuffer,
      value: formatPercent(snapshot.result.toleranceRate),
    },
    {
      label: recordsCopy.summaryLeverage,
      value: formatLeverageValue(snapshot.result.leverageRatio),
    },
  ]

  return (
    <div className="records-summary-table records-summary-table--snapshot" role="table">
      <div className="records-summary-row records-summary-head" role="row">
        {metrics.map((metric) => (
          <span key={metric.label} role="columnheader">{metric.label}</span>
        ))}
      </div>
      <div className="records-summary-row records-summary-values" role="row">
        {metrics.map((metric) => (
          <strong key={metric.label} role="cell">{metric.value}</strong>
        ))}
      </div>
    </div>
  )
}

function RecentOrderList({
  copy,
  recordsCopy,
  orders,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  orders: OrderHistoryRecord[]
}) {
  if (orders.length === 0) {
    return <p className="account-records-empty">{copy.recentOrdersEmpty}</p>
  }

  return (
    <div className="records-summary-table records-summary-table--orders" role="table">
      <div className="records-summary-row records-summary-head" role="row">
        <span role="columnheader">{recordsCopy.createdAt}</span>
        <span role="columnheader">{recordsCopy.side}</span>
        <span role="columnheader">{recordsCopy.archiveOrderContracts}</span>
        <span role="columnheader">{recordsCopy.archiveOrderPrice}</span>
      </div>
      {orders.slice(0, 5).map((order) => (
        <div key={order.id} className="records-summary-row records-summary-order" role="row">
          <time dateTime={order.createdAt} role="cell">{formatSavedAtCompact(order.createdAt)}</time>
          <span className={`records-summary-side records-summary-side--${order.positionSide}`} role="cell">
            {order.positionSide}
          </span>
          <strong role="cell">{formatNumber(order.orderContracts)}</strong>
          <strong role="cell">{formatNumber(order.orderPrice)}</strong>
        </div>
      ))}
    </div>
  )
}

export function AccountRecordsSummaryPanel({
  copy,
  recordsCopy,
  loading,
  error,
  notice,
  latestSnapshot,
  recentOrders,
  archiveHref,
  autoSaveEnabled,
  autoSaveBusy,
  onAutoSaveChange,
  onRetry,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  loading: boolean
  error: string | null
  notice: string | null
  latestSnapshot: AccountSnapshotRecord | null
  recentOrders: OrderHistoryRecord[]
  archiveHref: string
  autoSaveEnabled: boolean
  autoSaveBusy: boolean
  onAutoSaveChange: (enabled: boolean) => void
  onRetry: () => void
}) {
  const recentOrderCount =
    recentOrders.length > 0
      ? copy.recordsCount.replace('{count}', String(recentOrders.length))
      : copy.recordsEmpty

  return (
    <section
      id="my-page-records-summary"
      className="my-page-panel records-summary-panel"
      aria-labelledby="my-page-records-summary-title"
    >
      <div className="my-page-panel-head">
        <div>
          <h2 id="my-page-records-summary-title">{copy.recordsSummaryTitle}</h2>
          <p>{copy.storageBody}</p>
        </div>
        <a className="records-summary-link" href={archiveHref}>
          {copy.recordsArchiveLink}
        </a>
      </div>

      <label className="my-page-toggle records-summary-toggle">
        <input
          type="checkbox"
          checked={autoSaveEnabled}
          disabled={autoSaveBusy}
          onChange={(event) => onAutoSaveChange(event.currentTarget.checked)}
        />
        <span>{copy.autoSaveOrderHistoryLabel}</span>
      </label>
      <p className="my-page-field-help">{copy.autoSaveOrderHistoryHint}</p>

      {notice && <p className="account-records-notice" role="status">{notice}</p>}
      {error && (
        <div className="account-records-error" role="alert">
          <span>{error}</span>
          <button type="button" className="link-btn" onClick={onRetry}>
            {recordsCopy.retry}
          </button>
        </div>
      )}

      {loading ? (
        <p className="account-records-empty" role="status">{recordsCopy.loading}</p>
      ) : (
        <div className="records-summary-grid">
          <section className="records-summary-block">
            <div className="records-summary-block-head">
              <h3>{copy.latestSnapshotTitle}</h3>
            </div>
            <LatestSnapshotSummary
              copy={copy}
              recordsCopy={recordsCopy}
              snapshot={latestSnapshot}
            />
          </section>
          <section className="records-summary-block">
            <div className="records-summary-block-head">
              <h3>{copy.recentOrdersTitle}</h3>
              <span>{recentOrderCount}</span>
            </div>
            <RecentOrderList copy={copy} recordsCopy={recordsCopy} orders={recentOrders} />
          </section>
        </div>
      )}
    </section>
  )
}

function suggestedBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function AccountSnapshotAutomationPanel({
  copy,
  isPro,
  hasCloudInput,
  settings,
  busy = false,
  notice = null,
  browserTimeZone,
  onSave,
  onDisable,
}: {
  copy: MyPageCopy
  isPro: boolean
  hasCloudInput: boolean
  settings: AccountSnapshotAutomationSettings | null
  busy?: boolean
  notice?: string | null
  browserTimeZone: string
  onSave: (settings: AccountSnapshotAutomationSettingsInput) => void
  onDisable: () => void
}) {
  const [label, setLabel] = useState(settings?.label ?? copy.autoSnapshotDefaultLabel)
  const [timeZone, setTimeZone] = useState(settings?.timeZone ?? browserTimeZone)
  const [timeOfDay, setTimeOfDay] = useState(settings?.timeOfDay ?? '16:00')
  const canEnable = isPro && hasCloudInput

  return (
    <section className="my-page-preference-block" aria-labelledby="auto-snapshot-title">
      <div className="my-page-panel-head">
        <div>
          <h3 id="auto-snapshot-title">{copy.autoSnapshotTitle}</h3>
          <p>{copy.autoSnapshotBody}</p>
        </div>
      </div>

      {!isPro && <p className="my-page-alert">{copy.autoSnapshotProRequired}</p>}
      {isPro && !hasCloudInput && (
        <p className="my-page-alert">{copy.autoSnapshotCloudRequired}</p>
      )}

      <form
        className="my-page-automation-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!canEnable || busy) return
          onSave({ enabled: true, label, timeZone, timeOfDay })
        }}
      >
        <label className="my-page-field">
          <span>{copy.autoSnapshotLabelLabel}</span>
          <input
            value={label}
            placeholder={copy.autoSnapshotLabelPlaceholder}
            disabled={!canEnable || busy}
            onChange={(event) => setLabel(event.currentTarget.value)}
            required
          />
        </label>
        <label className="my-page-field">
          <span>{copy.autoSnapshotTimeZoneLabel}</span>
          <input
            value={timeZone}
            disabled={!canEnable || busy}
            onChange={(event) => setTimeZone(event.currentTarget.value)}
            required
          />
        </label>
        <label className="my-page-field">
          <span>{copy.autoSnapshotTimeOfDayLabel}</span>
          <input
            type="time"
            value={timeOfDay}
            disabled={!canEnable || busy}
            onChange={(event) => setTimeOfDay(event.currentTarget.value)}
            required
          />
        </label>
        <div className="my-page-actions my-page-automation-actions">
          <button type="submit" className="btn btn-primary" disabled={!canEnable || busy}>
            {busy ? copy.autoSnapshotSaving : copy.autoSnapshotSave}
          </button>
          {settings?.enabled && (
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={onDisable}
            >
              {copy.autoSnapshotDisable}
            </button>
          )}
        </div>
      </form>

      {(settings?.nextRunAt || settings?.lastRunAt || notice) && (
        <div className="my-page-automation-meta">
          {settings?.nextRunAt && (
            <p className="my-page-field-help">
              {copy.autoSnapshotNextRun.replace('{date}', formatSavedAtCompact(settings.nextRunAt))}
            </p>
          )}
          {settings?.lastRunAt && (
            <p className="my-page-field-help">
              {copy.autoSnapshotLastRun.replace('{date}', formatSavedAtCompact(settings.lastRunAt))}
            </p>
          )}
          {notice && <p className="my-page-form-message" role="status">{notice}</p>}
        </div>
      )}
    </section>
  )
}

function NumberSetRow({
  copy,
  numberSet,
  active,
  busy,
  onRenameNumberSet,
  onDeleteNumberSet,
  onSelectNumberSet,
}: {
  copy: MyPageCopy
  numberSet: CalculatorNumberSet
  active: boolean
  busy: boolean
  onRenameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => void
  onDeleteNumberSet: (mode: SaveStorageMode, setId: string) => void
  onSelectNumberSet: (mode: SaveStorageMode, setId: string) => void
}) {
  const [titleDraft, setTitleDraft] = useState(numberSet.title)

  return (
    <li className="my-page-number-set-row">
      <div className="my-page-number-set-main">
        <input
          value={titleDraft}
          aria-label={copy.numberSetNamePlaceholder}
          placeholder={copy.numberSetNamePlaceholder}
          disabled={busy}
          onChange={(event) => setTitleDraft(event.currentTarget.value)}
        />
        <span>
          {numberSet.storageMode === 'local' ? copy.numberSetsLocalTitle : copy.numberSetsCloudTitle}
        </span>
      </div>
      {active && <span className="my-page-number-set-active">{copy.activeNumberSet}</span>}
      <div className="my-page-number-set-actions">
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy || titleDraft.trim() === numberSet.title}
          onClick={() => onRenameNumberSet(numberSet.storageMode, numberSet.id, titleDraft)}
        >
          {copy.renameNumberSet}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy || active}
          onClick={() => onSelectNumberSet(numberSet.storageMode, numberSet.id)}
        >
          {active ? copy.activeNumberSet : copy.selectNumberSet}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => onDeleteNumberSet(numberSet.storageMode, numberSet.id)}
        >
          {copy.deleteNumberSet}
        </button>
      </div>
    </li>
  )
}

function NumberSetPreferencesPanel({
  copy,
  localNumberSets,
  cloudNumberSets,
  activeNumberSetId,
  numberSetLimits,
  busy,
  notice,
  onCreateNumberSet,
  onRenameNumberSet,
  onDeleteNumberSet,
  onSelectNumberSet,
}: {
  copy: MyPageCopy
  localNumberSets: CalculatorNumberSet[]
  cloudNumberSets: CalculatorNumberSet[]
  activeNumberSetId: string | null
  numberSetLimits: Record<SaveStorageMode, number>
  busy: boolean
  notice: string | null
  onCreateNumberSet: (mode: SaveStorageMode) => void
  onRenameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => void
  onDeleteNumberSet: (mode: SaveStorageMode, setId: string) => void
  onSelectNumberSet: (mode: SaveStorageMode, setId: string) => void
}) {
  const allNumberSets = [...localNumberSets, ...cloudNumberSets]

  return (
    <section className="my-page-preference-block my-page-number-sets">
      <div className="my-page-panel-head">
        <div>
          <h3>{copy.numberSetsTitle}</h3>
          <p>{copy.numberSetsBody}</p>
        </div>
      </div>

      <div className="my-page-number-set-usage">
        <div className="my-page-number-set-usage-card">
          <span>{copy.numberSetsLocalTitle}</span>
          <strong>
            {localNumberSets.length} / {numberSetLimits.local}
          </strong>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || localNumberSets.length >= numberSetLimits.local}
            onClick={() => onCreateNumberSet('local')}
          >
            {copy.addLocalNumberSet}
          </button>
        </div>
        <div className="my-page-number-set-usage-card">
          <span>{copy.numberSetsCloudTitle}</span>
          <strong>
            {cloudNumberSets.length} / {numberSetLimits.cloud}
          </strong>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || cloudNumberSets.length >= numberSetLimits.cloud}
            onClick={() => onCreateNumberSet('cloud')}
          >
            {copy.addCloudNumberSet}
          </button>
        </div>
      </div>

      <ul className="my-page-number-set-list">
        {allNumberSets.map((numberSet) => (
          <NumberSetRow
            key={`${numberSet.storageMode}:${numberSet.id}:${numberSet.title}`}
            copy={copy}
            numberSet={numberSet}
            active={activeNumberSetId === numberSet.id}
            busy={busy}
            onRenameNumberSet={onRenameNumberSet}
            onDeleteNumberSet={onDeleteNumberSet}
            onSelectNumberSet={onSelectNumberSet}
          />
        ))}
      </ul>
      <p className="my-page-field-help">{copy.numberSetsLimitNote}</p>
      {notice && <p className="my-page-form-message" role="status">{notice}</p>}
    </section>
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
  recordsSummaryPanel,
  preferencesPanel,
  billingPanel,
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
          <>
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
                className="my-page-panel my-page-account-hub"
                aria-labelledby="my-page-profile-title"
              >
                <h2 id="my-page-profile-title" className="my-page-sr-only">
                  {copy.navAccount}
                </h2>
                <div className="my-page-account-hub__head">
                  <div className="my-page-account-hub__identity">
                    <span className="my-page-avatar" aria-hidden="true">
                      {user.nickname.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div className="my-page-account-hub__identity-copy">
                      <div className="my-page-account-hub__name-row">
                        <strong className="my-page-account-hub__name" title={user.nickname}>
                          {user.nickname}
                        </strong>
                        <span className={`my-page-badge${isPro ? '' : ' my-page-badge--muted'}`}>
                          {isPro ? copy.billing.statusPro : copy.billing.statusFree}
                        </span>
                      </div>
                      <span className="my-page-identity-meta" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={onSignOut}>
                    {copy.signOut}
                  </button>
                </div>

                <div className="my-page-account-hub__grid">
                  <form
                    className="my-page-account-hub__block my-page-field my-page-nickname-form"
                    onSubmit={submitNickname}
                  >
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
                  {billingPanel && (
                    <div className="my-page-account-hub__block my-page-account-hub__billing">
                      {billingPanel}
                    </div>
                  )}
                </div>
                <div
                  className="my-page-account-hub__block my-page-account-hub__logins"
                  aria-labelledby="my-page-linked-logins-title"
                >
                  <h3 id="my-page-linked-logins-title">{copy.linkedLoginTitle}</h3>
                  <p className="my-page-linked-logins-note">{copy.linkedLoginBody}</p>
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
                </div>
              </section>

              {recordsSummaryPanel}

              {preferencesPanel}

              <section
                id="my-page-support"
                className="my-page-panel"
                aria-labelledby="my-page-support-title"
              >
                <div className="my-page-support-grid">
                  <div>
                    <h2 id="my-page-support-title">{copy.supportTitle}</h2>
                    <p>{copy.supportBody}</p>
                    <div className="my-page-support-channels">
                      <a className="my-page-support-channel" href={suggestionsHref}>
                        <span className="my-page-support-channel__icon" aria-hidden="true">
                          <LightbulbIcon />
                        </span>
                        <span className="my-page-support-channel__body">
                          <span className="my-page-support-channel__title">
                            {copy.suggestionsLink}
                          </span>
                          <span className="my-page-support-channel__desc">
                            {copy.suggestionsDesc}
                          </span>
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
                            <span className="my-page-support-channel__desc">
                              {copy.adminFeedbackDesc}
                            </span>
                          </span>
                          <span className="my-page-support-channel__arrow" aria-hidden="true">
                            →
                          </span>
                        </a>
                      )}
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
            </div>
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
    setPasswordForCurrentUser,
    setAutoSaveOrderHistory,
    isPro,
  } = useAuth()
  const {
    numberSets,
    activeNumberSetId,
    numberSetLimits,
    createNumberSet,
    renameNumberSet,
    deleteNumberSetById,
    selectNumberSet,
  } = useCalculator()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [identityBusy, setIdentityBusy] = useState<'link' | 'unlink' | 'setPassword' | null>(null)
  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [passwordDraft, setPasswordDraft] = useState('')
  const [passwordConfirmationDraft, setPasswordConfirmationDraft] = useState('')
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
  }>({
    userId: null,
    error: null,
    hasCloudInput: false,
  })
  const recordsRepository = useMemo(() => createAccountRecordsRepository(), [])
  const [recordsState, setRecordsState] = useState<{
    userId: string | null
    loading: boolean
    error: string | null
    notice: string | null
    latestSnapshot: AccountSnapshotRecord | null
    recentOrders: OrderHistoryRecord[]
  }>({
    userId: null,
    loading: false,
    error: null,
    notice: null,
    latestSnapshot: null,
    recentOrders: [],
  })
  const [autoSaveBusy, setAutoSaveBusy] = useState(false)
  const [automationSettings, setAutomationSettings] =
    useState<AccountSnapshotAutomationSettings | null>(null)
  const [automationBusy, setAutomationBusy] = useState(false)
  const [automationNotice, setAutomationNotice] = useState<string | null>(null)
  const [numberSetBusy, setNumberSetBusy] = useState(false)
  const [numberSetNotice, setNumberSetNotice] = useState<string | null>(null)
  const browserTimeZone = useMemo(() => suggestedBrowserTimeZone(), [])
  const automationPanelKey = [
    automationSettings?.updatedAt ?? 'new',
    automationSettings?.label ?? t.myPage.autoSnapshotDefaultLabel,
    automationSettings?.timeZone ?? browserTimeZone,
    automationSettings?.timeOfDay ?? '16:00',
  ].join('|')

  const nicknameDraft =
    nicknameState.userId === (user?.id ?? null) ? nicknameState.value : user?.nickname ?? ''
  const nicknameMessage =
    nicknameMessageState.userId === (user?.id ?? null) ? nicknameMessageState.value : null
  const identityMessage =
    identityMessageState.userId === (user?.id ?? null) ? identityMessageState.value : null
  const hasCloudInput = user && storageState.userId === user.id ? storageState.hasCloudInput : false
  const recordsLoading = user && recordsState.userId === user.id ? recordsState.loading : false
  const recordsError = user && recordsState.userId === user.id ? recordsState.error : null
  const recordsNotice = user && recordsState.userId === user.id ? recordsState.notice : null
  const latestSnapshot =
    user && recordsState.userId === user.id ? recordsState.latestSnapshot : null
  const recentOrders = user && recordsState.userId === user.id ? recordsState.recentOrders : []
  const localNumberSets = numberSets.filter((numberSet) => numberSet.storageMode === 'local')
  const cloudNumberSets = numberSets.filter((numberSet) => numberSet.storageMode === 'cloud')

  useEffect(() => {
    if (!user) {
      setPasswordFormOpen(false)
      setPasswordDraft('')
      setPasswordConfirmationDraft('')
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setStorageState({
        userId: null,
        error: null,
        hasCloudInput: false,
      })
      return
    }

    let active = true

    fetchNumberSets(user.id)
      .then((numberSetResult) => {
        if (!active) return
        if (numberSetResult.error) {
          setStorageState({
            userId: user.id,
            error: t.myPage.storageError,
            hasCloudInput: false,
          })
          return
        }
        const cloudSets = numberSetResult.data ?? []
        setStorageState({
          userId: user.id,
          error: null,
          hasCloudInput: cloudSets.length > 0,
        })
      })
      .catch(() => {
        if (active) {
          setStorageState({
            userId: user.id,
            error: t.myPage.storageError,
            hasCloudInput: false,
          })
        }
      })

    return () => {
      active = false
    }
  }, [t.myPage.storageError, user])

  const loadRecordsSummary = useCallback(async () => {
    if (!user) {
      setRecordsState({
        userId: null,
        loading: false,
        error: null,
        notice: null,
        latestSnapshot: null,
        recentOrders: [],
      })
      return
    }

    const userId = user.id
    setRecordsState((prev) => ({
      userId,
      loading: true,
      error: null,
      notice: prev.userId === userId ? prev.notice : null,
      latestSnapshot: prev.userId === userId ? prev.latestSnapshot : null,
      recentOrders: prev.userId === userId ? prev.recentOrders : [],
    }))

    const result = await recordsRepository.fetchRecentRecords(userId, 5)
    if (result.error !== null) {
      setRecordsState({
        userId,
        loading: false,
        error: t.accountRecords.loadError,
        notice: null,
        latestSnapshot: null,
        recentOrders: [],
      })
      return
    }

    setRecordsState({
      userId,
      loading: false,
      error: null,
      notice: null,
      latestSnapshot: result.data.accountSnapshots[0] ?? null,
      recentOrders: result.data.orderHistory.slice(0, 5),
    })
  }, [recordsRepository, t.accountRecords.loadError, user])

  useEffect(() => {
    void loadRecordsSummary()
  }, [loadRecordsSummary])

  useEffect(() => {
    if (!user) {
      setAutomationSettings(null)
      setAutomationNotice(null)
      return
    }

    let active = true
    recordsRepository.fetchAccountSnapshotSettings(user.id)
      .then((result) => {
        if (!active) return
        if (result.error) {
          setAutomationNotice(t.myPage.autoSnapshotError)
          return
        }
        setAutomationSettings(result.data)
      })
      .catch(() => {
        if (active) setAutomationNotice(t.myPage.autoSnapshotError)
      })

    return () => {
      active = false
    }
  }, [recordsRepository, t.myPage.autoSnapshotError, user])

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
      validateNewPassword(passwordDraft) ??
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

  const handleAutomationSave = useCallback(
    async (settings: AccountSnapshotAutomationSettingsInput) => {
      if (!user || automationBusy) return
      setAutomationBusy(true)
      setAutomationNotice(null)
      const result = await recordsRepository.saveAccountSnapshotSettings(user.id, settings)
      setAutomationBusy(false)
      if (result.error) {
        setAutomationNotice(t.myPage.autoSnapshotError)
        return
      }
      setAutomationSettings(result.data)
      setAutomationNotice(t.myPage.autoSnapshotSaved)
    },
    [
      automationBusy,
      recordsRepository,
      t.myPage.autoSnapshotError,
      t.myPage.autoSnapshotSaved,
      user,
    ],
  )

  const handleAutomationDisable = useCallback(async () => {
    if (!user || automationBusy) return
    setAutomationBusy(true)
    setAutomationNotice(null)
    const result = await recordsRepository.disableAccountSnapshotSettings(user.id)
    setAutomationBusy(false)
    if (result.error) {
      setAutomationNotice(t.myPage.autoSnapshotError)
      return
    }
    setAutomationSettings(result.data)
    setAutomationNotice(t.myPage.autoSnapshotDisabled)
  }, [
    automationBusy,
    recordsRepository,
    t.myPage.autoSnapshotDisabled,
    t.myPage.autoSnapshotError,
    user,
  ])

  const handleAutoSaveOrderHistory = useCallback(
    async (enabled: boolean) => {
      if (!user || autoSaveBusy) return
      setAutoSaveBusy(true)
      setRecordsState((prev) => ({ ...prev, userId: user.id, notice: null }))
      const error = await setAutoSaveOrderHistory(enabled)
      setAutoSaveBusy(false)
      if (error) {
        setRecordsState((prev) => ({
          ...prev,
          userId: user.id,
          notice: t.myPage.autoSaveOrderHistoryError,
        }))
      }
    },
    [autoSaveBusy, setAutoSaveOrderHistory, t.myPage.autoSaveOrderHistoryError, user],
  )

  const runNumberSetAction = useCallback(
    async (action: () => Promise<string | null>) => {
      if (!user || numberSetBusy) return
      setNumberSetBusy(true)
      setNumberSetNotice(null)
      const error = await action()
      setNumberSetBusy(false)
      if (error === 'number_set_limit_reached') setNumberSetNotice(t.myPage.numberSetLimitReached)
      else if (error === 'not_logged_in') setNumberSetNotice(t.myPage.numberSetLoginRequired)
      else if (error) setNumberSetNotice(t.myPage.numberSetError)
    },
    [
      numberSetBusy,
      t.myPage.numberSetError,
      t.myPage.numberSetLimitReached,
      t.myPage.numberSetLoginRequired,
      user,
    ],
  )

  const handleCreateNumberSet = useCallback(
    (mode: SaveStorageMode) => {
      void runNumberSetAction(() => createNumberSet(mode))
    },
    [createNumberSet, runNumberSetAction],
  )

  const handleRenameNumberSet = useCallback(
    (mode: SaveStorageMode, setId: string, title: string) => {
      void runNumberSetAction(() => renameNumberSet(mode, setId, title))
    },
    [renameNumberSet, runNumberSetAction],
  )

  const handleDeleteNumberSet = useCallback(
    (mode: SaveStorageMode, setId: string) => {
      void runNumberSetAction(() => deleteNumberSetById(mode, setId))
    },
    [deleteNumberSetById, runNumberSetAction],
  )

  const handleSelectNumberSet = useCallback(
    (mode: SaveStorageMode, setId: string) => {
      void runNumberSetAction(() => selectNumberSet(mode, setId))
    },
    [runNumberSetAction, selectNumberSet],
  )

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
        passwordFormOpen={passwordFormOpen}
        passwordDraft={passwordDraft}
        passwordConfirmationDraft={passwordConfirmationDraft}
        supportHref={`mailto:${CONTACT_EMAIL}`}
        suggestionsHref={boardPath('suggestions')}
        adminFeedbackHref={user?.isAdmin ? ADMIN_FEEDBACK_PATH : undefined}
        recordsSummaryPanel={
          user ? (
            <AccountRecordsSummaryPanel
              copy={t.myPage}
              recordsCopy={t.accountRecords}
              loading={recordsLoading}
              error={recordsError}
              notice={recordsNotice}
              latestSnapshot={latestSnapshot}
              recentOrders={recentOrders}
              archiveHref={RECORDS_PATH}
              autoSaveEnabled={user.autoSaveOrderHistory}
              autoSaveBusy={autoSaveBusy}
              onAutoSaveChange={handleAutoSaveOrderHistory}
              onRetry={() => void loadRecordsSummary()}
            />
          ) : null
        }
        preferencesPanel={
          user ? (
            <section
              id="my-page-preferences"
              className="my-page-panel"
              aria-labelledby="my-page-preferences-title"
            >
              <h2 id="my-page-preferences-title">{t.myPage.preferencesTitle}</h2>
              <NumberSetPreferencesPanel
                copy={t.myPage}
                localNumberSets={localNumberSets}
                cloudNumberSets={cloudNumberSets}
                activeNumberSetId={activeNumberSetId}
                numberSetLimits={numberSetLimits}
                busy={numberSetBusy}
                notice={numberSetNotice}
                onCreateNumberSet={handleCreateNumberSet}
                onRenameNumberSet={handleRenameNumberSet}
                onDeleteNumberSet={handleDeleteNumberSet}
                onSelectNumberSet={handleSelectNumberSet}
              />
              <AccountSnapshotAutomationPanel
                key={automationPanelKey}
                copy={t.myPage}
                isPro={isPro}
                hasCloudInput={hasCloudInput}
                settings={automationSettings}
                busy={automationBusy}
                notice={automationNotice}
                browserTimeZone={browserTimeZone}
                onSave={(settings) => void handleAutomationSave(settings)}
                onDisable={() => void handleAutomationDisable()}
              />
              <div className="my-page-preference-block">
                <h3>{t.myPage.privacyTitle}</h3>
                <p>{t.myPage.privacyBody}</p>
                <ul className="my-page-note-list">
                  <li>{t.myPage.localStorageNote}</li>
                  <li>{t.myPage.cloudStorageNote}</li>
                </ul>
              </div>
            </section>
          ) : null
        }
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
