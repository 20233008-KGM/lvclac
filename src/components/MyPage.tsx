import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { RECORDS_PATH } from '../config/routes'
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
import {
  fetchNumberSetDeletionSummary,
  fetchNumberSets,
  type RolloverSettings,
} from '../db/numberSets'
import {
  computeNextRolloverDate,
  type RolloverAnchor,
  type RolloverIntervalMonths,
} from '../db/rolloverSchedule'
import type { AuthUser } from '../db/profile'
import type { Messages } from '../i18n/types'
import { PRESET_IDS, useLanguage, type PresetId } from '../i18n'
import {
  formatLeverageValue,
  formatNumber,
  formatPercent,
  formatSavedAtCompact,
} from '../utils/format'
import {
  createAccountRecordSlotTitles,
  resolveAccountRecordSlotLabel,
} from '../utils/accountRecordSlot'
import { authErrorMessage } from './auth/authMessages'
import { GoogleLogo } from './auth/GoogleLogo'
import { validateNewPassword, validatePasswordConfirmation } from '../auth/validation'
import { calculateEvaluate } from '../calc/leverage'
import { BillingPanel } from './billing/BillingPanel'
import { NumberSetDetailModal } from './NumberSetDetailModal'
import { ToggleSwitch } from './ToggleSwitch'
import { TimeZoneSelect } from './TimeZoneSelect'
import {
  readPreferredSnapshotTimeZone,
  writePreferredSnapshotTimeZone,
} from './welcomePreferences'
import { SiteFooter } from './SiteFooter'
import type { NumberSetDeleteSummaryState } from './NumberSetDeleteConfirmModal'
import '../styles/pages.css'
// 로그아웃 /my 뷰의 Google 로그인 버튼(.google-btn)은 auth-dialog.css에 정의돼 있다.
// AuthModal이 열리기 전에도 스타일이 적용되도록 여기서 직접 로드한다(기존 스타일 재사용).
import '../styles/auth-dialog.css'

const AuthModal = lazy(() => import('./auth/AuthModal').then((mod) => ({ default: mod.AuthModal })))
const NumberSetDeleteConfirmModal = lazy(() => import('./NumberSetDeleteConfirmModal'))

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

/** 각 내비 항목에 대응하는, 현재 문서에 실재하는 첫 섹션 엘리먼트를 문서 순서대로 모은다. */
function collectNavSections(): { href: MyPageNavHref; element: HTMLElement }[] {
  const sections: { href: MyPageNavHref; element: HTMLElement }[] = []
  for (const item of MY_PAGE_NAV_ITEMS) {
    const element = item.sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .find((node): node is HTMLElement => node != null)
    if (element) sections.push({ href: item.href, element })
  }
  return sections
}

function useMyPageNavActive(enabled: boolean) {
  const [activeHref, setActiveHref] = useState(() =>
    typeof window === 'undefined' ? MY_PAGE_NAV_ITEMS[0].href : resolveMyPageNavHref(window.location.hash),
  )

  useEffect(() => {
    if (!enabled) return

    // 섹션 높이 편차가 커서(환경설정 패널은 매우 김) 화면 점유 "비율"로 현재 섹션을
    // 고르면 큰 섹션이 늘 손해를 본다. 대신 뷰포트 상단 30% 지점의 기준선을 넘어선
    // 마지막 섹션을 현재 섹션으로 본다 — 높이와 무관하게 스크롤 위치를 그대로 반영한다.
    let frame = 0

    const computeActive = () => {
      frame = 0
      const sections = collectNavSections()
      if (sections.length === 0) return

      const line = window.innerHeight * 0.3
      let current = sections[0].href
      for (const { href, element } of sections) {
        if (element.getBoundingClientRect().top <= line) current = href
        else break
      }

      // 페이지 맨 아래에 닿으면 마지막 섹션이 기준선까지 못 올라와도 활성화한다.
      const reachedBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (reachedBottom) current = sections[sections.length - 1].href

      setActiveHref((prev) => (prev === current ? prev : current))
    }

    const requestCompute = () => {
      if (frame) return
      frame = window.requestAnimationFrame(computeActive)
    }

    const onHashChange = () => {
      setActiveHref(resolveMyPageNavHref(window.location.hash))
    }

    computeActive()
    window.addEventListener('scroll', requestCompute, { passive: true })
    window.addEventListener('resize', requestCompute)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestCompute)
      window.removeEventListener('resize', requestCompute)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [enabled])

  const onNavClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: MyPageNavHref) => {
      // 새 탭/보조 클릭 등은 브라우저 기본 동작에 맡긴다.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return
      }
      const target = MY_PAGE_NAV_ITEMS.find((item) => item.href === href)
      const element = target?.sectionIds
        .map((sectionId) => document.getElementById(sectionId))
        .find((node): node is HTMLElement => node != null)
      if (!element) return

      event.preventDefault()
      setActiveHref(href)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
      // 스크롤을 다시 튀게 하지 않으면서 주소창 해시만 맞춰 둔다.
      if (window.location.hash !== href) {
        window.history.replaceState(null, '', href)
      }
    },
    [],
  )

  return { activeHref, onNavClick }
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
  recordsSummaryPanel?: ReactNode
  preferencesPanel?: ReactNode
  /** 구독 결제 패널. 로그인 사용자에게만 주입된다. */
  billingPanel?: ReactNode
  /** 개발 전용 계정 초기화 패널. 프로덕션에서는 null. */
  devResetPanel?: ReactNode
  onNicknameChange: (value: string) => void
  /** 닉네임 저장. 성공하면 true를 반환해 인라인 편집을 닫는다. */
  onNicknameSubmit: () => Promise<boolean>

  onLinkGoogle: () => void
  onUnlinkGoogle: () => void
  onPasswordFormToggle: () => void
  onPasswordDraftChange: (value: string) => void
  onPasswordConfirmationDraftChange: (value: string) => void
  onSetPasswordSubmit: () => void
  onLoginClick: () => void
  onGoogleLogin: () => void
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

function RecentSnapshotList({
  copy,
  recordsCopy,
  snapshots,
  slotTitles,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  snapshots: AccountSnapshotRecord[]
  slotTitles: ReadonlyMap<string, string>
}) {
  if (snapshots.length === 0) {
    return <p className="account-records-empty">{copy.recentSnapshotsEmpty}</p>
  }

  return (
    <div
      className="records-summary-table records-summary-table--snapshot records-summary-table--recent-snapshots"
      role="table"
    >
      <div className="records-summary-row records-summary-head" role="row">
        <span role="columnheader">{recordsCopy.savedAtAndSlot}</span>
        <span role="columnheader">{recordsCopy.summaryAccountEquity}</span>
        <span role="columnheader">{recordsCopy.summaryLiquidationBuffer}</span>
        <span role="columnheader">{recordsCopy.summaryLeverage}</span>
      </div>
      {snapshots.map((snapshot) => {
        const slotLabel = resolveAccountRecordSlotLabel(
          snapshot.numberSetId,
          slotTitles,
          recordsCopy.slotFilterUnassigned,
          recordsCopy.slotNameUnavailable,
        )
        return (
          <div key={snapshot.id} className="records-summary-row records-summary-snapshot" role="row">
            <div className="records-summary-record-meta" role="cell">
              <time dateTime={snapshot.createdAt}>{formatSavedAtCompact(snapshot.createdAt)}</time>
              <span className="records-summary-record-slot" title={slotLabel}>
                {slotLabel}
              </span>
            </div>
            <strong role="cell">{formatNumber(snapshot.inputs.accountEval ?? null)}</strong>
            <strong role="cell">{formatPercent(snapshot.result.toleranceRate)}</strong>
            <strong role="cell">{formatLeverageValue(snapshot.result.leverageRatio)}</strong>
          </div>
        )
      })}
    </div>
  )
}

function RecentOrderList({
  copy,
  recordsCopy,
  orders,
  slotTitles,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  orders: OrderHistoryRecord[]
  slotTitles: ReadonlyMap<string, string>
}) {
  if (orders.length === 0) {
    return <p className="account-records-empty">{copy.recentOrdersEmpty}</p>
  }

  return (
    <div className="records-summary-table records-summary-table--orders" role="table">
      <div className="records-summary-row records-summary-head" role="row">
        <span role="columnheader">{recordsCopy.savedAtAndSlot}</span>
        <span role="columnheader">{recordsCopy.side}</span>
        <span role="columnheader">{recordsCopy.archiveOrderContracts}</span>
        <span role="columnheader">{recordsCopy.archiveOrderPrice}</span>
      </div>
      {orders.slice(0, 5).map((order) => {
        const slotLabel = resolveAccountRecordSlotLabel(
          order.numberSetId,
          slotTitles,
          recordsCopy.slotFilterUnassigned,
          recordsCopy.slotNameUnavailable,
        )
        return (
          <div key={order.id} className="records-summary-row records-summary-order" role="row">
            <div className="records-summary-record-meta" role="cell">
              <time dateTime={order.createdAt}>{formatSavedAtCompact(order.createdAt)}</time>
              <span className="records-summary-record-slot" title={slotLabel}>
                {slotLabel}
              </span>
            </div>
            <span className={`records-summary-side records-summary-side--${order.positionSide}`} role="cell">
              {order.positionSide}
            </span>
            <strong role="cell">{formatNumber(order.orderContracts)}</strong>
            <strong role="cell">{formatNumber(order.orderPrice)}</strong>
          </div>
        )
      })}
    </div>
  )
}

export function AccountRecordsSummaryPanel({
  copy,
  recordsCopy,
  loading,
  error,
  recentSnapshots,
  recentOrders,
  slots = [],
  archiveHref,
  onRetry,
}: {
  copy: MyPageCopy
  recordsCopy: AccountRecordsCopy
  loading: boolean
  error: string | null
  recentSnapshots: AccountSnapshotRecord[]
  recentOrders: OrderHistoryRecord[]
  slots?: { id: string; title: string }[]
  archiveHref: string
  onRetry: () => void
}) {
  const slotTitles = useMemo(() => createAccountRecordSlotTitles(slots), [slots])
  const visibleSnapshots = recentSnapshots.slice(0, 5)
  const recentSnapshotCount =
    visibleSnapshots.length > 0
      ? copy.recordsCount.replace('{count}', String(visibleSnapshots.length))
      : copy.recordsEmpty
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
        </div>
        <a className="records-summary-link" href={archiveHref}>
          {copy.recordsArchiveLink}
        </a>
      </div>

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
              <h3>{copy.recentSnapshotsTitle}</h3>
              <span>{recentSnapshotCount}</span>
            </div>
            <RecentSnapshotList
              copy={copy}
              recordsCopy={recordsCopy}
              snapshots={visibleSnapshots}
              slotTitles={slotTitles}
            />
          </section>
          <section className="records-summary-block">
            <div className="records-summary-block-head">
              <h3>{copy.recentOrdersTitle}</h3>
              <span>{recentOrderCount}</span>
            </div>
            <RecentOrderList
              copy={copy}
              recordsCopy={recordsCopy}
              orders={recentOrders}
              slotTitles={slotTitles}
            />
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

/**
 * 계좌스냅샷 자동 저장 설정 행. 시간대 + 스냅샷 시각 + 사용 토글로 구성한다.
 * 시간대는 전체 IANA 목록에서 검색으로 직접 고른다(기본값은 브라우저 추정 시간대).
 * 토글 ON이 곧 규칙 저장, OFF가 규칙 해제다. 켜진 상태에서 시간대·시각을 바꾸면 즉시 재저장한다.
 */
export function AccountSnapshotAutomationPanel({
  copy,
  isPro,
  hasCloudInput,
  settings,
  busy = false,
  notice = null,
  timeZone,
  onTimeZoneChange,
  onSave,
  onDisable,
}: {
  copy: MyPageCopy
  isPro: boolean
  hasCloudInput: boolean
  settings: AccountSnapshotAutomationSettings | null
  busy?: boolean
  notice?: string | null
  /** 현재 선택된 IANA 시간대 — 저장 시 규칙의 timeZone으로 쓴다. */
  timeZone: string
  onTimeZoneChange: (timeZone: string) => void
  onSave: (settings: AccountSnapshotAutomationSettingsInput) => void
  onDisable: () => void
}) {
  const [timeOfDay, setTimeOfDay] = useState(settings?.timeOfDay ?? '16:00')
  const canEnable = isPro && hasCloudInput
  const enabled = settings?.enabled ?? false
  const ruleLabel = settings?.label?.trim() ? settings.label : copy.autoSnapshotDefaultLabel

  const handleToggle = (next: boolean) => {
    if (busy) return
    if (next) {
      if (!canEnable) return
      onSave({ enabled: true, label: ruleLabel, timeZone, timeOfDay })
    } else {
      onDisable()
    }
  }

  const handleTimeChange = (next: string) => {
    setTimeOfDay(next)
    if (enabled && canEnable && !busy && next) {
      onSave({ enabled: true, label: ruleLabel, timeZone, timeOfDay: next })
    }
  }

  const handleTimeZoneChange = (nextTimeZone: string) => {
    onTimeZoneChange(nextTimeZone)
    if (enabled && canEnable && !busy) {
      onSave({ enabled: true, label: ruleLabel, timeZone: nextTimeZone, timeOfDay })
    }
  }

  return (
    <div
      className="my-page-setting-line my-page-setting-line--top"
      aria-labelledby="auto-snapshot-title"
    >
      <div className="my-page-setting-line__copy">
        <h3 id="auto-snapshot-title">{copy.autoSnapshotTitle}</h3>
        <p>{copy.autoSnapshotBody}</p>
        <p className="my-page-setting-hint">{copy.autoSnapshotChangeOnlyHint}</p>
        {!isPro && <p className="my-page-alert">{copy.autoSnapshotProRequired}</p>}
        {notice && <p className="my-page-form-message" role="status">{notice}</p>}
      </div>
      <div className="my-page-setting-line__control">
        <div className="my-page-automation-control">
          <div className="my-page-automation-fields">
            <label className="my-page-automation-fields__tz" htmlFor="auto-snapshot-timezone">
              <span>{copy.autoSnapshotTimeZoneLabel}</span>
              <TimeZoneSelect
                id="auto-snapshot-timezone"
                value={timeZone}
                disabled={!canEnable || busy}
                searchPlaceholder={copy.autoSnapshotTimeZoneSearchPlaceholder}
                onChange={handleTimeZoneChange}
              />
            </label>
            <label>
              <span>{copy.autoSnapshotTimeOfDayLabel}</span>
              <input
                type="time"
                value={timeOfDay}
                disabled={!canEnable || busy}
                onChange={(event) => handleTimeChange(event.currentTarget.value)}
              />
            </label>
          </div>
          <div className="my-page-automation-status">
            <div className="my-page-automation-status-meta">
              {settings?.nextRunAt && (
                <p>
                  {copy.autoSnapshotNextRun.replace(
                    '{date}',
                    formatSavedAtCompact(settings.nextRunAt),
                  )}
                </p>
              )}
              {settings?.lastRunAt && (
                <p>
                  {copy.autoSnapshotLastRun.replace(
                    '{date}',
                    formatSavedAtCompact(settings.lastRunAt),
                  )}
                </p>
              )}
            </div>
            <div className="my-page-automation-toggle">
              {isPro && !hasCloudInput && (
                <span className="my-page-automation-toggle-hint">
                  {copy.autoSnapshotCloudRequired}
                </span>
              )}
              <ToggleSwitch
                checked={enabled}
                disabled={(!canEnable && !enabled) || busy}
                label={copy.toggleUseLabel}
                labelHidden
                onChange={handleToggle}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** 숫자세트 행 상세보기(펼침 화살표) 아이콘. 열리면 CSS로 위로 회전한다. */
function ChevronDownIcon() {
  return (
    <svg
      className="my-page-chevron-icon"
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
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** 숫자세트 전체 상세 모달 열기(확대) 아이콘. */
function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

/** 숫자세트 행 삭제(휴지통) 아이콘. */
function TrashIcon() {
  return (
    <svg
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
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
    </svg>
  )
}

/** 숫자세트 그룹 헤더의 추가(+) 아이콘. */
function PlusIcon() {
  return (
    <svg
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

/** 롤오버 설정 저장 페이로드(활성 시 나머지 값 필수, 비활성 시 전부 null). */
export interface RolloverSaveSettings {
  enabled: boolean
  intervalMonths: RolloverIntervalMonths | null
  anchor: RolloverAnchor | null
  nextDate: string | null
}

/** 유저 브라우저 로컬 달력 기준 오늘(YYYY-MM-DD). 롤오버 예정일 초기 계산의 기준. */
function todayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 슬롯별 롤오버(만기 이월) 알림 설정. 자동 스냅샷이 켜진 클라우드 슬롯에서만 노출한다.
 * 주기·기준일을 바꾸면 다음 예정일을 관행 위상으로 재계산하고, 날짜를 직접 고치면 그 날짜를 존중한다.
 */
function RolloverSettingControl({
  copy,
  rollover,
  busy,
  onSave,
}: {
  copy: MyPageCopy
  rollover: RolloverSettings
  busy: boolean
  onSave: (settings: RolloverSaveSettings) => void
}) {
  const enabled = rollover.enabled
  const interval: RolloverIntervalMonths = rollover.intervalMonths ?? 3
  const anchor: RolloverAnchor = rollover.anchor ?? 'second_thursday'
  const nextDate = rollover.nextDate ?? ''

  const handleToggle = (on: boolean) => {
    if (busy) return
    if (!on) {
      onSave({ enabled: false, intervalMonths: null, anchor: null, nextDate: null })
      return
    }
    onSave({
      enabled: true,
      intervalMonths: interval,
      anchor,
      nextDate: computeNextRolloverDate(todayLocalDateString(), interval, anchor),
    })
  }

  const handleInterval = (value: string) => {
    const nextInterval = Number(value) as RolloverIntervalMonths
    onSave({
      enabled: true,
      intervalMonths: nextInterval,
      anchor,
      nextDate: computeNextRolloverDate(todayLocalDateString(), nextInterval, anchor),
    })
  }

  const handleAnchor = (value: string) => {
    const nextAnchor = value as RolloverAnchor
    onSave({
      enabled: true,
      intervalMonths: interval,
      anchor: nextAnchor,
      nextDate: computeNextRolloverDate(todayLocalDateString(), interval, nextAnchor),
    })
  }

  const handleDate = (value: string) => {
    onSave({ enabled: true, intervalMonths: interval, anchor, nextDate: value || null })
  }

  return (
    <div className="my-page-rollover">
      <div className="my-page-rollover-head">
        <span>{copy.rolloverTitle}</span>
        <ToggleSwitch
          checked={enabled}
          disabled={busy}
          label={copy.rolloverToggleLabel}
          onChange={handleToggle}
        />
      </div>
      {enabled && (
        <div className="my-page-rollover-fields">
          <label>
            <span>{copy.rolloverIntervalLabel}</span>
            <select
              value={interval}
              disabled={busy}
              onChange={(event) => handleInterval(event.currentTarget.value)}
            >
              <option value={1}>{copy.rolloverIntervalMonthly}</option>
              <option value={2}>{copy.rolloverIntervalBimonthly}</option>
              <option value={3}>{copy.rolloverIntervalQuarterly}</option>
              <option value={6}>{copy.rolloverIntervalSemiannual}</option>
            </select>
          </label>
          <label>
            <span>{copy.rolloverAnchorLabel}</span>
            <select
              value={anchor}
              disabled={busy}
              onChange={(event) => handleAnchor(event.currentTarget.value)}
            >
              <option value="second_thursday">{copy.rolloverAnchorSecondThursday}</option>
              <option value="third_friday">{copy.rolloverAnchorThirdFriday}</option>
            </select>
          </label>
          <label>
            <span>{copy.rolloverNextDateLabel}</span>
            <input
              type="date"
              value={nextDate}
              disabled={busy}
              onChange={(event) => handleDate(event.currentTarget.value)}
            />
          </label>
          <p className="my-page-field-help">{copy.rolloverNextDateHint}</p>
        </div>
      )}
    </div>
  )
}

/**
 * 숫자세트 행: 이름은 input 직접 편집(blur/Enter 시 커밋), 액션은 상세보기 토글 + 삭제.
 * 상세는 세트 기준값(계좌평가금·현재가)과 계산 결과(레버리지·청산가)를 미니 그리드로 펼친다.
 */
function NumberSetRow({
  copy,
  presetCopy,
  numberSet,
  busy,
  autoSnapshotAllowed,
  showAutoSnapshotColumn,
  onRenameNumberSet,
  onSetPreset,
  onDeleteNumberSet,
  onSetAutoSnapshot,
  onSetRollover,
  onClearRolloverPending,
}: {
  copy: MyPageCopy
  presetCopy: Messages['glossaryPreset']
  numberSet: CalculatorNumberSet
  busy: boolean
  // Pro 여부. onSetAutoSnapshot이 있을 때만(클라우드 슬롯) 토글을 노출하고, false면 켜기 불가.
  autoSnapshotAllowed?: boolean
  showAutoSnapshotColumn: boolean
  onRenameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => void
  onSetPreset: (mode: SaveStorageMode, setId: string, presetId: PresetId) => void
  onDeleteNumberSet: (mode: SaveStorageMode, setId: string) => void
  onSetAutoSnapshot?: (mode: SaveStorageMode, setId: string, enabled: boolean) => void
  onSetRollover?: (mode: SaveStorageMode, setId: string, settings: RolloverSaveSettings) => void
  onClearRolloverPending?: (mode: SaveStorageMode, setId: string) => void
}) {
  const [titleDraft, setTitleDraft] = useState(numberSet.title)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const detailModalTriggerRef = useRef<HTMLButtonElement | null>(null)
  const showAutoSnapshotControl = Boolean(
    onSetAutoSnapshot && (autoSnapshotAllowed || numberSet.autoSnapshotEnabled),
  )

  const commitRename = () => {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === numberSet.title) return
    onRenameNumberSet(numberSet.storageMode, numberSet.id, trimmed)
  }

  const detailMetrics = useMemo(() => {
    if (!detailOpen) return null
    const result = calculateEvaluate(numberSet.inputs)
    return [
      { label: copy.numberSetDetailEquity, value: formatNumber(numberSet.inputs.accountEval ?? null) },
      { label: copy.numberSetDetailPrice, value: formatNumber(numberSet.inputs.currentPrice ?? null) },
      { label: copy.numberSetDetailLeverage, value: formatLeverageValue(result.leverageRatio) },
      { label: copy.numberSetDetailLiquidation, value: formatNumber(result.liquidationPrice) },
    ]
  }, [copy, detailOpen, numberSet])

  return (
    <li className="my-page-number-set-row">
      <div
        className={`my-page-number-set-row-main${showAutoSnapshotColumn ? ' my-page-number-set-row-main--with-auto' : ''}`}
      >
        <input
          value={titleDraft}
          aria-label={copy.numberSetNamePlaceholder}
          placeholder={copy.numberSetNamePlaceholder}
          title={copy.renameNumberSet}
          disabled={busy}
          onChange={(event) => setTitleDraft(event.currentTarget.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') setTitleDraft(numberSet.title)
          }}
        />
        {showAutoSnapshotColumn && (
          showAutoSnapshotControl && onSetAutoSnapshot ? (
            <div className="my-page-number-set-row-auto">
              <ToggleSwitch
                checked={numberSet.autoSnapshotEnabled}
                disabled={busy}
                label={`${numberSet.title}: ${copy.autoSnapshotSlotToggleLabel}`}
                labelHidden
                onChange={(enabled) =>
                  onSetAutoSnapshot(numberSet.storageMode, numberSet.id, enabled)
                }
              />
            </div>
          ) : (
            <span className="my-page-number-set-row-auto my-page-number-set-row-auto--empty" aria-hidden="true" />
          )
        )}
        <div className="my-page-number-set-row-actions">
          <button
            type="button"
            className="my-page-icon-btn"
            title={copy.numberSetDetails}
            aria-label={copy.numberSetDetails}
            aria-expanded={detailOpen}
            onClick={() => setDetailOpen((open) => !open)}
          >
            <ChevronDownIcon />
          </button>
          <button
            type="button"
            className="my-page-icon-btn"
            title={copy.deleteNumberSet}
            aria-label={copy.deleteNumberSet}
            disabled={busy}
            onClick={() => onDeleteNumberSet(numberSet.storageMode, numberSet.id)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <label className="my-page-number-set-row-preset">
        <span>{presetCopy.label}</span>
        <select
          value={numberSet.presetId}
          disabled={busy}
          aria-label={`${numberSet.title}: ${presetCopy.label}`}
          onChange={(event) =>
            onSetPreset(
              numberSet.storageMode,
              numberSet.id,
              event.currentTarget.value as PresetId,
            )
          }
        >
          {PRESET_IDS.map((presetId) => (
            <option key={presetId} value={presetId}>
              {presetCopy.options[presetId]}
            </option>
          ))}
        </select>
      </label>
      {numberSet.rollover.pending && onClearRolloverPending && (
        <div className="my-page-rollover-banner" role="status">
          <span>{copy.rolloverPendingBanner}</span>
          <button
            type="button"
            className="link-btn"
            disabled={busy}
            onClick={() => onClearRolloverPending(numberSet.storageMode, numberSet.id)}
          >
            {copy.rolloverPendingAction}
          </button>
        </div>
      )}
      {detailOpen && detailMetrics && (
        <div className="my-page-number-set-detail">
          {detailMetrics.map((metric) => (
            <div key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
          <button
            type="button"
            ref={detailModalTriggerRef}
            className="my-page-icon-btn my-page-icon-btn--sm my-page-number-set-detail-more"
            title={copy.numberSetDetailOpen}
            aria-label={copy.numberSetDetailOpen}
            onClick={() => setDetailModalOpen(true)}
          >
            <ExpandIcon />
          </button>
        </div>
      )}
      {/* 롤오버 설정: Pro + 자동 스냅샷이 켜진 슬롯에서만. 상세 펼침 안에 둔다. */}
      {detailOpen && onSetRollover && autoSnapshotAllowed && numberSet.autoSnapshotEnabled && (
        <RolloverSettingControl
          copy={copy}
          rollover={numberSet.rollover}
          busy={busy}
          onSave={(settings) => onSetRollover(numberSet.storageMode, numberSet.id, settings)}
        />
      )}
      {detailModalOpen && (
        <NumberSetDetailModal
          numberSet={numberSet}
          restoreFocusRef={detailModalTriggerRef}
          onClose={() => setDetailModalOpen(false)}
        />
      )}
    </li>
  )
}

/** 위치(이 기기/클라우드)별 숫자세트 그룹 카드: 헤더(이름 + n/10 + 추가 아이콘) + 세트 행 리스트. */
function NumberSetGroup({
  copy,
  presetCopy,
  title,
  addLabel,
  automationNote,
  mode,
  sets,
  limit,
  busy,
  autoSnapshotAllowed,
  onCreateNumberSet,
  onRenameNumberSet,
  onSetPreset,
  onDeleteNumberSet,
  onSetAutoSnapshot,
  onSetRollover,
  onClearRolloverPending,
}: {
  copy: MyPageCopy
  presetCopy: Messages['glossaryPreset']
  title: string
  addLabel: string
  automationNote?: string
  mode: SaveStorageMode
  sets: CalculatorNumberSet[]
  limit: number
  busy: boolean
  autoSnapshotAllowed?: boolean
  onCreateNumberSet: (mode: SaveStorageMode) => void
  onRenameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => void
  onSetPreset: (mode: SaveStorageMode, setId: string, presetId: PresetId) => void
  onDeleteNumberSet: (mode: SaveStorageMode, setId: string) => void
  // 넘기면 이 그룹의 각 행에 자동 스냅샷 토글이 붙는다(클라우드 그룹 전용).
  onSetAutoSnapshot?: (mode: SaveStorageMode, setId: string, enabled: boolean) => void
  onSetRollover?: (mode: SaveStorageMode, setId: string, settings: RolloverSaveSettings) => void
  onClearRolloverPending?: (mode: SaveStorageMode, setId: string) => void
}) {
  const showAutoSnapshotColumn = Boolean(
    onSetAutoSnapshot && (autoSnapshotAllowed || sets.some((set) => set.autoSnapshotEnabled)),
  )

  return (
    <div className="my-page-number-set-group">
      <div className="my-page-number-set-group-head">
        <span>{title}</span>
        <div className="my-page-number-set-group-meta">
          <strong>
            {sets.length} / {limit}
          </strong>
          <button
            type="button"
            className="my-page-icon-btn my-page-icon-btn--sm"
            title={addLabel}
            aria-label={addLabel}
            disabled={busy || sets.length >= limit}
            onClick={() => onCreateNumberSet(mode)}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
      {automationNote && (
        <p className="my-page-number-set-automation-note" role="note">
          {automationNote}
        </p>
      )}
      {showAutoSnapshotColumn && (
        <div className="my-page-number-set-list-head" aria-hidden="true">
          <span />
          <span>{copy.autoSnapshotSlotToggleLabel}</span>
          <span />
        </div>
      )}
      <ul className="my-page-number-set-list">
        {sets.map((numberSet) => (
          <NumberSetRow
            key={`${numberSet.storageMode}:${numberSet.id}:${numberSet.title}`}
            copy={copy}
            presetCopy={presetCopy}
            numberSet={numberSet}
            busy={busy}
            autoSnapshotAllowed={autoSnapshotAllowed}
            showAutoSnapshotColumn={showAutoSnapshotColumn}
            onRenameNumberSet={onRenameNumberSet}
            onSetPreset={onSetPreset}
            onDeleteNumberSet={onDeleteNumberSet}
            onSetAutoSnapshot={onSetAutoSnapshot}
            onSetRollover={onSetRollover}
            onClearRolloverPending={onClearRolloverPending}
          />
        ))}
      </ul>
    </div>
  )
}

/** 숫자세트 독립 패널: 환경설정과 분리된 최상위 섹션, 위치별 2열 그룹 카드. */
export function NumberSetPreferencesPanel({
  copy,
  presetCopy,
  localNumberSets,
  cloudNumberSets,
  numberSetLimits,
  busy,
  notice,
  isPro,
  onCreateNumberSet,
  onRenameNumberSet,
  onSetPreset,
  onDeleteNumberSet,
  onSetAutoSnapshot,
  onSetRollover,
  onClearRolloverPending,
}: {
  copy: MyPageCopy
  presetCopy: Messages['glossaryPreset']
  localNumberSets: CalculatorNumberSet[]
  cloudNumberSets: CalculatorNumberSet[]
  numberSetLimits: Record<SaveStorageMode, number>
  busy: boolean
  notice: string | null
  isPro: boolean
  onCreateNumberSet: (mode: SaveStorageMode) => void
  onRenameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => void
  onSetPreset: (mode: SaveStorageMode, setId: string, presetId: PresetId) => void
  onDeleteNumberSet: (mode: SaveStorageMode, setId: string) => void
  onSetAutoSnapshot: (mode: SaveStorageMode, setId: string, enabled: boolean) => void
  onSetRollover: (mode: SaveStorageMode, setId: string, settings: RolloverSaveSettings) => void
  onClearRolloverPending: (mode: SaveStorageMode, setId: string) => void
}) {
  const autoSnapshotCount = cloudNumberSets.filter((set) => set.autoSnapshotEnabled).length
  return (
    <section
      id="my-page-number-sets"
      className="my-page-panel my-page-number-sets"
      aria-labelledby="my-page-number-sets-title"
    >
      <div>
        <h2 id="my-page-number-sets-title">{copy.numberSetsTitle}</h2>
        <p>{copy.numberSetsBody}</p>
      </div>
      <div className="my-page-number-set-groups">
        <NumberSetGroup
          copy={copy}
          presetCopy={presetCopy}
          title={copy.numberSetsLocalTitle}
          addLabel={copy.addLocalNumberSet}
          mode="local"
          sets={localNumberSets}
          limit={numberSetLimits.local}
          busy={busy}
          onCreateNumberSet={onCreateNumberSet}
          onRenameNumberSet={onRenameNumberSet}
          onSetPreset={onSetPreset}
          onDeleteNumberSet={onDeleteNumberSet}
        />
        <NumberSetGroup
          copy={copy}
          presetCopy={presetCopy}
          title={copy.numberSetsCloudTitle}
          addLabel={copy.addCloudNumberSet}
          automationNote={isPro ? copy.autoSnapshotSlotHelp : undefined}
          mode="cloud"
          sets={cloudNumberSets}
          limit={numberSetLimits.cloud}
          busy={busy}
          autoSnapshotAllowed={isPro}
          onCreateNumberSet={onCreateNumberSet}
          onRenameNumberSet={onRenameNumberSet}
          onSetPreset={onSetPreset}
          onDeleteNumberSet={onDeleteNumberSet}
          onSetAutoSnapshot={onSetAutoSnapshot}
          onSetRollover={onSetRollover}
          onClearRolloverPending={onClearRolloverPending}
        />
      </div>
      <p className="my-page-field-help my-page-number-set-storage-footnote" role="note">
        {copy.localStorageNote}
      </p>
      {isPro && (
        <p className="my-page-field-help">
          {copy.autoSnapshotSlotCountNote.replace('{count}', String(autoSnapshotCount))}
        </p>
      )}
      <p className="my-page-field-help">{copy.numberSetsLimitNote}</p>
      {notice && <p className="my-page-form-message" role="status">{notice}</p>}
    </section>
  )
}

/** 닉네임 인라인 편집 진입용 연필 아이콘. */
function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
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
  onGoogleLogin,
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
  const [editingNickname, setEditingNickname] = useState(false)
  const nicknameInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (editingNickname) nicknameInputRef.current?.focus()
  }, [editingNickname])
  const startNicknameEdit = () => {
    if (user) onNicknameChange(user.nickname)
    setEditingNickname(true)
  }
  const cancelNicknameEdit = () => {
    if (user) onNicknameChange(user.nickname)
    setEditingNickname(false)
  }
  const submitNickname = async (event: FormEvent) => {
    event.preventDefault()
    const ok = await onNicknameSubmit()
    if (ok) setEditingNickname(false)
  }
  const submitPassword = (event: FormEvent) => {
    event.preventDefault()
    onSetPasswordSubmit()
  }
  const { activeHref: activeNavHref, onNavClick } = useMyPageNavActive(Boolean(user))
  const navLabels: Record<(typeof MY_PAGE_NAV_ITEMS)[number]['href'], string> = {
    '#my-page-profile': copy.navAccount,
    '#my-page-records-summary': copy.navData,
    '#my-page-preferences': copy.preferencesTitle,
  }
  // 무료 유저에겐 계정 기록 패널을 렌더하지 않으므로, 내비에서도 '데이터' 항목을 뺀다.
  const navItems = isPro
    ? MY_PAGE_NAV_ITEMS
    : MY_PAGE_NAV_ITEMS.filter((item) => item.href !== '#my-page-records-summary')

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
          <section className="my-page-signin" aria-labelledby="my-page-login-title">
            <div className="my-page-signin__intro">
              <span className="my-page-signin__badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" /><path d="M6 21v-1a6 6 0 0 1 12 0v1" />
                </svg>
                {copy.title}
              </span>
              <h2 id="my-page-login-title" className="my-page-signin__title">{copy.loginHeadline}</h2>
              <p className="my-page-signin__lead">{copy.loginBody}</p>
              <ul className="my-page-signin__benefits">
                <li className="my-page-signin__benefit">
                  <span className="my-page-signin__benefit-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                  </span>
                  <div>
                    <strong>{copy.loginBenefitSetsTitle}</strong>
                    <span>{copy.loginBenefitSetsBody}</span>
                  </div>
                </li>
                <li className="my-page-signin__benefit">
                  <span className="my-page-signin__benefit-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  </span>
                  <div>
                    <strong>{copy.loginBenefitRecordsTitle}</strong>
                    <span>{copy.loginBenefitRecordsBody}</span>
                  </div>
                </li>
                <li className="my-page-signin__benefit">
                  <span className="my-page-signin__benefit-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z" /></svg>
                  </span>
                  <div>
                    <strong>{copy.loginBenefitProTitle}</strong>
                    <span>{copy.loginBenefitProBody}</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="my-page-signin__card">
              <h3 className="my-page-signin__card-title">{copy.loginPanelTitle}</h3>
              <p className="my-page-signin__card-lead">{copy.loginPanelBody}</p>
              {!configured && <p className="my-page-alert">{copy.configuredWarning}</p>}
              <button
                type="button"
                className="btn btn-primary my-page-signin__email"
                disabled={!configured}
                onClick={onLoginClick}
              >
                {copy.loginEmailAction}
              </button>
              <button
                type="button"
                className="google-btn"
                disabled={!configured}
                onClick={onGoogleLogin}
              >
                <GoogleLogo className="google-btn__logo" />
                <span>{copy.googleContinue}</span>
              </button>
              <p className="my-page-signin__terms">{copy.loginTerms}</p>
            </div>
          </section>
        ) : (
          <>
            <div className="my-page-body">
              <nav className="my-page-nav" aria-label={copy.navLabel}>
                {navItems.map((item) => {
                  const isActive = activeNavHref === item.href
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={isActive ? 'is-active' : undefined}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={(event) => onNavClick(event, item.href)}
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
                <div className="my-page-account-hub__top">
                <div className="my-page-account-hub__head">
                  <div className="my-page-account-hub__identity">
                    <span className="my-page-avatar" aria-hidden="true">
                      {user.nickname.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <div className="my-page-account-hub__identity-copy">
                      {editingNickname ? (
                        <form className="my-page-nickname-edit" onSubmit={submitNickname}>
                          <label htmlFor="my-page-nickname" className="my-page-sr-only">
                            {copy.nicknameLabel}
                          </label>
                          <div className="my-page-inline-control">
                            <input
                              id="my-page-nickname"
                              ref={nicknameInputRef}
                              value={nicknameDraft}
                              placeholder={copy.nicknamePlaceholder}
                              disabled={nicknameBusy}
                              onChange={(event) => onNicknameChange(event.currentTarget.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') cancelNicknameEdit()
                              }}
                            />
                            <button
                              type="submit"
                              className="btn btn-primary"
                              disabled={nicknameBusy}
                            >
                              {nicknameBusy ? copy.savingNickname : copy.saveNickname}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={cancelNicknameEdit}
                              disabled={nicknameBusy}
                            >
                              {copy.cancelEdit}
                            </button>
                          </div>
                          {nicknameMessage && (
                            <p className="my-page-form-message" role="status">
                              {nicknameMessage}
                            </p>
                          )}
                        </form>
                      ) : (
                        <div className="my-page-account-hub__name-row">
                          <strong className="my-page-account-hub__name" title={user.nickname}>
                            {user.nickname}
                          </strong>
                          <button
                            type="button"
                            className="my-page-nickname-edit-btn"
                            onClick={startNicknameEdit}
                            aria-label={copy.editNickname}
                            title={copy.editNickname}
                          >
                            <PencilIcon />
                          </button>
                          <span
                            className={`my-page-badge${isPro ? '' : ' my-page-badge--muted'}`}
                          >
                            {isPro ? copy.billing.statusPro : copy.billing.statusFree}
                          </span>
                        </div>
                      )}
                      <span className="my-page-identity-meta" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                  </div>
                  {isPro && billingPanel ? (
                    <div className="my-page-account-hub__billing-cluster">{billingPanel}</div>
                  ) : null}
                </div>
                <button type="button" className="my-page-signout" onClick={onSignOut}>
                  {copy.signOut}
                </button>
                </div>

                <div
                  className="my-page-account-hub__block my-page-account-hub__logins"
                  aria-labelledby="my-page-linked-logins-title"
                >
                  <h3 id="my-page-linked-logins-title">{copy.linkedLoginTitle}</h3>
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
                      <p className="my-page-field-help">{copy.passwordRule}</p>
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

              {/* 무료 유저: 계정 허브 바로 아래 Free vs Pro 비교 카드(업그레이드 패널)를 독립 섹션으로. */}
              {!isPro && billingPanel}

              {recordsSummaryPanel}

              {preferencesPanel}

              {devResetPanel}

              <div className="my-page-account-footer">
                <a className="my-page-delete-btn" href={supportHref}>
                  {copy.deleteAccountTitle}
                </a>
              </div>
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
    signInWithGoogle,
    isPro,
  } = useAuth()
  const {
    numberSets,
    numberSetLimits,
    createNumberSet,
    renameNumberSet,
    setNumberSetPreset,
    setNumberSetAutoSnapshot,
    setNumberSetRollover,
    clearNumberSetRolloverPending,
    deleteNumberSetById,
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
    recentSnapshots: AccountSnapshotRecord[]
    recentOrders: OrderHistoryRecord[]
  }>({
    userId: null,
    loading: false,
    error: null,
    notice: null,
    recentSnapshots: [],
    recentOrders: [],
  })
  const [autoSaveBusy, setAutoSaveBusy] = useState(false)
  const [automationSettings, setAutomationSettings] =
    useState<AccountSnapshotAutomationSettings | null>(null)
  const [automationBusy, setAutomationBusy] = useState(false)
  const [automationNotice, setAutomationNotice] = useState<string | null>(null)
  const [numberSetBusy, setNumberSetBusy] = useState(false)
  const [numberSetNotice, setNumberSetNotice] = useState<string | null>(null)
  const numberSetActionBusyRef = useRef(false)
  const deleteSummaryRequestRef = useRef(0)
  const deleteSummaryUserIdRef = useRef(user?.id ?? null)
  const [numberSetDeleteTarget, setNumberSetDeleteTarget] = useState<{
    mode: SaveStorageMode
    id: string
    title: string
    userId: string
  } | null>(null)
  const [numberSetDeleteSummary, setNumberSetDeleteSummary] =
    useState<NumberSetDeleteSummaryState>({ status: 'ready', summary: null })
  // 자동 스냅샷 시간대: 저장값이 있으면 그걸, 없으면 브라우저 추정 시간대로 시작한다.
  const [snapshotTimeZone, setSnapshotTimeZone] = useState<string>(
    () => readPreferredSnapshotTimeZone() ?? suggestedBrowserTimeZone(),
  )
  const handleTimeZoneChange = useCallback((next: string) => {
    setSnapshotTimeZone(next)
    writePreferredSnapshotTimeZone(next)
  }, [])
  // 서버 설정이 바뀌면 remount로 시각 입력 로컬 상태를 다시 동기화한다.
  // (지역 변경은 key에 넣지 않는다 — 편집 중인 시각이 날아가지 않도록.)
  const automationPanelKey = [
    automationSettings?.updatedAt ?? 'new',
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
  const recentSnapshots =
    user && recordsState.userId === user.id ? recordsState.recentSnapshots : []
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
    deleteSummaryUserIdRef.current = user?.id ?? null
    deleteSummaryRequestRef.current += 1
  }, [user?.id])

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
        recentSnapshots: [],
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
      recentSnapshots: prev.userId === userId ? prev.recentSnapshots : [],
      recentOrders: prev.userId === userId ? prev.recentOrders : [],
    }))

    const result = await recordsRepository.fetchRecentRecords(userId, 5)
    if (result.error !== null) {
      setRecordsState({
        userId,
        loading: false,
        error: t.accountRecords.loadError,
        notice: null,
        recentSnapshots: [],
        recentOrders: [],
      })
      return
    }

    setRecordsState({
      userId,
      loading: false,
      error: null,
      notice: null,
      recentSnapshots: result.data.accountSnapshots.slice(0, 5),
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

  const submitNickname = useCallback(async (): Promise<boolean> => {
    if (!user || nicknameBusy) return false
    const trimmed = nicknameDraft.trim()
    if (!trimmed) {
      setNicknameMessageState({ userId: user.id, value: t.myPage.nicknameRequired })
      return false
    }

    setNicknameBusy(true)
    setNicknameMessageState({ userId: user.id, value: null })
    const error = await updateNickname(trimmed)
    setNicknameBusy(false)
    setNicknameMessageState({
      userId: user.id,
      value: error ? t.myPage.nicknameError : t.myPage.nicknameSaved,
    })
    return !error
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
    async (action: () => Promise<string | null>): Promise<boolean> => {
      if (!user || numberSetActionBusyRef.current) return false
      numberSetActionBusyRef.current = true
      setNumberSetBusy(true)
      setNumberSetNotice(null)
      try {
        const error = await action()
        if (error === 'number_set_limit_reached') setNumberSetNotice(t.myPage.numberSetLimitReached)
        else if (error === 'not_logged_in') setNumberSetNotice(t.myPage.numberSetLoginRequired)
        else if (error) setNumberSetNotice(t.myPage.numberSetError)
        return error === null
      } catch {
        setNumberSetNotice(t.myPage.numberSetError)
        return false
      } finally {
        numberSetActionBusyRef.current = false
        setNumberSetBusy(false)
      }
    },
    [
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

  const loadNumberSetDeleteSummary = useCallback(
    async (target: { mode: SaveStorageMode; id: string; userId: string }) => {
      const requestId = deleteSummaryRequestRef.current + 1
      deleteSummaryRequestRef.current = requestId

      if (target.mode === 'local') {
        setNumberSetDeleteSummary({ status: 'ready', summary: null })
        return
      }
      if (!user) {
        setNumberSetDeleteSummary({ status: 'error', summary: null })
        return
      }

      setNumberSetDeleteSummary({ status: 'loading', summary: null })
      try {
        const result = await fetchNumberSetDeletionSummary(target.userId, target.id)
        if (
          deleteSummaryRequestRef.current !== requestId ||
          deleteSummaryUserIdRef.current !== target.userId
        ) return
        if (result.error) {
          setNumberSetDeleteSummary({ status: 'error', summary: null })
          return
        }
        setNumberSetDeleteSummary({ status: 'ready', summary: result.data })
      } catch {
        if (
          deleteSummaryRequestRef.current === requestId &&
          deleteSummaryUserIdRef.current === target.userId
        ) {
          setNumberSetDeleteSummary({ status: 'error', summary: null })
        }
      }
    },
    [user],
  )

  const handleDeleteNumberSet = useCallback(
    (mode: SaveStorageMode, setId: string) => {
      if (numberSetActionBusyRef.current) return
      const target = numberSets.find(
        (numberSet) => numberSet.storageMode === mode && numberSet.id === setId,
      )
      if (!target) return
      if (!user) return
      const nextTarget = { mode, id: setId, title: target.title, userId: user.id }
      setNumberSetNotice(null)
      setNumberSetDeleteTarget(nextTarget)
      void loadNumberSetDeleteSummary(nextTarget)
    },
    [loadNumberSetDeleteSummary, numberSets, user],
  )

  const handleCloseNumberSetDelete = useCallback(() => {
    if (numberSetActionBusyRef.current) return
    deleteSummaryRequestRef.current += 1
    setNumberSetDeleteTarget(null)
  }, [])

  const handleRetryNumberSetDelete = useCallback(() => {
    if (!numberSetDeleteTarget || numberSetDeleteTarget.mode !== 'cloud') return
    void loadNumberSetDeleteSummary(numberSetDeleteTarget)
  }, [loadNumberSetDeleteSummary, numberSetDeleteTarget])

  const handleConfirmNumberSetDelete = useCallback(async () => {
    const target = numberSetDeleteTarget
    if (!target || numberSetActionBusyRef.current) return
    if (
      target.mode === 'cloud' &&
      (numberSetDeleteSummary.status !== 'ready' || !numberSetDeleteSummary.summary)
    ) return

    const deleted = await runNumberSetAction(() => deleteNumberSetById(target.mode, target.id))
    if (!deleted) return
    deleteSummaryRequestRef.current += 1
    setNumberSetDeleteTarget(null)
    setNumberSetNotice(t.myPage.numberSetDeleteSuccess)
  }, [
    deleteNumberSetById,
    numberSetDeleteSummary.status,
    numberSetDeleteSummary.summary,
    numberSetDeleteTarget,
    runNumberSetAction,
    t.myPage.numberSetDeleteSuccess,
  ])

  const handleSetNumberSetAutoSnapshot = useCallback(
    (mode: SaveStorageMode, setId: string, enabled: boolean) => {
      void runNumberSetAction(() => setNumberSetAutoSnapshot(mode, setId, enabled))
    },
    [setNumberSetAutoSnapshot, runNumberSetAction],
  )

  const handleSetNumberSetPreset = useCallback(
    (mode: SaveStorageMode, setId: string, presetId: PresetId) => {
      void runNumberSetAction(() => setNumberSetPreset(mode, setId, presetId))
    },
    [runNumberSetAction, setNumberSetPreset],
  )

  const handleSetNumberSetRollover = useCallback(
    (mode: SaveStorageMode, setId: string, settings: RolloverSaveSettings) => {
      void runNumberSetAction(() => setNumberSetRollover(mode, setId, settings))
    },
    [setNumberSetRollover, runNumberSetAction],
  )

  const handleClearNumberSetRolloverPending = useCallback(
    (mode: SaveStorageMode, setId: string) => {
      void runNumberSetAction(() => clearNumberSetRolloverPending(mode, setId))
    },
    [clearNumberSetRolloverPending, runNumberSetAction],
  )

  const visibleNumberSetDeleteTarget =
    numberSetDeleteTarget?.userId === user?.id ? numberSetDeleteTarget : null

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
        recordsSummaryPanel={
          user && isPro ? (
            <AccountRecordsSummaryPanel
              copy={t.myPage}
              recordsCopy={t.accountRecords}
              loading={recordsLoading}
              error={recordsError}
              recentSnapshots={recentSnapshots}
              recentOrders={recentOrders}
              slots={cloudNumberSets}
              archiveHref={RECORDS_PATH}
              onRetry={() => void loadRecordsSummary()}
            />
          ) : null
        }
        preferencesPanel={
          user ? (
            <>
              {isPro && (
                <section
                  id="my-page-preferences"
                  className="my-page-panel"
                  aria-labelledby="my-page-preferences-title"
                >
                  <h2 id="my-page-preferences-title">{t.myPage.preferencesTitle}</h2>
                  <div className="my-page-setting-lines">
                  {/* 계좌 스냅샷 자동 저장·주문 기록 자동 저장은 Pro 전용 —
                      무료 유저에겐 "노출 후 차단" 대신 아예 렌더하지 않는다(업그레이드 패널로 일원화). */}
                  {isPro && (
                    <>
                      <AccountSnapshotAutomationPanel
                        key={automationPanelKey}
                        copy={t.myPage}
                        isPro={isPro}
                        hasCloudInput={hasCloudInput}
                        settings={automationSettings}
                        busy={automationBusy}
                        notice={automationNotice}
                        timeZone={snapshotTimeZone}
                        onTimeZoneChange={handleTimeZoneChange}
                        onSave={(settings) => void handleAutomationSave(settings)}
                        onDisable={() => void handleAutomationDisable()}
                      />
                      <div className="my-page-setting-line">
                        <div className="my-page-setting-line__copy">
                          <h3>{t.myPage.autoSaveOrderHistoryLabel}</h3>
                          <p>{t.myPage.autoSaveOrderHistoryHint}</p>
                          {recordsNotice && (
                            <p className="my-page-form-message" role="status">
                              {recordsNotice}
                            </p>
                          )}
                        </div>
                        <div className="my-page-setting-line__control">
                          <ToggleSwitch
                            checked={user.autoSaveOrderHistory}
                            disabled={autoSaveBusy}
                            label={t.myPage.toggleUseLabel}
                            labelHidden
                            onChange={(enabled) => void handleAutoSaveOrderHistory(enabled)}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  </div>
                </section>
              )}
              <NumberSetPreferencesPanel
                copy={t.myPage}
                presetCopy={t.glossaryPreset}
                localNumberSets={localNumberSets}
                cloudNumberSets={cloudNumberSets}
                numberSetLimits={numberSetLimits}
                busy={numberSetBusy}
                notice={numberSetNotice}
                isPro={isPro}
                onCreateNumberSet={handleCreateNumberSet}
                onRenameNumberSet={handleRenameNumberSet}
                onSetPreset={handleSetNumberSetPreset}
                onDeleteNumberSet={handleDeleteNumberSet}
                onSetAutoSnapshot={handleSetNumberSetAutoSnapshot}
                onSetRollover={handleSetNumberSetRollover}
                onClearRolloverPending={handleClearNumberSetRolloverPending}
              />
            </>
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
        onGoogleLogin={() => void signInWithGoogle()}
        onSignOut={() => void signOut()}
      />
      <SiteFooter />
      {visibleNumberSetDeleteTarget && (
        <Suspense fallback={null}>
          <NumberSetDeleteConfirmModal
            mode={visibleNumberSetDeleteTarget.mode}
            setTitle={visibleNumberSetDeleteTarget.title}
            summaryState={numberSetDeleteSummary}
            busy={numberSetBusy}
            copy={{
              title: t.myPage.numberSetDeleteTitle,
              cloudBody: t.myPage.numberSetDeleteCloudBody,
              localBody: t.myPage.numberSetDeleteLocalBody,
              orderCount: t.myPage.numberSetDeleteOrderCount,
              snapshotCount: t.myPage.numberSetDeleteSnapshotCount,
              memoCount: t.myPage.numberSetDeleteMemoCount,
              warning: t.myPage.numberSetDeleteWarning,
              summaryLoading: t.myPage.numberSetDeleteSummaryLoading,
              summaryError: t.myPage.numberSetDeleteSummaryError,
              retry: t.myPage.numberSetDeleteRetry,
              cancel: t.myPage.numberSetDeleteCancel,
              confirm: t.myPage.numberSetDeleteConfirm,
              confirmBusy: t.myPage.numberSetDeleteBusy,
            }}
            onClose={handleCloseNumberSetDelete}
            onConfirm={() => void handleConfirmNumberSetDelete()}
            onRetry={handleRetryNumberSetDelete}
          />
        </Suspense>
      )}
      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
