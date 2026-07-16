import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePublicCalculator } from '../context/PublicCalculatorContext'
import { useLanguage } from '../i18n'
import { formatSavedAtCompact } from '../utils/format'

function LocalComputerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 19.5h8M12 15.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function SaveDraftToggle() {
  const { t } = useLanguage()
  const {
    saveEnabled,
    syncStatus,
    syncError,
    hasLocalDraft,
    localDraftSavedAt,
    setSaveEnabled,
    pauseSaving,
    deleteSavedData,
  } = usePublicCalculator()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    if (!deleteConfirmOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [deleteConfirmOpen])

  const statusText =
    syncStatus === 'saving'
      ? t.draftSave.statusSaving
      : syncStatus === 'error'
        ? t.draftSave.statusError
        : localDraftSavedAt
          ? formatSavedAtCompact(localDraftSavedAt)
          : null

  async function toggleSaving() {
    if (saveEnabled) {
      pauseSaving()
      return
    }
    await setSaveEnabled(true, 'local')
  }

  async function confirmDelete() {
    await deleteSavedData()
    setDeleteConfirmOpen(false)
  }

  const modal = deleteConfirmOpen ? (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) setDeleteConfirmOpen(false)
      }}
    >
      <div
        className="disclaimer-modal draft-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-draft-delete-title"
      >
        <h2 id="public-draft-delete-title" className="disclaimer-modal-title">
          {t.draftSave.deleteConfirmTitle}
        </h2>
        <p className="disclaimer-modal-text">{t.draftSave.deleteConfirmBody}</p>
        <div className="account-setting-guard-actions">
          <button
            type="button"
            className="btn btn-ghost draft-save-modal-btn"
            onClick={() => setDeleteConfirmOpen(false)}
          >
            {t.draftSave.deleteCancel}
          </button>
          <button
            type="button"
            className="btn btn-primary draft-save-modal-btn"
            onClick={() => void confirmDelete()}
          >
            {t.draftSave.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="draft-save">
        <div className="draft-save-main">
          <span className="draft-save-label">{t.draftSave.label}</span>
          <div className="draft-save-slots" role="group" aria-label={t.draftSave.storageModeLabel}>
            <button
              type="button"
              className={[
                'draft-save-slot',
                'draft-save-slot--local',
                hasLocalDraft ? 'draft-save-slot--stored' : '',
                saveEnabled ? 'draft-save-slot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-pressed={saveEnabled}
              aria-label={saveEnabled ? t.draftSave.noSaveMode : t.draftSave.localMode}
              title={saveEnabled ? t.draftSave.offHint : t.draftSave.hint}
              onClick={() => void toggleSaving()}
            >
              <LocalComputerIcon />
              <span className="draft-save-slot__sr-label">{t.draftSave.localMode}</span>
            </button>
            {hasLocalDraft && (
              <button
                type="button"
                className="link-btn draft-save-delete"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                {t.draftSave.deleteConfirm}
              </button>
            )}
          </div>
          {statusText && (
            <span className={`draft-save-status draft-save-status--${syncStatus}`}>
              <span className="draft-save-status__check" aria-hidden="true">
                {syncStatus === 'saved' && !syncError ? '✓' : ''}
              </span>
              <span className="draft-save-status__time">{statusText}</span>
            </span>
          )}
        </div>
      </div>
      {modal && createPortal(modal, document.body)}
    </>
  )
}
