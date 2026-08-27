import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { NumberSetFilter } from '../db/accountRecords'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import type { Locale, Messages } from '../i18n/types'
import type {
  RecordExportFormat,
  RecordExportKind,
  RecordExportLocale,
} from '../lib/accountRecordExport'

type AccountRecordsCopy = Messages['accountRecords']

export interface RecordsExportRequest {
  kind: RecordExportKind
  format: RecordExportFormat
  locale: RecordExportLocale
  numberSetFilter: NumberSetFilter
  startDate: string | null
  endDate: string | null
}

export type RecordsExportResult =
  | { ok: true; filename: string }
  | { ok: false; reason: 'empty' | 'error' }

interface RecordsExportModalProps {
  copy: AccountRecordsCopy
  locale: Locale
  slots: { id: string; title: string }[]
  initialFilter: NumberSetFilter
  initialEndDate: string | null
  onClose: () => void
  onExport: (request: RecordsExportRequest) => Promise<RecordsExportResult>
}

function filterToValue(filter: NumberSetFilter): string {
  if (filter.kind === 'all') return 'all'
  if (filter.kind === 'unassigned') return 'unassigned'
  return `slot:${filter.id}`
}

function valueToFilter(value: string): NumberSetFilter {
  if (value === 'all') return { kind: 'all' }
  if (value === 'unassigned') return { kind: 'unassigned' }
  return { kind: 'slot', id: value.slice('slot:'.length) }
}

function todayInputValue(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function RecordsExportModal({
  copy,
  locale,
  slots,
  initialFilter,
  initialEndDate,
  onClose,
  onExport,
}: RecordsExportModalProps) {
  useModalFocusRestore()
  const titleId = useId()
  const descriptionId = useId()
  const maxDate = useMemo(() => todayInputValue(), [])
  const [kind, setKind] = useState<RecordExportKind>('orders')
  const [filterValue, setFilterValue] = useState(() => filterToValue(initialFilter))
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState(initialEndDate ?? '')
  const [headerLocale, setHeaderLocale] = useState<RecordExportLocale>(locale)
  const [busyFormat, setBusyFormat] = useState<RecordExportFormat | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const busy = busyFormat !== null

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose])

  const runExport = async (format: RecordExportFormat) => {
    if (startDate && endDate && startDate > endDate) {
      setMessage({ type: 'error', text: copy.exportInvalidRange })
      return
    }

    setMessage(null)
    setBusyFormat(format)
    try {
      const result = await onExport({
        kind,
        format,
        locale: headerLocale,
        numberSetFilter: valueToFilter(filterValue),
        startDate: startDate || null,
        endDate: endDate || null,
      })
      if (result.ok) {
        setMessage({
          type: 'success',
          text: copy.exportSuccess.replace('{filename}', result.filename),
        })
      } else {
        setMessage({
          type: 'error',
          text: result.reason === 'empty' ? copy.exportEmpty : copy.exportError,
        })
      }
    } catch {
      setMessage({ type: 'error', text: copy.exportError })
    } finally {
      setBusyFormat(null)
    }
  }

  const modal = (
    <div
      className="disclaimer-overlay records-export-overlay"
      role="presentation"
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="records-export-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={busy}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          aria-label={copy.exportClose}
          disabled={busy}
          onClick={onClose}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>

        <header className="records-export-head">
          <h2 id={titleId}>{copy.exportTitle}</h2>
          <p id={descriptionId}>{copy.exportDescription}</p>
        </header>

        <div className="records-export-form">
          <fieldset className="records-export-fieldset">
            <legend>{copy.exportRecordType}</legend>
            <div className="records-export-segmented">
              <label>
                <input
                  type="radio"
                  name="records-export-kind"
                  value="orders"
                  checked={kind === 'orders'}
                  disabled={busy}
                  onChange={() => setKind('orders')}
                />
                <span>{copy.exportOrders}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="records-export-kind"
                  value="snapshots"
                  checked={kind === 'snapshots'}
                  disabled={busy}
                  onChange={() => setKind('snapshots')}
                />
                <span>{copy.exportSnapshots}</span>
              </label>
            </div>
          </fieldset>

          <label className="records-export-field">
            <span>{copy.exportSlot}</span>
            <select
              autoFocus
              value={filterValue}
              disabled={busy}
              onChange={(event) => setFilterValue(event.target.value)}
            >
              <option value="all">{copy.slotFilterAll}</option>
              <option value="unassigned">{copy.slotFilterUnassigned}</option>
              {slots.map((slot) => (
                <option key={slot.id} value={`slot:${slot.id}`}>
                  {slot.title}
                </option>
              ))}
            </select>
          </label>

          <div className="records-export-date-grid">
            <label className="records-export-field">
              <span>{copy.exportStartDate}</span>
              <input
                type="date"
                max={endDate || maxDate}
                value={startDate}
                disabled={busy}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label className="records-export-field">
              <span>{copy.exportEndDate}</span>
              <input
                type="date"
                min={startDate || undefined}
                max={maxDate}
                value={endDate}
                disabled={busy}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <fieldset className="records-export-fieldset">
            <legend>{copy.exportHeaderLanguage}</legend>
            <div className="records-export-segmented">
              <label>
                <input
                  type="radio"
                  name="records-export-locale"
                  value="ko"
                  checked={headerLocale === 'ko'}
                  disabled={busy}
                  onChange={() => setHeaderLocale('ko')}
                />
                <span>{copy.exportLanguageKo}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="records-export-locale"
                  value="en"
                  checked={headerLocale === 'en'}
                  disabled={busy}
                  onChange={() => setHeaderLocale('en')}
                />
                <span>{copy.exportLanguageEn}</span>
              </label>
            </div>
          </fieldset>
        </div>

        {message && (
          <p
            className={`records-export-message records-export-message--${message.type}`}
            role={message.type === 'error' ? 'alert' : 'status'}
          >
            {message.text}
          </p>
        )}

        <div className="records-export-actions">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void runExport('csv')}
          >
            {busyFormat === 'csv' ? copy.exportPreparing : copy.exportCsv}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void runExport('xlsx')}
          >
            {busyFormat === 'xlsx' ? copy.exportPreparing : copy.exportXlsx}
          </button>
        </div>
      </section>
    </div>
  )

  return createPortal(modal, document.body)
}

export default RecordsExportModal
