import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { TotalMarginKind } from '../types'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/margin-kind-modal.css'

interface MarginKindAskModalProps {
  copy: {
    title: string
    body: string
    question: string
    proportional: string
    proportionalHint: string
    fixed: string
    fixedHint: string
    skipLabel: string
  }
  dontShowAgain: boolean
  onDontShowAgainChange: (value: boolean) => void
  onSelect: (kind: TotalMarginKind) => void
  onClose: () => void
}

/**
 * 총액 모드 주문 시뮬(미리보기 진입) 시 뜨는 안내 모달.
 * "증거금을 역산했다"고 알리고, 이 증거금이 가격 비례인지 계약당 고정인지 확인한다.
 * 기본(강조)은 가격 비례. 닫기/ESC는 기본 유지로 간주.
 */
export function MarginKindAskModal({
  copy,
  dontShowAgain,
  onDontShowAgainChange,
  onSelect,
  onClose,
}: MarginKindAskModalProps) {
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
        className="disclaimer-modal margin-kind-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="margin-kind-ask-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="margin-kind-ask-title" className="disclaimer-modal-title">
          {copy.title}
        </h2>
        <p className="disclaimer-modal-text">{copy.body}</p>
        <p className="margin-kind-ask-question">{copy.question}</p>
        <div className="margin-kind-options">
          <button
            type="button"
            className="margin-kind-option margin-kind-option--primary"
            onClick={() => onSelect('proportional')}
          >
            <span className="margin-kind-option__label">{copy.proportional}</span>
            <span className="margin-kind-option__hint">{copy.proportionalHint}</span>
          </button>
          <button
            type="button"
            className="margin-kind-option"
            onClick={() => onSelect('fixed')}
          >
            <span className="margin-kind-option__label">{copy.fixed}</span>
            <span className="margin-kind-option__hint">{copy.fixedHint}</span>
          </button>
        </div>
        <div className="draft-save-modal-footer">
          <label className="draft-save-skip">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => onDontShowAgainChange(e.target.checked)}
            />
            <span>{copy.skipLabel}</span>
          </label>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
