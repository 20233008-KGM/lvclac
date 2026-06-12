import { useState } from 'react'
import { useCalculator } from '../context/CalculatorContext'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'

interface ClearAllInputsButtonProps {
  disabled?: boolean
}

export function ClearAllInputsButton({ disabled = false }: ClearAllInputsButtonProps) {
  const { t } = useLanguage()
  const { resetInputs } = useCalculator()
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
        <div
          className="disclaimer-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmOpen(false)
          }}
        >
          <div
            className="disclaimer-modal draft-save-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-all-inputs-modal-title"
          >
            <h2 id="clear-all-inputs-modal-title" className="disclaimer-modal-title">
              {t.clearAllInputsModalTitle}
            </h2>
            <p className="disclaimer-modal-text">{t.clearAllInputsModalBody}</p>
            <button type="button" className="btn btn-primary draft-save-modal-btn" onClick={handleConfirm}>
              {t.clearAllInputsConfirm}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
