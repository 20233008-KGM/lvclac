import { useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/auth-dialog.css'

interface SnapshotSavedModalProps {
  onClose: () => void
  onGoToRecords: () => void
  onAddMemo: () => void
  /** 포커스 복원 대상 ref. 트리거 버튼이 비동기 저장 중 disabled로 바뀌어
   * document.activeElement가 유실될 수 있어 명시적으로 전달받는다. */
  restoreFocusRef?: RefObject<HTMLElement | null>
  copy: {
    eyebrow: string
    title: string
    body: string
    goToRecords: string
    addMemo: string
    close: string
  }
}

export function SnapshotSavedModal({
  onClose,
  onGoToRecords,
  onAddMemo,
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
      className="disclaimer-overlay snap-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal snap-modal snap-modal--saved"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-saved-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close snap-modal__close"
          onClick={onClose}
          aria-label={copy.close}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <span className="snap-emblem snap-emblem--success" aria-hidden="true">
          <span className="snap-emblem__disc" />
          <span className="snap-emblem__glow" />
          <span className="snap-emblem__halo" />
          <svg className="snap-emblem__mark" viewBox="0 0 60 60">
            <circle className="snap-emblem__ring" cx="30" cy="30" r="28" />
            <path className="snap-emblem__check" d="M18 31 L26.5 39 L43 21" />
          </svg>
        </span>
        <p className="snap-eyebrow">{copy.eyebrow}</p>
        <h2 id="snapshot-saved-modal-title" className="snap-title">
          {copy.title}
        </h2>
        <p className="snap-body">{copy.body}</p>
        <div className="snapshot-saved-modal__actions">
          <button type="button" className="btn btn-ghost" onClick={onAddMemo}>
            {copy.addMemo}
          </button>
          <button type="button" className="btn btn-primary snap-primary" onClick={onGoToRecords}>
            {copy.goToRecords}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
