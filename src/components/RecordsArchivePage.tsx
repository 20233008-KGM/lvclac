import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { MY_PAGE_PATH } from '../config/routes'
import { useAuth } from '../context/AuthContext'
import {
  createAccountRecordsRepository,
  type AccountRecordSummary,
  type AccountSnapshotRecord,
  type NumberSetFilter,
  type OrderHistoryRecord,
} from '../db/accountRecords'
import { fetchNumberSets } from '../db/numberSets'
import { useLanguage } from '../i18n'
import { RecordsContextMenu, type RecordsContextMenuItem } from './RecordsContextMenu'
import type { Messages } from '../i18n/types'
import {
  formatLeverageValue,
  formatNumber,
  formatPercent,
  formatSavedAtCompact,
} from '../utils/format'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

const BulkDeleteConfirmModal = lazy(() =>
  import('./BulkDeleteConfirmModal').then((mod) => ({ default: mod.BulkDeleteConfirmModal })),
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

type ActivationEvent = ReactMouseEvent<HTMLElement> | ReactKeyboardEvent<HTMLElement>

const EMPTY_SELECTION: Set<string> = new Set()

function timelineKey(entry: TimelineRecord): string {
  return `${entry.type}:${entry.id}`
}

function timestamp(value: string): number {
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

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

function shownCount(copy: AccountRecordsCopy, shown: number, total: number | null): string {
  if (total == null) return String(shown)
  return copy.shownCount.replace('{shown}', String(shown)).replace('{total}', String(total))
}

function SummaryCell({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="records-detail-metric">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
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

function DetailSummary({
  title,
  summary,
  copy,
}: {
  title: string
  summary: AccountRecordSummary
  copy: AccountRecordsCopy
}) {
  return (
    <section>
      <h4>{title}</h4>
      <dl className="records-detail-grid">
        <SummaryCell label={copy.summaryLiquidation} value={formatNumber(summary.liquidationPrice)} />
        <SummaryCell
          label={copy.summaryLiquidationBuffer}
          value={formatPercent(summary.toleranceRate)}
        />
        <SummaryCell label={copy.summaryLeverage} value={formatLeverageValue(summary.leverageRatio)} />
        <SummaryCell label={copy.summaryMaintenance} value={formatNumber(summary.maintenanceMargin)} />
        <SummaryCell label={copy.summaryAvailable} value={formatNumber(summary.availableMargin)} />
      </dl>
    </section>
  )
}

function RecordsDetailPanel({
  detail,
  copy,
  closeLabel,
  onClose,
}: {
  detail: DetailSelection
  copy: AccountRecordsCopy
  closeLabel: string
  onClose: () => void
}) {
  if (!detail) return null

  return (
    <section className="records-detail-panel" aria-label={copy.detail}>
      <div className="records-detail-head">
        <h3>{copy.detail}</h3>
        <button type="button" className="link-btn" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
      {detail.type === 'order' ? (
        <>
          <p className="records-detail-meta">
            {copy.side}: {detail.record.positionSide} · {copy.archiveOrderContracts}:{' '}
            {formatNumber(detail.record.orderContracts)} · {copy.archiveOrderPrice}:{' '}
            {formatNumber(detail.record.orderPrice)}
          </p>
          <div className="records-detail-compare">
            <DetailSummary title={copy.before} summary={detail.record.beforeResult} copy={copy} />
            <DetailSummary title={copy.after} summary={detail.record.afterResult} copy={copy} />
          </div>
        </>
      ) : (
        <>
          <p className="records-detail-meta">
            {detail.record.title} · {formatSavedAtCompact(detail.record.createdAt)}
          </p>
          <DetailSummary title={copy.snapshotsTab} summary={detail.record.result} copy={copy} />
        </>
      )}
    </section>
  )
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
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: AccountSnapshotRecord
  selected: boolean
  contextActive: boolean
  onToggleSelect: () => void
  onActivate: (event: ActivationEvent) => void
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void
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
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: OrderHistoryRecord
  selected: boolean
  contextActive: boolean
  onToggleSelect: () => void
  onActivate: (event: ActivationEvent) => void
  onContextMenu: (event: ReactMouseEvent<HTMLElement>) => void
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
  orderShownCount,
  orderTotalCount,
  snapshotShownCount,
  snapshotTotalCount,
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
  selectedKeys = EMPTY_SELECTION,
  onSelectedKeysChange,
  onDeleteSelected,
  selectionBusy = false,
  slots = [],
  slotFilter = { kind: 'all' },
  onSlotFilterChange,
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
  orderShownCount?: number
  orderTotalCount?: number | null
  snapshotShownCount?: number
  snapshotTotalCount?: number | null
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
  selectedKeys?: Set<string>
  onSelectedKeysChange?: (next: Set<string>) => void
  onDeleteSelected?: () => void
  selectionBusy?: boolean
  slots?: { id: string; title: string }[]
  slotFilter?: NumberSetFilter
  onSlotFilterChange?: (filter: NumberSetFilter) => void
}) {
  const timelineRecords = toTimelineRecords(orderRecords, snapshotRecords)
  const hasRecords = timelineRecords.length > 0
  const orderActionsLocked = loadingOlderRecords || orderDeleteBusy || orderBulkBusy
  const snapshotActionsLocked = loadingOlderRecords || snapshotDeleteBusy || snapshotBulkBusy
  const selectedCount = selectedKeys.size
  const [anchorKey, setAnchorKey] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; entry: TimelineRecord } | null>(null)
  const [toolbarMenu, setToolbarMenu] = useState<{ x: number; y: number } | null>(null)
  const [slotMenu, setSlotMenu] = useState<{ x: number; y: number } | null>(null)

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
        <header className="my-page-header">
          <a className="my-page-back" href={MY_PAGE_PATH}>
            {backLabel ?? copy.savedModalGoToRecords}
          </a>
          <div className="my-page-hero">
            <div>
              <h1>{copy.recordsArchiveTitle}</h1>
              <p>{copy.recordsArchiveDescription}</p>
            </div>
          </div>
        </header>

        <main className="my-page-console">
          <section className="my-page-panel records-archive-panel">
            {!signedIn ? (
              <p className="account-records-empty">{copy.loginRequired}</p>
            ) : (
              <>
                <div className="records-timeline-toolbar">
                  <div className="records-timeline-counts" aria-label={copy.recordsArchiveTitle}>
                    <span>
                      {copy.snapshotsTab}: {shownCount(copy, snapshotShownCount ?? snapshotRecords.length, snapshotTotalCount ?? null)}
                    </span>
                    <span>
                      {copy.orderHistoryTab}: {shownCount(copy, orderShownCount ?? orderRecords.length, orderTotalCount ?? null)}
                    </span>
                  </div>
                  <div className="records-timeline-actions">
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
                      </div>
                      <span className="records-timeline-head-time" aria-hidden="true" />
                      <div className="records-timeline-lane-head records-timeline-lane-head--orders">
                        <span className="records-timeline-head-select" aria-hidden="true" />
                        <div className="records-timeline-head-fields records-timeline-head-fields--orders">
                          <span>{copy.side}</span>
                          <span>{copy.archiveOrderContracts}</span>
                          <span>{copy.archiveOrderPrice}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`records-timeline-grid${selectedCount > 0 ? ' records-timeline-grid--selecting' : ''}`}
                    >
                      {timelineRecords.map((entry, index) => {
                        const entryKey = timelineKey(entry)
                        const selected = selectedKeys.has(entryKey)
                        const contextActive = menu != null && timelineKey(menu.entry) === entryKey
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
                                />
                              </div>
                            ) : (
                              <div
                                className="records-timeline-cell records-timeline-cell--snapshots records-timeline-cell--empty"
                                aria-hidden="true"
                              />
                            )}
                            <time className="records-timeline-time" dateTime={entry.createdAt}>
                              {formatSavedAtCompact(entry.createdAt)}
                            </time>
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
                      <button
                        type="button"
                        className="link-btn account-record-load-more records-timeline-load-more"
                        disabled={loadingOlderRecords}
                        onClick={onLoadOlderRecords}
                      >
                        {loadingOlderRecords ? copy.loadingMore : copy.loadOlderRecords}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="account-records-empty">{copy.timelineEmpty}</p>
                )}
              </>
            )}
          </section>

          <RecordsDetailPanel
            detail={detail}
            copy={copy}
            closeLabel={closeLabel ?? 'Close'}
            onClose={onCloseDetail ?? (() => undefined)}
          />
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
  const { t } = useLanguage()
  const { user } = useAuth()
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
  const [slots, setSlots] = useState<{ id: string; title: string }[]>([])

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

    setLoading(true)
    setError(null)
    const [bundleResult, countsResult] = await Promise.all([
      recordsRepository.fetchRecentRecords(userId, undefined, numberSetFilter),
      recordsRepository.fetchRecordCounts(userId, numberSetFilter),
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
  }, [numberSetFilter, recordsRepository, t.accountRecords.loadError, user?.id])

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
        ? recordsRepository.fetchOrderHistoryPage(userId, orderOffset, undefined, numberSetFilter)
        : Promise.resolve(null),
      snapshotHasMore
        ? recordsRepository.fetchAccountSnapshotsPage(userId, snapshotOffset, undefined, numberSetFilter)
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
    void loadRecords()
  }, [loadRecords])

  useEffect(() => {
    const userId = user?.id ?? null
    if (!userId) {
      setSlots([])
      return
    }
    let cancelled = false
    void fetchNumberSets(userId).then((result) => {
      if (cancelled) return
      if (result.error === null) {
        setSlots(result.data.map((set) => ({ id: set.id, title: set.title })))
      }
    })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const hasOlderRecords = orderHasMore || snapshotHasMore
  const loadingOlderRecords = orderLoadingMore || snapshotLoadingMore

  return (
    <>
      <RecordsArchiveView
        copy={t.accountRecords}
        backLabel={t.myPage.title}
        closeLabel={t.close}
        signedIn={Boolean(user)}
        loading={loading}
        error={error}
        notice={notice}
        orderRecords={orderRecords}
        snapshotRecords={snapshotRecords}
        orderShownCount={orderRecords.length}
        orderTotalCount={orderTotal}
        snapshotShownCount={snapshotRecords.length}
        snapshotTotalCount={snapshotTotal}
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
        selectedKeys={selectedKeys}
        onSelectedKeysChange={setSelectedKeys}
        onDeleteSelected={selectedKeys.size > 0 ? () => setSelectionDeleteConfirm(true) : undefined}
        selectionBusy={selectionBusy}
        slots={slots}
        slotFilter={numberSetFilter}
        onSlotFilterChange={(filter) => {
          setNumberSetFilter(filter)
          setDetail(null)
        }}
      />
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
