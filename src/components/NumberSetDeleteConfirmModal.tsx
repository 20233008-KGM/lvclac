import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { SaveStorageMode } from '../context/CalculatorContext'
import type { NumberSetDeletionSummary } from '../db/numberSets'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/auth-dialog.css'

export type NumberSetDeleteSummaryState =
  | { status: 'loading'; summary: null }
  | { status: 'error'; summary: null }
  | { status: 'ready'; summary: NumberSetDeletionSummary | null }

interface NumberSetDeleteConfirmModalProps {
  mode: SaveStorageMode
  setTitle: string
  summaryState: NumberSetDeleteSummaryState
  busy: boolean
  copy: {
    title: string
    cloudBody: string
    localBody: string
    orderCount: string
    snapshotCount: string
    memoCount: string
    warning: string
    summaryLoading: string
    summaryError: string
    retry: string
    cancel: string
    confirm: string
    confirmBusy: string
  }
  onClose: () => void
  onConfirm: () => void
  onRetry: () => void
}

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function NumberSetDeleteConfirmModal({
  mode,
  setTitle,
  summaryState,
  busy,
  copy,
  onClose,
  onConfirm,
  onRetry,
}: NumberSetDeleteConfirmModalProps) {
  useModalFocusRestore()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cloudReady = mode === 'cloud' && summaryState.status === 'ready' && summaryState.summary
  const confirmDisabled = busy || (mode === 'cloud' && !cloudReady)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const activeDialog = dialog
    activeDialog.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (!busy) onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(activeDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        event.preventDefault()
        activeDialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [busy, onClose, summaryState.status])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="disclaimer-modal snapshot-saved-modal number-set-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="number-set-delete-title"
        aria-describedby="number-set-delete-body number-set-delete-warning"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="number-set-delete-title" className="disclaimer-modal-title">
          {copy.title.replace('{name}', setTitle)}
        </h2>
        <p id="number-set-delete-body" className="disclaimer-modal-text">
          {mode === 'cloud' ? copy.cloudBody : copy.localBody}
        </p>

        {mode === 'cloud' && summaryState.status === 'loading' && (
          <p className="number-set-delete-modal__status" role="status">
            {copy.summaryLoading}
          </p>
        )}

        {mode === 'cloud' && summaryState.status === 'error' && (
          <div className="number-set-delete-modal__error" role="alert">
            <p>{copy.summaryError}</p>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={onRetry}>
              {copy.retry}
            </button>
          </div>
        )}

        {cloudReady && (
          <ul className="number-set-delete-modal__summary">
            <li>{copy.orderCount.replace('{count}', String(cloudReady.orderHistoryCount))}</li>
            <li>{copy.snapshotCount.replace('{count}', String(cloudReady.accountSnapshotCount))}</li>
            <li>{copy.memoCount.replace('{count}', String(cloudReady.memoCount))}</li>
          </ul>
        )}

        <p id="number-set-delete-warning" className="number-set-delete-modal__warning">
          {copy.warning}
        </p>
        <div className="bulk-delete-confirm-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {copy.cancel}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {busy ? copy.confirmBusy : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export default NumberSetDeleteConfirmModal
