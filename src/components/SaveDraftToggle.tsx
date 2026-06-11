import { useState, type ReactNode } from 'react'
import { useCalculator } from '../context/CalculatorContext'
import { useLanguage } from '../i18n'

const SKIP_ENABLE_MODAL_KEY = 'leverage_save_enable_modal_skip'

type ModalKind = 'enable' | 'enable-info' | 'cleared' | null

function readSkipEnableModal(): boolean {
  try {
    return localStorage.getItem(SKIP_ENABLE_MODAL_KEY) === '1'
  } catch {
    return false
  }
}

function setSkipEnableModal(skip: boolean): void {
  try {
    if (skip) localStorage.setItem(SKIP_ENABLE_MODAL_KEY, '1')
    else localStorage.removeItem(SKIP_ENABLE_MODAL_KEY)
  } catch {
    // ignore
  }
}

function DraftSaveModal({
  title,
  children,
  confirmLabel,
  onConfirm,
  onDismiss,
  footer,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onDismiss?: () => void
  footer?: ReactNode
}) {
  const dismiss = onDismiss ?? onConfirm

  return (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        className="disclaimer-modal draft-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-save-modal-title"
      >
        <h2 id="draft-save-modal-title" className="disclaimer-modal-title">
          {title}
        </h2>
        {children}
        <button type="button" className="btn btn-primary draft-save-modal-btn" onClick={onConfirm}>
          {confirmLabel}
        </button>
        {footer && <div className="draft-save-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

function EnableModalBody({ lines }: { lines: string[] }) {
  return (
    <div className="draft-save-modal-body">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

export function SaveDraftToggle() {
  const { t } = useLanguage()
  const { saveEnabled, setSaveEnabled } = useCalculator()
  const [modal, setModal] = useState<ModalKind>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [skipActive, setSkipActive] = useState(readSkipEnableModal)

  const openEnableModal = () => {
    setDontShowAgain(false)
    setModal('enable')
  }

  const handleChange = (next: boolean) => {
    if (next) {
      if (readSkipEnableModal()) {
        setSaveEnabled(true)
        return
      }
      openEnableModal()
      return
    }
    setSaveEnabled(false)
    setModal('cleared')
  }

  const confirmEnable = () => {
    if (dontShowAgain) {
      setSkipEnableModal(true)
      setSkipActive(true)
    }
    setSaveEnabled(true)
    setModal(null)
  }

  const cancelEnable = () => setModal(null)

  const dismissCleared = () => setModal(null)

  const showGuideAgain = () => {
    setSkipEnableModal(false)
    setSkipActive(false)
    setModal('enable-info')
  }

  return (
    <>
      <div className="draft-save">
        <label className="input-option-toggle draft-save-tooltip-anchor">
          <input
            type="checkbox"
            checked={saveEnabled}
            onChange={(e) => handleChange(e.target.checked)}
          />
          <span className="input-option-toggle__label">{t.draftSave.label}</span>
          <span className="draft-save-tooltip" role="tooltip">
            {t.draftSave.hint}
          </span>
        </label>
        {skipActive && (
          <button type="button" className="link-btn draft-save-show-guide" onClick={showGuideAgain}>
            {t.draftSave.showGuideAgain}
          </button>
        )}
      </div>

      {modal === 'enable' && (
        <DraftSaveModal
          title={t.draftSave.enableModalTitle}
          confirmLabel={t.draftSave.enableConfirm}
          onConfirm={confirmEnable}
          onDismiss={cancelEnable}
          footer={
            <label className="draft-save-skip">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span>{t.draftSave.skipModalLabel}</span>
            </label>
          }
        >
          <EnableModalBody lines={t.draftSave.enableModalBody} />
        </DraftSaveModal>
      )}

      {modal === 'enable-info' && (
        <DraftSaveModal
          title={t.draftSave.enableModalTitle}
          confirmLabel={t.draftSave.confirm}
          onConfirm={() => setModal(null)}
          onDismiss={() => setModal(null)}
        >
          <EnableModalBody lines={t.draftSave.enableModalBody} />
        </DraftSaveModal>
      )}

      {modal === 'cleared' && (
        <DraftSaveModal
          title={t.draftSave.clearedModalTitle}
          confirmLabel={t.draftSave.confirm}
          onConfirm={dismissCleared}
        >
          <p className="disclaimer-modal-text">{t.draftSave.cleared}</p>
        </DraftSaveModal>
      )}
    </>
  )
}
