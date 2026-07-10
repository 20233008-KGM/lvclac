import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/auth-dialog.css'

interface BulkDeleteConfirmModalProps {
  onClose: () => void
  onConfirm: () => void
  busy?: boolean
  copy: {
    title: string
    body: string
    confirm: string
    confirmBusy: string
    cancel: string
    close: string
  }
}

export function BulkDeleteConfirmModal({
  onClose,
  onConfirm,
  busy = false,
  copy,
}: BulkDeleteConfirmModalProps) {
  useModalFocusRestore()

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal snapshot-saved-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-delete-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={copy.close}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <h2 id="bulk-delete-confirm-title" className="disclaimer-modal-title">
          {copy.title}
        </h2>
        <p className="disclaimer-modal-text">{copy.body}</p>
        <div className="bulk-delete-confirm-actions">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>
            {copy.cancel}
          </button>
          <button type="button" className="btn btn-danger" disabled={busy} onClick={onConfirm}>
            {busy ? copy.confirmBusy : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
