import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import { MY_PAGE_PATH } from '../config/routes'
import { useAuth } from '../context/AuthContext'
import { useCalculator } from '../context/CalculatorContext'
import {
  createAccountRecordsRepository,
  type AccountSnapshotRecord,
  type NumberSetFilter,
  type OrderHistoryRecord,
} from '../db/accountRecords'
import type { NumberSetRecord } from '../db/numberSets'
import { fetchRecordsSlotContext } from '../db/recordsSlotContext'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useLanguage } from '../i18n'
import { revertOrderScenarioState } from '../calc/mtmLink'
import type { CalculatorInputs } from '../types'
import { InputPanel } from './InputPanel'
import { ResultPanel } from './ResultPanel'
import { RecordsContextMenu, type RecordsContextMenuItem } from './RecordsContextMenu'
import {
  MemoButton,
  MemoEditorWindow,
  MemoIcon,
  MemoWorkspaceEditor,
  type MemoEditorHandle,
} from './MemoEditorWindow'
import type { Messages } from '../i18n/types'
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
import { SiteFooter } from './SiteFooter'
import {
  buildOrderExportTable,
  buildSnapshotExportTable,
  downloadRecordExport,
} from '../lib/accountRecordExport'
import type { RecordsExportRequest, RecordsExportResult } from './RecordsExportModal'
import '../styles/pages.css'
import '../styles/auth-dialog.css'
import '../styles/records-export.css'

const BulkDeleteConfirmModal = lazy(() =>
  import('./BulkDeleteConfirmModal').then((mod) => ({ default: mod.BulkDeleteConfirmModal })),
)
const RecordsExportModal = lazy(() =>
  import('./RecordsExportModal').then((mod) => ({ default: mod.RecordsExportModal })),
)

type AccountRecordsCopy = Messages['accountRecords']
type RecordGroup = 'orders' | 'snapshots'

export type TimelineRecord =
  | { type: 'snapshot'; id: string; createdAt: string; record: AccountSnapshotRecord }
  | { type: 'order'; id: string; createdAt: string; record: OrderHistoryRecord }

type DetailSelection =
  | { type: 'order'; record: OrderHistoryRecord }
  | { type: 'snapshot'; record: AccountSnapshotRecord }
  | null

type RecordsMemoTarget =
  | { kind: 'slot'; id: string }
  | { kind: 'snapshot'; id: string }
  | { kind: 'order'; id: string }
  | null

type ActivationEvent = ReactMouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>

const EMPTY_SELECTION: Set<string> = new Set()

function timelineKey(entry: TimelineRecord): string {
  return `${entry.type}:${entry.id}`
}

function timestamp(value: string): number {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

/** Date → <input type="date"> 값(YYYY-MM-DD, 로컬 기준). */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// eslint-disable-next-line react-refresh/only-export-components -- shared pure helper is covered by the page tests
export function toTimelineRecords(
  orderRecords: OrderHistoryRecord[],
  snapshotRecords: AccountSnapshotRecord[],
): TimelineRecord[] {
  return [
    ...snapshotRecords.map((record) => ({
      type: 'snapshot' as const,
      id: record.id,
      createdAt: record.createdAt,
      record,
    })),
    ...orderRecords.map((record) => ({
      type: 'order' as const,
      id: record.id,
      createdAt: record.createdAt,
      record,
    })),
  ].sort((a, b) => {
    const timeDiff = timestamp(b.createdAt) - timestamp(a.createdAt)
    if (timeDiff !== 0) return timeDiff
    if (a.type === b.type) return 0
    return a.type === 'snapshot' ? -1 : 1
  })
}

/**
 * 처음 열 때는 가장 최근 기록일을 기준점으로 삼고, 날짜 점프 뒤에는 사용자가 고른
 * 날짜를 그대로 유지한다. 기준점보다 위쪽은 아직 오지 않은 미래 영역으로 비워 둔다.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared pure helper is covered by the page tests
export function resolveTimelineAnchorDate(
  dateAnchor: string | null,
  timelineRecords: TimelineRecord[],
): string | null {
  if (dateAnchor) return dateAnchor
  const latestRecord = timelineRecords[0]
  if (!latestRecord) return null
  const latestDate = new Date(latestRecord.createdAt)
  return Number.isFinite(latestDate.getTime()) ? toDateInputValue(latestDate) : null
}

// eslint-disable-next-line react-refresh/only-export-components -- pure initialization rule is covered by page tests
export function resolveInitialRecordsSlotFilter(
  slots: { id: string }[],
  activeSlotId: string | null,
): NumberSetFilter {
  if (activeSlotId && slots.some((slot) => slot.id === activeSlotId)) {
    return { kind: 'slot', id: activeSlotId }
  }
  return slots[0] ? { kind: 'slot', id: slots[0].id } : { kind: 'all' }
}

function TimelineValue({
  value,
}: {
  value: string
}) {
  return (
    <span className="records-timeline-value">{value}</span>
  )
}

/** 모달 안 계산기는 읽기 전용 — 입력 변경을 전부 무시한다. */
const noopChange = () => undefined

/**
 * '주문 전' 화면용 입력값. 저장된 beforeInputs는 주문이 '반영 중'인 시나리오 상태라
 * 입력 패널이 반영된(=주문 후와 같은) 값을 보여준다 — 시나리오를 벗겨(계산기 ESC 취소와
 * 같은 함수) 주문 직전의 원래 값으로 되돌려 보여준다.
 */
function rawBeforeInputs(inputs: CalculatorInputs): CalculatorInputs {
  return { ...inputs, ...revertOrderScenarioState(inputs) }
}

/**
 * 기록 상세 — 화면 전면 모달(body 포털). 저장 당시 입력값이 채워진 계산기
 * (입력+결과 패널)를 읽기 전용으로 통째로 보여준다. 주문 기록은 기본으로
 * 반영 직후(afterInputs)를 보여주고, 헤더의 소형 전/후 토글로 직전 상태를
 * 오갈 수 있다. 조회형이라 우상단 X를 유지하고 ESC·오버레이 클릭으로 닫으며,
 * 열려 있는 동안 배경 스크롤을 잠근다. 포커스 복원은 마운트 시점의
 * activeElement(클릭한 카드)로 자동 복귀.
 */
function RecordsDetailPanel({
  detail,
  copy,
  closeLabel,
  onClose,
  onEditMemo,
}: {
  detail: NonNullable<DetailSelection>
  copy: AccountRecordsCopy
  closeLabel: string
  onClose: () => void
  onEditMemo: () => void
}) {
  useModalFocusRestore()
  const [orderPhase, setOrderPhase] = useState<'before' | 'after'>('after')
  const calcRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // 계산기 전체가 스크롤 없이 한눈에 들어오도록 모달 가용 높이에 맞춰 축소(zoom).
  // zoom은 레이아웃 좌표계 자체를 줄여 transform과 달리 빈 공간이 남지 않는다.
  useLayoutEffect(() => {
    const calc = calcRef.current
    const shell = calc?.parentElement
    if (!calc || !shell) return
    const apply = () => {
      calc.style.setProperty('zoom', '1')
      // 모달 상한(92vh, 900px 캡 — CSS와 동일)에서 헤더 등 계산기 외 높이를 뺀 가용분
      const cap = Math.min(window.innerHeight * 0.96, 980)
      const chromeHeight = shell.scrollHeight - calc.offsetHeight
      // 서브픽셀 반올림 오차로 스크롤바가 생기지 않게 16px 여유 + 내림
      const available = cap - chromeHeight - 16
      const scale = Math.min(1, available / calc.offsetHeight)
      calc.style.setProperty('zoom', String(Math.max(0.55, Math.floor(scale * 1000) / 1000)))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [orderPhase, detail])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const calcInputs =
    detail.type === 'order'
      ? orderPhase === 'before'
        ? rawBeforeInputs(detail.record.beforeInputs)
        : detail.record.afterInputs
      : detail.record.inputs

  const modal = (
    <div
      className="disclaimer-overlay records-detail-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="disclaimer-modal records-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={copy.detail}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <div className="records-detail-head">
          {detail.type === 'order' ? (
            <p className="records-detail-meta">
              {copy.side}: {detail.record.positionSide} · {copy.archiveOrderContracts}:{' '}
              {formatNumber(detail.record.orderContracts)} · {copy.archiveOrderPrice}:{' '}
              {formatNumber(detail.record.orderPrice)} · {copy.detailReadOnly}
            </p>
          ) : (
            <p className="records-detail-meta">
              {detail.record.title} · {formatSavedAtCompact(detail.record.createdAt)} ·{' '}
              {copy.detailReadOnly}
            </p>
          )}
          {detail.type === 'order' && (
            <div
              className="records-detail-toggle"
              role="group"
              aria-label={copy.orderSimulationLabel}
            >
              <button
                type="button"
                className={orderPhase === 'before' ? 'active' : ''}
                aria-pressed={orderPhase === 'before'}
                onClick={() => setOrderPhase('before')}
              >
                {copy.detailBefore}
              </button>
              <button
                type="button"
                className={orderPhase === 'after' ? 'active' : ''}
                aria-pressed={orderPhase === 'after'}
                onClick={() => setOrderPhase('after')}
              >
                {copy.detailAfter}
              </button>
            </div>
          )}
          <div className="records-detail-memo">
            <span>{detail.record.memo || copy.memoNone}</span>
            <MemoButton
              memo={detail.record.memo}
              label={detail.record.memo ? copy.memoEdit : copy.memoAdd}
              onClick={onEditMemo}
            />
          </div>
        </div>
        {/* key로 기록이 바뀌면 패널을 재마운트 — 입력 패널이 내부 표시 상태를 갖고 있어
            props만 바뀌면 화면 문자열이 안 갱신된다(읽기 전용이라 재마운트 비용 무해) */}
        <div
          className={`records-detail-calc${
            detail.type === 'order' && orderPhase === 'before'
              ? ' records-detail-calc--order-entry'
              : ''
          }`}
          key={`${detail.record.id}-${orderPhase}`}
          ref={calcRef}
        >
          <InputPanel inputs={calcInputs} onChange={noopChange} />
          <ResultPanel inputs={calcInputs} onChange={noopChange} />
        </div>
      </section>
    </div>
  )

  return createPortal(modal, document.body)
}

function RecordSelectBox({
  selected,
  disabled,
  label,
  onToggle,
}: {
  selected: boolean
  disabled: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <label className="records-timeline-select" onClick={(event) => event.stopPropagation()}>
      <input
        type="checkbox"
        checked={selected}
        disabled={disabled}
        aria-label={label}
        onChange={onToggle}
      />
    </label>
  )
}

function handleCardKeyDown(event: ReactKeyboardEvent<HTMLElement>, onActivate: (event: ActivationEvent) => void) {
  // Only react to keys on the card itself — ignore keydown bubbling up from the
  // inner checkbox or delete button (otherwise Space/Enter there would also open detail).
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate(event)
  }
}

function SnapshotTimelineCard({
  copy,
  disabled,
  record,
  selected,
  contextActive,
  onToggleSelect,
  onActivate,
  onContextMenu,
  onEditMemo,
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: AccountSnapshotRecord
  selected: boolean
  contextActive: boolean
  onToggleSelect: () => void
  onActivate: (event: ActivationEvent) => void
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void
  onEditMemo: () => void
}) {
  return (
    <article
      className={`records-timeline-card records-timeline-card--snapshot${selected ? ' records-timeline-card--selected' : ''}${contextActive ? ' records-timeline-card--context' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={copy.detail}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      onKeyDown={(event) => handleCardKeyDown(event, onActivate)}
    >
      <RecordSelectBox
        selected={selected}
        disabled={disabled}
        label={copy.selectRecord}
        onToggle={onToggleSelect}
      />
      <dl className="records-timeline-fields">
        <TimelineValue value={formatNumber(record.inputs.accountEval ?? null)} />
        <TimelineValue value={formatPercent(record.result.toleranceRate)} />
        <TimelineValue value={formatLeverageValue(record.result.leverageRatio)} />
      </dl>
      <MemoButton
        memo={record.memo}
        label={record.memo ? copy.memoEdit : copy.memoAdd}
        onClick={onEditMemo}
      />
    </article>
  )
}

function OrderTimelineCard({
  copy,
  disabled,
  record,
  selected,
  contextActive,
  onToggleSelect,
  onActivate,
  onContextMenu,
  onEditMemo,
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: OrderHistoryRecord
  selected: boolean
  contextActive: boolean
  onToggleSelect: () => void
  onActivate: (event: ActivationEvent) => void
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void
  onEditMemo: () => void
}) {
  return (
    <article
      className={`records-timeline-card records-timeline-card--order${selected ? ' records-timeline-card--selected' : ''}${contextActive ? ' records-timeline-card--context' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={copy.detail}
      onClick={onActivate}
      onContextMenu={onContextMenu}
      onKeyDown={(event) => handleCardKeyDown(event, onActivate)}
    >
      <RecordSelectBox
        selected={selected}
        disabled={disabled}
        label={copy.selectRecord}
        onToggle={onToggleSelect}
      />
      <dl className="records-timeline-fields">
        <TimelineValue value={record.positionSide} />
        <TimelineValue value={formatNumber(record.orderContracts)} />
        <TimelineValue value={formatNumber(record.orderPrice)} />
      </dl>
      <MemoButton
        memo={record.memo}
        label={record.memo ? copy.memoEdit : copy.memoAdd}
        onClick={onEditMemo}
      />
    </article>
  )
}

export function RecordsArchiveView({
  copy,
  backLabel,
  closeLabel,
  signedIn,
  loading,
  error,
  notice,
  orderRecords,
  snapshotRecords,
  onRetry,
  onDeleteOrder,
  onDeleteSnapshot,
  onBulkDeleteOrders,
  onBulkDeleteSnapshots,
  onLoadOlderRecords,
  loadingOlderRecords = false,
  orderDeleteBusy = false,
  snapshotDeleteBusy = false,
  orderBulkBusy = false,
  snapshotBulkBusy = false,
  onOpenOrderDetail,
  onOpenSnapshotDetail,
  detail = null,
  onCloseDetail,
  onEditMemo,
  onEditDetailMemo,
  memoWorkspace,
  memoSummary,
  memoExpanded = false,
  onToggleMemoWorkspace,
  selectedKeys = EMPTY_SELECTION,
  onSelectedKeysChange,
  onDeleteSelected,
  selectionBusy = false,
  slots = [],
  slotFilter = { kind: 'all' },
  onSlotFilterChange,
  dateAnchor = null,
  onDateAnchorChange,
  onOpenExport,
}: {
  copy: AccountRecordsCopy
  backLabel?: string
  closeLabel?: string
  signedIn: boolean
  loading: boolean
  error: string | null
  notice: string | null
  orderRecords: OrderHistoryRecord[]
  snapshotRecords: AccountSnapshotRecord[]
  onRetry: () => void
  onDeleteOrder: (id: string) => void
  onDeleteSnapshot: (id: string) => void
  onBulkDeleteOrders?: () => void
  onBulkDeleteSnapshots?: () => void
  onLoadOlderRecords?: () => void
  loadingOlderRecords?: boolean
  orderDeleteBusy?: boolean
  snapshotDeleteBusy?: boolean
  orderBulkBusy?: boolean
  snapshotBulkBusy?: boolean
  onOpenOrderDetail: (record: OrderHistoryRecord) => void
  onOpenSnapshotDetail: (record: AccountSnapshotRecord) => void
  detail?: DetailSelection
  onCloseDetail?: () => void
  onEditMemo?: (entry: TimelineRecord) => void
  onEditDetailMemo?: (entry: TimelineRecord) => void
  memoWorkspace?: ReactNode
  memoSummary?: string
  memoExpanded?: boolean
  onToggleMemoWorkspace?: () => void
  selectedKeys?: Set<string>
  onSelectedKeysChange?: (next: Set<string>) => void
  onDeleteSelected?: () => void
  selectionBusy?: boolean
  slots?: { id: string; title: string }[]
  slotFilter?: NumberSetFilter
  onSlotFilterChange?: (filter: NumberSetFilter) => void
  dateAnchor?: string | null
  onDateAnchorChange?: (date: string | null) => void
  onOpenExport?: () => void
}) {
  const timelineRecords = toTimelineRecords(orderRecords, snapshotRecords)
  const timelineAnchorDate = resolveTimelineAnchorDate(dateAnchor, timelineRecords)
  const slotTitles = useMemo(() => createAccountRecordSlotTitles(slots), [slots])
  const showTimelineSlotNames = slotFilter.kind === 'all'
  const newestTimelineKey = timelineRecords[0] ? timelineKey(timelineRecords[0]) : null
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const loadMoreSentinelRef = useInfiniteScroll<HTMLDivElement>({
    onLoadMore: () => onLoadOlderRecords?.(),
    enabled: Boolean(onLoadOlderRecords) && !loadingOlderRecords,
  })
  const todayInputValue = useMemo(() => toDateInputValue(new Date()), [])
  const hasRecords = timelineRecords.length > 0
  const orderActionsLocked = loadingOlderRecords || orderDeleteBusy || orderBulkBusy
  const snapshotActionsLocked = loadingOlderRecords || snapshotDeleteBusy || snapshotBulkBusy
  const selectedCount = selectedKeys.size
  const [anchorKey, setAnchorKey] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; entry: TimelineRecord } | null>(null)
  const [toolbarMenu, setToolbarMenu] = useState<{ x: number; y: number } | null>(null)
  const [slotMenu, setSlotMenu] = useState<{ x: number; y: number } | null>(null)

  // 날짜 선택/초기 조회 때 기준점이 늘 중앙에 보이게 한다. 오래된 기록을 추가 로드할 때는
  // newestTimelineKey가 바뀌지 않아 사용자가 읽고 있던 스크롤 위치를 유지한다.
  useLayoutEffect(() => {
    if (!newestTimelineKey) return
    const scroll = timelineScrollRef.current
    if (scroll) scroll.scrollTop = 0
  }, [dateAnchor, newestTimelineKey])

  const emitSelection = (next: Set<string>) => onSelectedKeysChange?.(next)

  const toggleKey = (key: string) => {
    const next = new Set(selectedKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setAnchorKey(key)
    emitSelection(next)
  }

  const toggleAt = (index: number) => {
    toggleKey(timelineKey(timelineRecords[index]))
  }

  const selectRangeTo = (index: number) => {
    const anchorIndex = anchorKey == null ? -1 : timelineRecords.findIndex((entry) => timelineKey(entry) === anchorKey)
    if (anchorIndex < 0) {
      toggleAt(index)
      return
    }
    const [start, end] = anchorIndex <= index ? [anchorIndex, index] : [index, anchorIndex]
    const next = new Set(selectedKeys)
    for (let i = start; i <= end; i += 1) {
      next.add(timelineKey(timelineRecords[i]))
    }
    setAnchorKey(timelineKey(timelineRecords[index]))
    emitSelection(next)
  }

  const openDetail = (entry: TimelineRecord) => {
    if (entry.type === 'snapshot') onOpenSnapshotDetail(entry.record)
    else onOpenOrderDetail(entry.record)
  }

  const deleteEntry = (entry: TimelineRecord) => {
    if (entry.type === 'snapshot') onDeleteSnapshot(entry.record.id)
    else onDeleteOrder(entry.record.id)
  }

  const activateAt = (entry: TimelineRecord, index: number, event: ActivationEvent) => {
    if (event.metaKey || event.ctrlKey) {
      toggleAt(index)
      return
    }
    if (event.shiftKey) {
      selectRangeTo(index)
      return
    }
    openDetail(entry)
  }

  const selectAllShown = () => {
    emitSelection(new Set(timelineRecords.map(timelineKey)))
  }

  const clearSelection = () => {
    setAnchorKey(null)
    emitSelection(new Set())
  }

  const openContextMenu = (event: ReactMouseEvent<HTMLElement>, entry: TimelineRecord) => {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, entry })
  }

  const buildMenuItems = (entry: TimelineRecord): RecordsContextMenuItem[] => {
    const key = timelineKey(entry)
    const isSelected = selectedKeys.has(key)
    const items: RecordsContextMenuItem[] = [
      { key: 'detail', label: copy.contextViewDetail, onSelect: () => openDetail(entry) },
      {
        key: 'select',
        label: isSelected ? copy.contextDeselect : copy.contextSelect,
        onSelect: () => toggleKey(key),
      },
      { key: 'delete', label: copy.delete, danger: true, onSelect: () => deleteEntry(entry) },
    ]
    if (selectedCount > 0 && onDeleteSelected) {
      items.push({
        key: 'delete-selected',
        label: copy.contextDeleteSelected.replace('{count}', String(selectedCount)),
        danger: true,
        onSelect: onDeleteSelected,
      })
    }
    return items
  }

  const openToolbarMenu = (event: ReactMouseEvent<HTMLElement>) => {
    setToolbarMenu({ x: event.clientX, y: event.clientY })
  }

  const toolbarMenuItems: RecordsContextMenuItem[] = []
  if (onBulkDeleteOrders) {
    toolbarMenuItems.push({
      key: 'bulk-orders',
      label: copy.bulkDeleteOrders,
      danger: true,
      onSelect: onBulkDeleteOrders,
    })
  }
  if (onBulkDeleteSnapshots) {
    toolbarMenuItems.push({
      key: 'bulk-snapshots',
      label: copy.bulkDeleteSnapshots,
      danger: true,
      onSelect: onBulkDeleteSnapshots,
    })
  }
  const hasToolbarMenu = toolbarMenuItems.length > 0

  const slotFilterValueLabel =
    slotFilter.kind === 'all'
      ? copy.slotFilterAll
      : slotFilter.kind === 'unassigned'
        ? copy.slotFilterUnassigned
        : (slots.find((slot) => slot.id === slotFilter.id)?.title ?? copy.slotFilterLabel)
  const slotMenuItems: RecordsContextMenuItem[] = onSlotFilterChange
    ? [
        { key: 'all', label: copy.slotFilterAll, onSelect: () => onSlotFilterChange({ kind: 'all' }) },
        {
          key: 'unassigned',
          label: copy.slotFilterUnassigned,
          onSelect: () => onSlotFilterChange({ kind: 'unassigned' }),
        },
        ...slots.map((slot) => ({
          key: `slot:${slot.id}`,
          label: slot.title,
          onSelect: () => onSlotFilterChange({ kind: 'slot', id: slot.id }),
        })),
      ]
    : []

  return (
    <div className="my-page-shell records-archive-page">
      <div className="my-page records-archive">
        <header className="my-page-header records-archive-sidebar">
          <a className="my-page-back" href={MY_PAGE_PATH}>
            {backLabel ?? copy.savedModalGoToRecords}
          </a>
          <div className="my-page-hero">
            <div>
              <h1>{copy.recordsArchiveTitle}</h1>
              <p>{copy.recordsArchiveDescription}</p>
            </div>
          </div>
          {signedIn && memoWorkspace && (
            <div className={`records-memo-workspace${memoExpanded ? ' records-memo-workspace--expanded' : ''}`}>
              {onToggleMemoWorkspace && (
                <button
                  type="button"
                  className="records-memo-workspace__toggle"
                  aria-expanded={memoExpanded}
                  onClick={onToggleMemoWorkspace}
                >
                  <span>{memoSummary}</span>
                  <span aria-hidden="true">{memoExpanded ? '▴' : '▾'}</span>
                </button>
              )}
              <div className="records-memo-workspace__body">{memoWorkspace}</div>
            </div>
          )}
        </header>

        <main className="my-page-console">
          <section className="my-page-panel records-archive-panel">
            {!signedIn ? (
              <p className="account-records-empty">{copy.loginRequired}</p>
            ) : (
              <>
                <div className="records-timeline-toolbar">
                  <div className="records-timeline-actions">
                    {onDateAnchorChange && (
                      <label className="records-date-jump">
                        <span className="records-date-jump-label">{copy.jumpToDate}</span>
                        <input
                          type="date"
                          className="records-date-jump-input"
                          aria-label={copy.jumpToDateAria}
                          max={todayInputValue}
                          value={dateAnchor ?? ''}
                          onChange={(event) =>
                            onDateAnchorChange(event.target.value ? event.target.value : null)
                          }
                        />
                      </label>
                    )}
                    {onSlotFilterChange && slotMenuItems.length > 0 && (
                      <button
                        type="button"
                        className="records-slot-filter"
                        aria-haspopup="menu"
                        aria-label={copy.slotFilterAria}
                        onClick={(event) => setSlotMenu({ x: event.clientX, y: event.clientY })}
                      >
                        <span className="records-slot-filter-label">{copy.slotFilterLabel}</span>
                        <span className="records-slot-filter-value">{slotFilterValueLabel}</span>
                        <span aria-hidden="true">▾</span>
                      </button>
                    )}
                    {onOpenExport && (
                      <button
                        type="button"
                        className="records-export-trigger"
                        onClick={onOpenExport}
                      >
                        <span aria-hidden="true">⇩</span>
                        <span>{copy.export}</span>
                      </button>
                    )}
                    {hasToolbarMenu && (
                      <button
                        type="button"
                        className="records-timeline-more"
                        aria-haspopup="menu"
                        aria-label={copy.moreActions}
                        disabled={orderActionsLocked || snapshotActionsLocked}
                        onClick={openToolbarMenu}
                      >
                        <span aria-hidden="true">⋯</span>
                      </button>
                    )}
                  </div>
                </div>

                {selectedCount > 0 && (
                  <div className="records-selection-bar" role="status">
                    <span className="records-selection-bar-count">
                      {copy.selectedCount.replace('{count}', String(selectedCount))}
                    </span>
                    <div className="records-selection-bar-actions">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={selectAllShown}
                        disabled={selectionBusy}
                      >
                        {copy.selectAllShown}
                      </button>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={clearSelection}
                        disabled={selectionBusy}
                      >
                        {copy.clearSelection}
                      </button>
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        onClick={onDeleteSelected}
                        disabled={selectionBusy}
                      >
                        {selectionBusy ? copy.bulkDeleteBusy : copy.deleteSelected}
                      </button>
                    </div>
                  </div>
                )}

                {notice && <p className="account-records-notice" role="status">{notice}</p>}
                {error && (
                  <div className="account-records-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="link-btn" onClick={onRetry}>
                      {copy.retry}
                    </button>
                  </div>
                )}

                {loading ? (
                  <p className="account-records-empty" role="status">{copy.loading}</p>
                ) : hasRecords ? (
                  <>
                    <div className="records-timeline-head" aria-hidden="true">
                      <div className="records-timeline-lane-head records-timeline-lane-head--snapshots">
                        <span className="records-timeline-head-select" aria-hidden="true" />
                        <div className="records-timeline-head-fields records-timeline-head-fields--snapshots">
                          <span>{copy.summaryAccountEquity}</span>
                          <span>{copy.summaryLiquidationBuffer}</span>
                          <span>{copy.summaryLeverage}</span>
                        </div>
                        <span className="records-timeline-head-memo" aria-hidden="true" />
                      </div>
                      <span className="records-timeline-head-time" aria-hidden="true" />
                      <div className="records-timeline-lane-head records-timeline-lane-head--orders">
                        <span className="records-timeline-head-select" aria-hidden="true" />
                        <div className="records-timeline-head-fields records-timeline-head-fields--orders">
                          <span>{copy.side}</span>
                          <span>{copy.archiveOrderContracts}</span>
                          <span>{copy.archiveOrderPrice}</span>
                        </div>
                        <span className="records-timeline-head-memo" aria-hidden="true" />
                      </div>
                    </div>
                    <div ref={timelineScrollRef} className="records-timeline-scroll">
                      <div
                        className={`records-timeline-grid${selectedCount > 0 ? ' records-timeline-grid--selecting' : ''}`}
                      >
                        {timelineAnchorDate && (
                          <>
                            <div className="records-timeline-anchor-spacer" aria-hidden="true" />
                            <div
                              className="records-timeline-anchor"
                              data-timeline-anchor-date={timelineAnchorDate}
                            >
                              <span className="records-timeline-anchor-line" aria-hidden="true" />
                              <span className="records-timeline-anchor-label">
                                {copy.timelineAnchorLabel.replace('{date}', timelineAnchorDate.replace(/-/g, '.'))}
                                {dateAnchor && onDateAnchorChange && (
                                  <button
                                    type="button"
                                    className="link-btn records-timeline-anchor-clear"
                                    onClick={() => onDateAnchorChange(null)}
                                  >
                                    {copy.backToLatest}
                                  </button>
                                )}
                              </span>
                              <span className="records-timeline-anchor-line" aria-hidden="true" />
                            </div>
                          </>
                        )}
                        {timelineRecords.map((entry, index) => {
                          const entryKey = timelineKey(entry)
                          const selected = selectedKeys.has(entryKey)
                          const contextActive = menu != null && timelineKey(menu.entry) === entryKey
                          const slotLabel = showTimelineSlotNames
                            ? resolveAccountRecordSlotLabel(
                                entry.record.numberSetId,
                                slotTitles,
                                copy.slotFilterUnassigned,
                                copy.slotNameUnavailable,
                              )
                            : null
                          return (
                            <div
                              key={`${entry.type}-${entry.id}`}
                              className={`records-timeline-row records-timeline-row--${entry.type}`}
                              data-record-type={entry.type}
                            >
                              {entry.type === 'snapshot' ? (
                                <div className="records-timeline-cell records-timeline-cell--snapshots">
                                  <SnapshotTimelineCard
                                    copy={copy}
                                    disabled={snapshotActionsLocked || selectionBusy}
                                    record={entry.record}
                                    selected={selected}
                                    contextActive={contextActive}
                                    onToggleSelect={() => toggleAt(index)}
                                    onActivate={(event) => activateAt(entry, index, event)}
                                    onContextMenu={(event) => openContextMenu(event, entry)}
                                    onEditMemo={() => onEditMemo?.(entry)}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="records-timeline-cell records-timeline-cell--snapshots records-timeline-cell--empty"
                                  aria-hidden="true"
                                />
                              )}
                              <div className="records-timeline-meta">
                                <time className="records-timeline-time" dateTime={entry.createdAt}>
                                  {formatSavedAtCompact(entry.createdAt)}
                                </time>
                                {slotLabel && (
                                  <span className="records-timeline-slot" title={slotLabel}>
                                    {slotLabel}
                                  </span>
                                )}
                              </div>
                              {entry.type === 'order' ? (
                                <div className="records-timeline-cell records-timeline-cell--orders">
                                  <OrderTimelineCard
                                    copy={copy}
                                    disabled={orderActionsLocked || selectionBusy}
                                    record={entry.record}
                                    selected={selected}
                                    contextActive={contextActive}
                                    onToggleSelect={() => toggleAt(index)}
                                    onActivate={(event) => activateAt(entry, index, event)}
                                    onContextMenu={(event) => openContextMenu(event, entry)}
                                    onEditMemo={() => onEditMemo?.(entry)}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="records-timeline-cell records-timeline-cell--orders records-timeline-cell--empty"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                      {onLoadOlderRecords && (
                        <>
                          {/* 스크롤이 이 지점 근처에 닿으면 자동으로 다음 페이지 로드(무한 스크롤).
                              버튼은 접근성·observer 미지원 대비 폴백으로 유지. */}
                          <div
                            ref={loadMoreSentinelRef}
                            className="records-timeline-sentinel"
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            className="link-btn account-record-load-more records-timeline-load-more"
                            disabled={loadingOlderRecords}
                            onClick={onLoadOlderRecords}
                          >
                            {loadingOlderRecords ? copy.loadingMore : copy.loadOlderRecords}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="account-records-empty">{copy.timelineEmpty}</p>
                )}
              </>
            )}
          </section>

          {detail && (
            <RecordsDetailPanel
              detail={detail}
              copy={copy}
              closeLabel={closeLabel ?? 'Close'}
              onClose={onCloseDetail ?? (() => undefined)}
              onEditMemo={() =>
                detail.type === 'snapshot'
                  ? onEditDetailMemo?.({
                      type: 'snapshot',
                      id: detail.record.id,
                      createdAt: detail.record.createdAt,
                      record: detail.record,
                    })
                  : onEditDetailMemo?.({
                      type: 'order',
                      id: detail.record.id,
                      createdAt: detail.record.createdAt,
                      record: detail.record,
                    })
              }
            />
          )}
        </main>
      </div>
      {menu && (
        <RecordsContextMenu
          x={menu.x}
          y={menu.y}
          ariaLabel={copy.contextMenuLabel}
          items={buildMenuItems(menu.entry)}
          onClose={() => setMenu(null)}
        />
      )}
      {toolbarMenu && hasToolbarMenu && (
        <RecordsContextMenu
          x={toolbarMenu.x}
          y={toolbarMenu.y}
          ariaLabel={copy.moreActions}
          items={toolbarMenuItems}
          onClose={() => setToolbarMenu(null)}
        />
      )}
      {slotMenu && slotMenuItems.length > 0 && (
        <RecordsContextMenu
          x={slotMenu.x}
          y={slotMenu.y}
          ariaLabel={copy.slotFilterAria}
          items={slotMenuItems}
          onClose={() => setSlotMenu(null)}
        />
      )}
    </div>
  )
}

export function RecordsArchivePage() {
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const { setNumberSetMemo } = useCalculator()
  const recordsRepository = useMemo(() => createAccountRecordsRepository(), [])
  const [orderRecords, setOrderRecords] = useState<OrderHistoryRecord[]>([])
  const [snapshotRecords, setSnapshotRecords] = useState<AccountSnapshotRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [orderBulkBusy, setOrderBulkBusy] = useState(false)
  const [snapshotBulkBusy, setSnapshotBulkBusy] = useState(false)
  const [orderDeleteBusy, setOrderDeleteBusy] = useState(false)
  const [snapshotDeleteBusy, setSnapshotDeleteBusy] = useState(false)
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState<RecordGroup | null>(null)
  const [orderOffset, setOrderOffset] = useState(0)
  const [snapshotOffset, setSnapshotOffset] = useState(0)
  const [orderHasMore, setOrderHasMore] = useState(false)
  const [snapshotHasMore, setSnapshotHasMore] = useState(false)
  const [orderTotal, setOrderTotal] = useState<number | null>(null)
  const [snapshotTotal, setSnapshotTotal] = useState<number | null>(null)
  const [orderLoadingMore, setOrderLoadingMore] = useState(false)
  const [snapshotLoadingMore, setSnapshotLoadingMore] = useState(false)
  const [detail, setDetail] = useState<DetailSelection>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const [selectionBusy, setSelectionBusy] = useState(false)
  const [selectionDeleteConfirm, setSelectionDeleteConfirm] = useState(false)
  const recordsRequestIdRef = useRef(0)
  const activeRecordsUserIdRef = useRef(user?.id ?? null)
  const [numberSetFilter, setNumberSetFilter] = useState<NumberSetFilter>({ kind: 'all' })
  const [slots, setSlots] = useState<NumberSetRecord[]>([])
  const [slotContextUserId, setSlotContextUserId] = useState<string | null>(null)
  const [dateAnchor, setDateAnchor] = useState<string | null>(null)
  const [memoEntry, setMemoEntry] = useState<TimelineRecord | null>(null)
  const [memoTarget, setMemoTarget] = useState<RecordsMemoTarget>(null)
  const [memoRevision, setMemoRevision] = useState(0)
  const [memoExpanded, setMemoExpanded] = useState(false)
  const memoWorkspaceRef = useRef<MemoEditorHandle>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // 날짜 점프: 선택한 날(YYYY-MM-DD)의 끝(로컬 23:59:59.999)을 상한으로 삼아
  // 그 시각 이하의 기록만 조회한다. null이면 상한 없음(최신부터).
  const beforeBound = useMemo(() => {
    if (!dateAnchor) return null
    const end = new Date(`${dateAnchor}T23:59:59.999`)
    return Number.isNaN(end.getTime()) ? null : end.toISOString()
  }, [dateAnchor])

  const loadRecords = useCallback(async () => {
    const requestId = recordsRequestIdRef.current + 1
    recordsRequestIdRef.current = requestId
    const userId = user?.id ?? null

    if (!userId) {
      setOrderRecords([])
      setSnapshotRecords([])
      setLoading(false)
      setError(null)
      setNotice(null)
      setOrderOffset(0)
      setSnapshotOffset(0)
      setOrderHasMore(false)
      setSnapshotHasMore(false)
      setOrderTotal(null)
      setSnapshotTotal(null)
      setDetail(null)
      setSelectedKeys(new Set())
      return
    }

    if (slotContextUserId !== userId) return

    setLoading(true)
    setError(null)
    const [bundleResult, countsResult] = await Promise.all([
      recordsRepository.fetchRecentRecords(userId, undefined, numberSetFilter, beforeBound),
      recordsRepository.fetchRecordCounts(userId, numberSetFilter, beforeBound),
    ])

    if (recordsRequestIdRef.current !== requestId || activeRecordsUserIdRef.current !== userId) {
      return
    }

    if (bundleResult.error !== null) {
      setError(t.accountRecords.loadError)
      setLoading(false)
      return
    }

    setOrderRecords(bundleResult.data.orderHistory)
    setSnapshotRecords(bundleResult.data.accountSnapshots)
    setOrderOffset(bundleResult.data.orderHistory.length)
    setSnapshotOffset(bundleResult.data.accountSnapshots.length)
    setOrderHasMore(bundleResult.data.hasMoreOrders)
    setSnapshotHasMore(bundleResult.data.hasMoreSnapshots)
    setOrderTotal(countsResult.error === null ? countsResult.data.orderHistoryCount : null)
    setSnapshotTotal(countsResult.error === null ? countsResult.data.accountSnapshotCount : null)
    setSelectedKeys(new Set())
    setLoading(false)
  }, [beforeBound, numberSetFilter, recordsRepository, slotContextUserId, t.accountRecords.loadError, user?.id])

  const loadOlderRecords = useCallback(async () => {
    const userId = user?.id ?? null
    const hasOlderRecords = orderHasMore || snapshotHasMore
    const loadingMore = orderLoadingMore || snapshotLoadingMore
    if (!userId || loadingMore || !hasOlderRecords) return

    setNotice(null)
    setOrderLoadingMore(orderHasMore)
    setSnapshotLoadingMore(snapshotHasMore)

    const [ordersResult, snapshotsResult] = await Promise.all([
      orderHasMore
        ? recordsRepository.fetchOrderHistoryPage(userId, orderOffset, undefined, numberSetFilter, beforeBound)
        : Promise.resolve(null),
      snapshotHasMore
        ? recordsRepository.fetchAccountSnapshotsPage(userId, snapshotOffset, undefined, numberSetFilter, beforeBound)
        : Promise.resolve(null),
    ])

    setOrderLoadingMore(false)
    setSnapshotLoadingMore(false)
    if (activeRecordsUserIdRef.current !== userId) return

    if (ordersResult?.error !== null && ordersResult != null) {
      setNotice(t.accountRecords.loadMoreError)
      return
    }
    if (snapshotsResult?.error !== null && snapshotsResult != null) {
      setNotice(t.accountRecords.loadMoreError)
      return
    }

    if (ordersResult?.error === null) {
      setOrderRecords((prev) => [...prev, ...ordersResult.data.records])
      setOrderOffset((prev) => prev + ordersResult.data.records.length)
      setOrderHasMore(ordersResult.data.hasMore)
    }

    if (snapshotsResult?.error === null) {
      setSnapshotRecords((prev) => [...prev, ...snapshotsResult.data.records])
      setSnapshotOffset((prev) => prev + snapshotsResult.data.records.length)
      setSnapshotHasMore(snapshotsResult.data.hasMore)
    }
  }, [
    beforeBound,
    orderHasMore,
    orderLoadingMore,
    orderOffset,
    recordsRepository,
    snapshotHasMore,
    snapshotLoadingMore,
    snapshotOffset,
    numberSetFilter,
    t.accountRecords.loadMoreError,
    user?.id,
  ])

  const deleteOrderRecord = useCallback(
    (id: string) => {
      const userId = user?.id ?? null
      if (!userId) return
      setNotice(null)
      setOrderDeleteBusy(true)
      void recordsRepository.deleteOrderHistory(userId, id).then((result) => {
        setOrderDeleteBusy(false)
        if (activeRecordsUserIdRef.current !== userId) return
        if (result.error !== null) {
          setNotice(t.accountRecords.deleteError)
          return
        }
        setOrderRecords((prev) => prev.filter((record) => record.id !== id))
        setOrderOffset((prev) => Math.max(0, prev - 1))
        setOrderTotal((prev) => (prev == null ? prev : Math.max(0, prev - 1)))
        setDetail((prev) => (prev?.type === 'order' && prev.record.id === id ? null : prev))
        setSelectedKeys((prev) => {
          const key = `order:${id}`
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
    },
    [recordsRepository, t.accountRecords.deleteError, user?.id],
  )

  const deleteSnapshotRecord = useCallback(
    (id: string) => {
      const userId = user?.id ?? null
      if (!userId) return
      setNotice(null)
      setSnapshotDeleteBusy(true)
      void recordsRepository.deleteAccountSnapshot(userId, id).then((result) => {
        setSnapshotDeleteBusy(false)
        if (activeRecordsUserIdRef.current !== userId) return
        if (result.error !== null) {
          setNotice(t.accountRecords.deleteError)
          return
        }
        setSnapshotRecords((prev) => prev.filter((record) => record.id !== id))
        setSnapshotOffset((prev) => Math.max(0, prev - 1))
        setSnapshotTotal((prev) => (prev == null ? prev : Math.max(0, prev - 1)))
        setDetail((prev) => (prev?.type === 'snapshot' && prev.record.id === id ? null : prev))
        setSelectedKeys((prev) => {
          const key = `snapshot:${id}`
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      })
    },
    [recordsRepository, t.accountRecords.deleteError, user?.id],
  )

  const confirmBulkDelete = useCallback(async () => {
    if (!user || !bulkDeleteConfirm) return
    const isOrders = bulkDeleteConfirm === 'orders'
    const setBusy = isOrders ? setOrderBulkBusy : setSnapshotBulkBusy
    setBusy(true)
    setNotice(null)
    const result = isOrders
      ? await recordsRepository.deleteAllOrderHistory(user.id)
      : await recordsRepository.deleteAllAccountSnapshots(user.id)
    setBusy(false)
    if (result.error !== null) {
      setNotice(t.accountRecords.bulkDeleteError)
      return
    }
    if (isOrders) {
      setOrderRecords([])
      setOrderOffset(0)
      setOrderHasMore(false)
      setOrderTotal(0)
      setDetail((prev) => (prev?.type === 'order' ? null : prev))
    } else {
      setSnapshotRecords([])
      setSnapshotOffset(0)
      setSnapshotHasMore(false)
      setSnapshotTotal(0)
      setDetail((prev) => (prev?.type === 'snapshot' ? null : prev))
    }
    const prunedPrefix = isOrders ? 'order:' : 'snapshot:'
    setSelectedKeys((prev) => new Set([...prev].filter((key) => !key.startsWith(prunedPrefix))))
    setBulkDeleteConfirm(null)
  }, [bulkDeleteConfirm, recordsRepository, t.accountRecords.bulkDeleteError, user])

  const confirmSelectionDelete = useCallback(async () => {
    const userId = user?.id ?? null
    if (!userId || selectedKeys.size === 0) return
    const orderIds = [...selectedKeys]
      .filter((key) => key.startsWith('order:'))
      .map((key) => key.slice('order:'.length))
    const snapshotIds = [...selectedKeys]
      .filter((key) => key.startsWith('snapshot:'))
      .map((key) => key.slice('snapshot:'.length))

    setSelectionBusy(true)
    setNotice(null)
    const [ordersResult, snapshotsResult] = await Promise.all([
      orderIds.length > 0 ? recordsRepository.deleteOrderHistoryMany(userId, orderIds) : Promise.resolve(null),
      snapshotIds.length > 0
        ? recordsRepository.deleteAccountSnapshotsMany(userId, snapshotIds)
        : Promise.resolve(null),
    ])
    setSelectionBusy(false)
    if (activeRecordsUserIdRef.current !== userId) return

    if ((ordersResult && ordersResult.error !== null) || (snapshotsResult && snapshotsResult.error !== null)) {
      setNotice(t.accountRecords.bulkDeleteError)
      return
    }

    const orderIdSet = new Set(orderIds)
    const snapshotIdSet = new Set(snapshotIds)
    setOrderRecords((prev) => prev.filter((record) => !orderIdSet.has(record.id)))
    setSnapshotRecords((prev) => prev.filter((record) => !snapshotIdSet.has(record.id)))
    setOrderOffset((prev) => Math.max(0, prev - orderIds.length))
    setSnapshotOffset((prev) => Math.max(0, prev - snapshotIds.length))
    setOrderTotal((prev) => (prev == null ? prev : Math.max(0, prev - orderIds.length)))
    setSnapshotTotal((prev) => (prev == null ? prev : Math.max(0, prev - snapshotIds.length)))
    setDetail((prev) => {
      if (!prev) return prev
      if (prev.type === 'order' && orderIdSet.has(prev.record.id)) return null
      if (prev.type === 'snapshot' && snapshotIdSet.has(prev.record.id)) return null
      return prev
    })
    setSelectedKeys(new Set())
    setSelectionDeleteConfirm(false)
  }, [recordsRepository, selectedKeys, t.accountRecords.bulkDeleteError, user?.id])

  useEffect(() => {
    activeRecordsUserIdRef.current = user?.id ?? null
  }, [user?.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route entry must start its async repository load
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const userId = user?.id ?? null
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear user-owned slot labels immediately on sign-out
      setSlots([])
      setNumberSetFilter({ kind: 'all' })
      setMemoTarget(null)
      setSlotContextUserId(null)
      return
    }
    let cancelled = false
    void fetchRecordsSlotContext(userId).then((result) => {
      if (cancelled) return
      if (result.error === null) {
        const nextSlots = result.data.slots
        const filter = resolveInitialRecordsSlotFilter(
          nextSlots,
          result.data.activeSlotId,
        )
        setSlots(nextSlots)
        setNumberSetFilter(filter)
        setMemoTarget(filter.kind === 'slot' ? { kind: 'slot', id: filter.id } : null)
      } else {
        setSlots([])
        setNumberSetFilter({ kind: 'all' })
        setMemoTarget(null)
      }
      setSlotContextUserId(userId)
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const hasOlderRecords = orderHasMore || snapshotHasMore
  const loadingOlderRecords = orderLoadingMore || snapshotLoadingMore
  const exportEndDate = useMemo(
    () => resolveTimelineAnchorDate(dateAnchor, toTimelineRecords(orderRecords, snapshotRecords)),
    [dateAnchor, orderRecords, snapshotRecords],
  )

  const exportRecords = useCallback(
    async (request: RecordsExportRequest): Promise<RecordsExportResult> => {
      const userId = user?.id ?? null
      if (!userId) return { ok: false, reason: 'error' }

      const from = request.startDate
        ? new Date(`${request.startDate}T00:00:00.000`).toISOString()
        : null
      const to = request.endDate
        ? new Date(`${request.endDate}T23:59:59.999`).toISOString()
        : null
      const filter = { numberSetFilter: request.numberSetFilter, from, to }

      try {
        if (request.kind === 'orders') {
          const result = await recordsRepository.fetchAllOrderHistory(userId, filter)
          if (result.error !== null) return { ok: false, reason: 'error' }
          if (result.data.length === 0) return { ok: false, reason: 'empty' }
          const table = buildOrderExportTable(result.data, slots, request.locale)
          const filename = await downloadRecordExport(table, request.kind, request.format)
          return { ok: true, filename }
        }

        const result = await recordsRepository.fetchAllAccountSnapshots(userId, filter)
        if (result.error !== null) return { ok: false, reason: 'error' }
        if (result.data.length === 0) return { ok: false, reason: 'empty' }
        const table = buildSnapshotExportTable(result.data, slots, request.locale)
        const filename = await downloadRecordExport(table, request.kind, request.format)
        return { ok: true, filename }
      } catch {
        return { ok: false, reason: 'error' }
      }
    },
    [recordsRepository, slots, user?.id],
  )

  const saveRecordMemo = useCallback(
    async (
      type: 'snapshot' | 'order',
      id: string,
      memo: string,
      refreshWorkspace = false,
    ): Promise<string | null> => {
      const userId = user?.id ?? null
      if (!userId) return 'not_logged_in'
      const result =
        type === 'snapshot'
          ? await recordsRepository.updateAccountSnapshotMemo(userId, id, memo)
          : await recordsRepository.updateOrderHistoryMemo(userId, id, memo)
      if (result.error !== null) return result.error
      const savedMemo = result.data
      if (type === 'snapshot') {
        setSnapshotRecords((records) =>
          records.map((record) => (record.id === id ? { ...record, memo: savedMemo } : record)),
        )
      } else {
        setOrderRecords((records) =>
          records.map((record) => (record.id === id ? { ...record, memo: savedMemo } : record)),
        )
      }
      setDetail((current) => {
        if (!current || current.record.id !== id) return current
        if (type === 'snapshot' && current.type === 'snapshot') {
          return { type: 'snapshot', record: { ...current.record, memo: savedMemo } }
        }
        if (type === 'order' && current.type === 'order') {
          return { type: 'order', record: { ...current.record, memo: savedMemo } }
        }
        return current
      })
      setMemoEntry((current) => {
        if (!current || current.record.id !== id) return current
        if (type === 'snapshot' && current.type === 'snapshot') {
          return { ...current, record: { ...current.record, memo: savedMemo } }
        }
        if (type === 'order' && current.type === 'order') {
          return { ...current, record: { ...current.record, memo: savedMemo } }
        }
        return current
      })
      if (refreshWorkspace) setMemoRevision((revision) => revision + 1)
      return null
    },
    [recordsRepository, user?.id],
  )

  const memoSlot =
    memoTarget?.kind === 'slot' ? slots.find((slot) => slot.id === memoTarget.id) ?? null : null
  const memoSnapshot =
    memoTarget?.kind === 'snapshot'
      ? snapshotRecords.find((record) => record.id === memoTarget.id) ?? null
      : null
  const memoOrder =
    memoTarget?.kind === 'order'
      ? orderRecords.find((record) => record.id === memoTarget.id) ?? null
      : null
  const memoTitle = memoSlot
    ? `${memoSlot.title} · ${t.accountRecords.memoWorkspaceTitle}`
    : memoSnapshot
      ? t.accountRecords.memoSnapshotTitle
      : memoOrder
        ? t.accountRecords.memoOrderTitle
        : t.accountRecords.memoWorkspaceTitle
  const memoInitialValue = memoSlot?.memo ?? memoSnapshot?.memo ?? memoOrder?.memo ?? null
  const memoTargetKey = memoTarget ? `${memoTarget.kind}:${memoTarget.id}:${memoRevision}` : `empty:${memoRevision}`
  const memoHasEditor = Boolean(memoSlot || memoSnapshot || memoOrder)

  const saveWorkspaceMemo = useCallback(
    async (memo: string): Promise<string | null> => {
      if (!memoTarget) return null
      if (memoTarget.kind === 'slot') {
        const error = await setNumberSetMemo('cloud', memoTarget.id, memo)
        if (error) return error
        const savedMemo = memo.trim() ? memo.slice(0, 500) : null
        setSlots((current) =>
          current.map((slot) => (slot.id === memoTarget.id ? { ...slot, memo: savedMemo } : slot)),
        )
        return null
      }
      return saveRecordMemo(memoTarget.kind, memoTarget.id, memo)
    },
    [memoTarget, saveRecordMemo, setNumberSetMemo],
  )

  const switchMemoTarget = useCallback(
    async (next: RecordsMemoTarget, expand = false) => {
      const saved = await memoWorkspaceRef.current?.save()
      if (saved === false) return
      setMemoTarget(next)
      if (expand) setMemoExpanded(true)
    },
    [],
  )

  const switchSlotFilter = useCallback(
    async (filter: NumberSetFilter) => {
      const saved = await memoWorkspaceRef.current?.save()
      if (saved === false) return
      setNumberSetFilter(filter)
      setMemoTarget(filter.kind === 'slot' ? { kind: 'slot', id: filter.id } : null)
      setDetail(null)
    },
    [],
  )

  const openDetailMemo = useCallback(
    async (entry: TimelineRecord) => {
      const saved = await memoWorkspaceRef.current?.save()
      if (saved === false) return
      setMemoTarget({ kind: entry.type, id: entry.id })
      setMemoExpanded(true)
      setMemoEntry(entry)
    },
    [],
  )

  const returnMemoTarget: RecordsMemoTarget =
    numberSetFilter.kind === 'slot' ? { kind: 'slot', id: numberSetFilter.id } : null
  const memoWorkspace = memoEntry ? (
    <section className="records-memo-editor records-memo-editor--mirrored" aria-label={memoTitle}>
      <header className="records-memo-editor__head">
        <div className="records-memo-editor__title">
          <MemoIcon filled={Boolean(memoEntry.record.memo?.trim())} />
          <strong>{memoTitle}</strong>
        </div>
      </header>
      <span className="records-memo-editor__status records-memo-editor__status--saved" role="status">
        {memoEntry.record.memo?.trim()
          ? t.accountRecords.memoSaved
          : t.accountRecords.memoEmptySaved}
      </span>
      <p className="records-memo-editor__preview">
        {memoEntry.record.memo || t.accountRecords.memoPlaceholder}
      </p>
    </section>
  ) : memoHasEditor ? (
    <MemoWorkspaceEditor
      key={memoTargetKey}
      ref={memoWorkspaceRef}
      title={memoTitle}
      initialMemo={memoInitialValue}
      onSave={saveWorkspaceMemo}
      returnLabel={memoTarget?.kind !== 'slot' ? t.accountRecords.memoBackToSlot : undefined}
      onReturn={memoTarget?.kind !== 'slot' ? () => void switchMemoTarget(returnMemoTarget) : undefined}
    />
  ) : (
    <div className="records-memo-empty">
      <strong>{t.accountRecords.memoWorkspaceTitle}</strong>
      <p>{t.accountRecords.memoWorkspaceHint}</p>
    </div>
  )

  return (
    <>
      <RecordsArchiveView
        copy={t.accountRecords}
        backLabel={t.myPage.title}
        closeLabel={t.close}
        signedIn={Boolean(user)}
        loading={loading || Boolean(user && slotContextUserId !== user.id)}
        error={error}
        notice={notice}
        orderRecords={orderRecords}
        snapshotRecords={snapshotRecords}
        onRetry={() => void loadRecords()}
        onDeleteOrder={deleteOrderRecord}
        onDeleteSnapshot={deleteSnapshotRecord}
        onBulkDeleteOrders={orderRecords.length > 0 ? () => setBulkDeleteConfirm('orders') : undefined}
        onBulkDeleteSnapshots={
          snapshotRecords.length > 0 ? () => setBulkDeleteConfirm('snapshots') : undefined
        }
        onLoadOlderRecords={hasOlderRecords ? () => void loadOlderRecords() : undefined}
        loadingOlderRecords={loadingOlderRecords}
        orderDeleteBusy={orderDeleteBusy}
        snapshotDeleteBusy={snapshotDeleteBusy}
        orderBulkBusy={orderBulkBusy}
        snapshotBulkBusy={snapshotBulkBusy}
        onOpenOrderDetail={(record) => setDetail({ type: 'order', record })}
        onOpenSnapshotDetail={(record) => setDetail({ type: 'snapshot', record })}
        detail={detail}
        onCloseDetail={() => setDetail(null)}
        onEditMemo={(entry) => void switchMemoTarget({ kind: entry.type, id: entry.id }, true)}
        onEditDetailMemo={(entry) => void openDetailMemo(entry)}
        memoWorkspace={memoWorkspace}
        memoSummary={memoTitle}
        memoExpanded={memoExpanded}
        onToggleMemoWorkspace={() => setMemoExpanded((expanded) => !expanded)}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={setSelectedKeys}
        onDeleteSelected={selectedKeys.size > 0 ? () => setSelectionDeleteConfirm(true) : undefined}
        selectionBusy={selectionBusy}
        slots={slots}
        slotFilter={numberSetFilter}
        onSlotFilterChange={(filter) => void switchSlotFilter(filter)}
        dateAnchor={dateAnchor}
        onDateAnchorChange={(date) => {
          setDateAnchor(date)
          setDetail(null)
        }}
        onOpenExport={user ? () => setExportOpen(true) : undefined}
      />
      {exportOpen && user && (
        <Suspense fallback={null}>
          <RecordsExportModal
            copy={t.accountRecords}
            locale={locale}
            slots={slots}
            initialFilter={numberSetFilter}
            initialEndDate={exportEndDate}
            onClose={() => setExportOpen(false)}
            onExport={exportRecords}
          />
        </Suspense>
      )}
      {memoEntry && user && (
        <MemoEditorWindow
          key={`${memoEntry.type}:${memoEntry.id}`}
          title={memoEntry.type === 'snapshot' ? t.accountRecords.memoSnapshotTitle : t.accountRecords.memoOrderTitle}
          initialMemo={memoEntry.record.memo}
          onSave={(memo) => saveRecordMemo(memoEntry.type, memoEntry.id, memo, true)}
          onClose={() => setMemoEntry(null)}
        />
      )}
      <SiteFooter />
      {bulkDeleteConfirm && (
        <Suspense fallback={null}>
          <BulkDeleteConfirmModal
            copy={{
              title:
                bulkDeleteConfirm === 'orders'
                  ? t.accountRecords.bulkDeleteOrders
                  : t.accountRecords.bulkDeleteSnapshots,
              body:
                bulkDeleteConfirm === 'orders'
                  ? orderTotal != null
                    ? t.accountRecords.bulkDeleteConfirmOrdersWithCount.replace(
                        '{count}',
                        String(orderTotal),
                      )
                    : t.accountRecords.bulkDeleteConfirmOrders
                  : snapshotTotal != null
                    ? t.accountRecords.bulkDeleteConfirmSnapshotsWithCount.replace(
                        '{count}',
                        String(snapshotTotal),
                      )
                    : t.accountRecords.bulkDeleteConfirmSnapshots,
              confirm: t.accountRecords.bulkDeleteConfirmButton,
              confirmBusy: t.accountRecords.bulkDeleteBusy,
              cancel: t.accountRecords.bulkDeleteCancel,
              close: t.close,
            }}
            busy={bulkDeleteConfirm === 'orders' ? orderBulkBusy : snapshotBulkBusy}
            onClose={() => setBulkDeleteConfirm(null)}
            onConfirm={() => void confirmBulkDelete()}
          />
        </Suspense>
      )}
      {selectionDeleteConfirm && (
        <Suspense fallback={null}>
          <BulkDeleteConfirmModal
            copy={{
              title: t.accountRecords.deleteSelected,
              body: t.accountRecords.bulkDeleteConfirmSelectedWithCount.replace(
                '{count}',
                String(selectedKeys.size),
              ),
              confirm: t.accountRecords.bulkDeleteConfirmButton,
              confirmBusy: t.accountRecords.bulkDeleteBusy,
              cancel: t.accountRecords.bulkDeleteCancel,
              close: t.close,
            }}
            busy={selectionBusy}
            onClose={() => setSelectionDeleteConfirm(false)}
            onConfirm={() => void confirmSelectionDelete()}
          />
        </Suspense>
      )}
    </>
  )
}

export default RecordsArchivePage
