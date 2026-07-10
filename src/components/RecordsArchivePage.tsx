import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MY_PAGE_PATH } from '../config/routes'
import { useAuth } from '../context/AuthContext'
import {
  createAccountRecordsRepository,
  type AccountRecordSummary,
  type AccountSnapshotRecord,
  type OrderHistoryRecord,
} from '../db/accountRecords'
import { useLanguage } from '../i18n'
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

function SnapshotTimelineCard({
  copy,
  disabled,
  record,
  onDelete,
  onOpenDetail,
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: AccountSnapshotRecord
  onDelete: (id: string) => void
  onOpenDetail: (record: AccountSnapshotRecord) => void
}) {
  return (
    <article className="records-timeline-card records-timeline-card--snapshot">
      <dl className="records-timeline-fields">
        <TimelineValue value={formatNumber(record.inputs.accountEval ?? null)} />
        <TimelineValue value={formatPercent(record.result.toleranceRate)} />
        <TimelineValue value={formatLeverageValue(record.result.leverageRatio)} />
      </dl>
      <div className="records-timeline-card-actions">
        <button type="button" className="link-btn" onClick={() => onOpenDetail(record)}>
          {copy.detail}
        </button>
        <button
          type="button"
          className="link-btn account-record-delete"
          disabled={disabled}
          onClick={() => onDelete(record.id)}
        >
          {copy.delete}
        </button>
      </div>
    </article>
  )
}

function OrderTimelineCard({
  copy,
  disabled,
  record,
  onDelete,
  onOpenDetail,
}: {
  copy: AccountRecordsCopy
  disabled: boolean
  record: OrderHistoryRecord
  onDelete: (id: string) => void
  onOpenDetail: (record: OrderHistoryRecord) => void
}) {
  return (
    <article className="records-timeline-card records-timeline-card--order">
      <dl className="records-timeline-fields">
        <TimelineValue value={record.positionSide} />
        <TimelineValue value={formatNumber(record.orderContracts)} />
        <TimelineValue value={formatNumber(record.orderPrice)} />
      </dl>
      <div className="records-timeline-card-actions">
        <button type="button" className="link-btn" onClick={() => onOpenDetail(record)}>
          {copy.detail}
        </button>
        <button
          type="button"
          className="link-btn account-record-delete"
          disabled={disabled}
          onClick={() => onDelete(record.id)}
        >
          {copy.delete}
        </button>
      </div>
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
}) {
  const timelineRecords = toTimelineRecords(orderRecords, snapshotRecords)
  const hasRecords = timelineRecords.length > 0
  const orderActionsLocked = loadingOlderRecords || orderDeleteBusy || orderBulkBusy
  const snapshotActionsLocked = loadingOlderRecords || snapshotDeleteBusy || snapshotBulkBusy

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
                    {onBulkDeleteSnapshots && (
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        disabled={snapshotActionsLocked}
                        onClick={onBulkDeleteSnapshots}
                      >
                        {snapshotBulkBusy ? copy.bulkDeleteBusy : copy.bulkDeleteSnapshots}
                      </button>
                    )}
                    {onBulkDeleteOrders && (
                      <button
                        type="button"
                        className="link-btn link-btn--danger"
                        disabled={orderActionsLocked}
                        onClick={onBulkDeleteOrders}
                      >
                        {orderBulkBusy ? copy.bulkDeleteBusy : copy.bulkDeleteOrders}
                      </button>
                    )}
                  </div>
                </div>

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
                        <div className="records-timeline-head-fields records-timeline-head-fields--snapshots">
                          <span>{copy.summaryAccountEquity}</span>
                          <span>{copy.summaryLiquidationBuffer}</span>
                          <span>{copy.summaryLeverage}</span>
                        </div>
                        <span className="records-timeline-head-actions" />
                      </div>
                      <span className="records-timeline-head-time" aria-hidden="true" />
                      <div className="records-timeline-lane-head records-timeline-lane-head--orders">
                        <div className="records-timeline-head-fields records-timeline-head-fields--orders">
                          <span>{copy.side}</span>
                          <span>{copy.archiveOrderContracts}</span>
                          <span>{copy.archiveOrderPrice}</span>
                        </div>
                        <span className="records-timeline-head-actions" />
                      </div>
                    </div>
                    <div className="records-timeline-grid">
                      {timelineRecords.map((entry) => (
                        <div
                          key={`${entry.type}-${entry.id}`}
                          className={`records-timeline-row records-timeline-row--${entry.type}`}
                          data-record-type={entry.type}
                        >
                          {entry.type === 'snapshot' ? (
                            <div className="records-timeline-cell records-timeline-cell--snapshots">
                              <SnapshotTimelineCard
                                copy={copy}
                                disabled={snapshotActionsLocked}
                                record={entry.record}
                                onDelete={onDeleteSnapshot}
                                onOpenDetail={onOpenSnapshotDetail}
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
                                disabled={orderActionsLocked}
                                record={entry.record}
                                onDelete={onDeleteOrder}
                                onOpenDetail={onOpenOrderDetail}
                              />
                            </div>
                          ) : (
                            <div
                              className="records-timeline-cell records-timeline-cell--orders records-timeline-cell--empty"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      ))}
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
  const recordsRequestIdRef = useRef(0)
  const activeRecordsUserIdRef = useRef(user?.id ?? null)

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
      return
    }

    setLoading(true)
    setError(null)
    const [bundleResult, countsResult] = await Promise.all([
      recordsRepository.fetchRecentRecords(userId),
      recordsRepository.fetchRecordCounts(userId),
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
    setLoading(false)
  }, [recordsRepository, t.accountRecords.loadError, user?.id])

  const loadOlderRecords = useCallback(async () => {
    const userId = user?.id ?? null
    const hasOlderRecords = orderHasMore || snapshotHasMore
    const loadingMore = orderLoadingMore || snapshotLoadingMore
    if (!userId || loadingMore || !hasOlderRecords) return

    setNotice(null)
    setOrderLoadingMore(orderHasMore)
    setSnapshotLoadingMore(snapshotHasMore)

    const [ordersResult, snapshotsResult] = await Promise.all([
      orderHasMore ? recordsRepository.fetchOrderHistoryPage(userId, orderOffset) : Promise.resolve(null),
      snapshotHasMore ? recordsRepository.fetchAccountSnapshotsPage(userId, snapshotOffset) : Promise.resolve(null),
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
    setBulkDeleteConfirm(null)
  }, [bulkDeleteConfirm, recordsRepository, t.accountRecords.bulkDeleteError, user])

  useEffect(() => {
    activeRecordsUserIdRef.current = user?.id ?? null
  }, [user?.id])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

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
    </>
  )
}

export default RecordsArchivePage
