import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePublicCalculator } from '../context/PublicCalculatorContext'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'

interface ClearAllInputsButtonProps {
  disabled?: boolean
}

function ClearAllInputsModal({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal draft-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-all-inputs-modal-title"
      >
        <h2 id="clear-all-inputs-modal-title" className="disclaimer-modal-title">
          {title}
        </h2>
        <p className="disclaimer-modal-text">{body}</p>
        <button type="button" className="btn btn-primary draft-save-modal-btn" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export function ClearAllInputsButton({ disabled = false }: ClearAllInputsButtonProps) {
  const { t } = useLanguage()
  const { resetInputs } = usePublicCalculator()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleConfirm() {
    resetInputs()
    setConfirmOpen(false)
  }

  return (
    <>
      <div className="input-panel__clear-actions">
        <FieldLabelTooltip text={t.clearAllInputsHint} label={t.clearAllInputsHintLabel} />
        <button
          type="button"
          className="input-panel__clear-btn"
          disabled={disabled}
          onClick={() => setConfirmOpen(true)}
        >
          {t.clearAllInputs}
        </button>
      </div>

      {confirmOpen && (
        <ClearAllInputsModal
          title={t.clearAllInputsModalTitle}
          body={t.clearAllInputsModalBody}
          confirmLabel={t.clearAllInputsConfirm}
          onConfirm={handleConfirm}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </>
  )
}
