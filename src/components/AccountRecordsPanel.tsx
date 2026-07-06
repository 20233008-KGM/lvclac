import type {
  AccountRecordSummary,
  AccountSnapshotRecord,
  OrderHistoryRecord,
} from '../db/accountRecords'
import type { Messages } from '../i18n/types'
import { formatLeverageValue, formatNumber } from '../utils/format'

export type AccountRecordsTab = 'orders' | 'snapshots'

type AccountRecordsCopy = Messages['accountRecords']

interface AccountRecordsPanelProps {
  copy: AccountRecordsCopy
  signedIn: boolean
  activeTab: AccountRecordsTab
  onTabChange: (tab: AccountRecordsTab) => void
  loading: boolean
  error: string | null
  notice: string | null
  orderRecords: OrderHistoryRecord[]
  snapshotRecords: AccountSnapshotRecord[]
  onRetry: () => void
  onSaveSnapshot: () => void
  onDeleteOrder: (id: string) => void
  onDeleteSnapshot: (id: string) => void
  snapshotBusy?: boolean
}

function formatSavedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function summaryItems(summary: AccountRecordSummary, copy: AccountRecordsCopy) {
  return [
    { label: copy.summaryLiquidation, value: formatNumber(summary.liquidationPrice) },
    { label: copy.summaryLeverage, value: formatLeverageValue(summary.leverageRatio) },
    { label: copy.summaryMaintenance, value: formatNumber(summary.maintenanceMargin) },
    { label: copy.summaryAvailable, value: formatNumber(summary.availableMargin) },
  ]
}

function SummaryGrid({
  summary,
  copy,
}: {
  summary: AccountRecordSummary
  copy: AccountRecordsCopy
}) {
  return (
    <dl className="account-record-summary">
      {summaryItems(summary, copy).map((item) => (
        <div key={item.label} className="account-record-summary__item">
          <dt>{item.label}</dt>
          <dd>{item.value || copy.noValue}</dd>
        </div>
      ))}
      {summary.isAtRisk && (
        <div className="account-record-summary__item account-record-summary__item--risk">
          <dt>{copy.atRisk}</dt>
          <dd>{copy.atRisk}</dd>
        </div>
      )}
    </dl>
  )
}

function EmptyState({ children }: { children: string }) {
  return <p className="account-records-empty">{children}</p>
}

function OrderRecordItem({
  record,
  copy,
  onDelete,
}: {
  record: OrderHistoryRecord
  copy: AccountRecordsCopy
  onDelete: (id: string) => void
}) {
  return (
    <li className="account-record-item">
      <div className="account-record-item__head">
        <div>
          <strong>{copy.orderSimulationLabel}</strong>
          <span>{formatSavedAt(record.createdAt)}</span>
        </div>
        <button type="button" className="link-btn account-record-delete" onClick={() => onDelete(record.id)}>
          {copy.delete}
        </button>
      </div>
      <div className="account-record-meta">
        <span>
          {copy.side}: {record.positionSide}
        </span>
        <span>
          {copy.contracts}: {formatNumber(record.orderContracts)}
        </span>
        <span>
          {copy.price}: {formatNumber(record.orderPrice)}
        </span>
      </div>
      <div className="account-record-compare">
        <section>
          <h4>{copy.before}</h4>
          <SummaryGrid summary={record.beforeResult} copy={copy} />
        </section>
        <section>
          <h4>{copy.after}</h4>
          <SummaryGrid summary={record.afterResult} copy={copy} />
        </section>
      </div>
    </li>
  )
}

function SnapshotRecordItem({
  record,
  copy,
  onDelete,
}: {
  record: AccountSnapshotRecord
  copy: AccountRecordsCopy
  onDelete: (id: string) => void
}) {
  return (
    <li className="account-record-item">
      <div className="account-record-item__head">
        <div>
          <strong>{record.title}</strong>
          <span>{formatSavedAt(record.createdAt)}</span>
        </div>
        <button type="button" className="link-btn account-record-delete" onClick={() => onDelete(record.id)}>
          {copy.delete}
        </button>
      </div>
      <SummaryGrid summary={record.result} copy={copy} />
    </li>
  )
}

export function AccountRecordsPanel({
  copy,
  signedIn,
  activeTab,
  onTabChange,
  loading,
  error,
  notice,
  orderRecords,
  snapshotRecords,
  onRetry,
  onSaveSnapshot,
  onDeleteOrder,
  onDeleteSnapshot,
  snapshotBusy = false,
}: AccountRecordsPanelProps) {
  const isOrders = activeTab === 'orders'

  return (
    <section className="panel account-records-panel" aria-labelledby="account-records-title">
      <div className="account-records-head">
        <div>
          <h2 id="account-records-title">{copy.title}</h2>
          <p>{copy.privacyNote}</p>
        </div>
        {signedIn && activeTab === 'snapshots' && (
          <button
            type="button"
            className="btn btn-primary account-record-save"
            disabled={snapshotBusy || loading}
            onClick={onSaveSnapshot}
          >
            {snapshotBusy ? copy.savingSnapshot : copy.saveSnapshot}
          </button>
        )}
      </div>

      {!signedIn ? (
        <EmptyState>{copy.loginRequired}</EmptyState>
      ) : (
        <>
          <div className="account-record-tabs" role="tablist" aria-label={copy.title}>
            <button
              type="button"
              role="tab"
              aria-selected={isOrders}
              className={`account-record-tab${isOrders ? ' active' : ''}`}
              onClick={() => onTabChange('orders')}
            >
              {copy.orderHistoryTab}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isOrders}
              className={`account-record-tab${!isOrders ? ' active' : ''}`}
              onClick={() => onTabChange('snapshots')}
            >
              {copy.snapshotsTab}
            </button>
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
          ) : isOrders ? (
            orderRecords.length > 0 ? (
              <ul className="account-record-list">
                {orderRecords.map((record) => (
                  <OrderRecordItem
                    key={record.id}
                    record={record}
                    copy={copy}
                    onDelete={onDeleteOrder}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState>{copy.orderHistoryEmpty}</EmptyState>
            )
          ) : snapshotRecords.length > 0 ? (
            <ul className="account-record-list">
              {snapshotRecords.map((record) => (
                <SnapshotRecordItem
                  key={record.id}
                  record={record}
                  copy={copy}
                  onDelete={onDeleteSnapshot}
                />
              ))}
            </ul>
          ) : (
            <EmptyState>{copy.snapshotsEmpty}</EmptyState>
          )}
        </>
      )}
    </section>
  )
}
