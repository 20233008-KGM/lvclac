import { useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/auth-dialog.css'

interface SnapshotSavedModalProps {
  onClose: () => void
  onGoToRecords: () => void
  /** 포커스 복원 대상 ref. 트리거 버튼이 비동기 저장 중 disabled로 바뀌어
   * document.activeElement가 유실될 수 있어 명시적으로 전달받는다. */
  restoreFocusRef?: RefObject<HTMLElement | null>
  copy: {
    title: string
    body: string
    goToRecords: string
    close: string
  }
}

export function SnapshotSavedModal({
  onClose,
  onGoToRecords,
  restoreFocusRef,
  copy,
}: SnapshotSavedModalProps) {
  useModalFocusRestore(restoreFocusRef)

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
        aria-labelledby="snapshot-saved-modal-title"
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
        <h2 id="snapshot-saved-modal-title" className="disclaimer-modal-title">
          {copy.title}
        </h2>
        <p className="disclaimer-modal-text">{copy.body}</p>
        <button type="button" className="btn btn-primary" onClick={onGoToRecords}>
          {copy.goToRecords}
        </button>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
