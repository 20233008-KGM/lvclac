import { useState, type ReactNode, type RefObject } from 'react'
import { useCalculator, type SaveStorageMode } from '../context/CalculatorContext'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useLanguage } from '../i18n'
import { TooltipBody } from './TooltipBody'

const SKIP_ENABLE_MODAL_KEY = 'leverage_save_enable_modal_skip'

type ModalKind = 'enable' | 'enable-info' | 'cleared' | null

function skipEnableModalKey(mode: SaveStorageMode): string {
  return `${SKIP_ENABLE_MODAL_KEY}_${mode}`
}

function readSkipEnableModal(mode: SaveStorageMode): boolean {
  try {
    return localStorage.getItem(skipEnableModalKey(mode)) === '1'
  } catch {
    return false
  }
}

function setSkipEnableModal(mode: SaveStorageMode, skip: boolean): void {
  try {
    const key = skipEnableModalKey(mode)
    if (skip) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
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
  const {
    saveEnabled,
    storageMode,
    cloudAvailable,
    syncStatus,
    canMigrateLocalDraft,
    setSaveEnabled,
    setStorageMode,
    migrateLocalDraftToCloud,
  } = useCalculator()
  const [modal, setModal] = useState<ModalKind>(null)
  const [pendingMode, setPendingMode] = useState<SaveStorageMode | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [, refreshSkipState] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const isCloud = storageMode === 'cloud'
  const modalMode = pendingMode ?? storageMode
  const modalIsCloud = modalMode === 'cloud'
  const skipActive = readSkipEnableModal(storageMode)
  const label = isCloud ? t.draftSave.cloudLabel : t.draftSave.label
  const hint = isCloud ? t.draftSave.cloudHint : t.draftSave.hint
  const enableTitle = modalIsCloud
    ? t.draftSave.cloudEnableModalTitle
    : t.draftSave.enableModalTitle
  const enableBody = modalIsCloud
    ? t.draftSave.cloudEnableModalBody
    : t.draftSave.enableModalBody

  const statusText =
    syncStatus === 'loading'
      ? t.draftSave.statusLoading
      : syncStatus === 'saving'
        ? t.draftSave.statusSaving
        : syncStatus === 'saved'
          ? isCloud
            ? t.draftSave.statusSavedCloud
            : t.draftSave.statusSavedLocal
          : syncStatus === 'error'
            ? t.draftSave.statusError
            : null

  const openEnableModal = (mode: SaveStorageMode = storageMode) => {
    setPendingMode(mode === storageMode ? null : mode)
    setDontShowAgain(false)
    setModal('enable')
  }

  const applySaveEnabled = async (next: boolean) => {
    setBusy(true)
    setNotice(null)
    const error = await setSaveEnabled(next)
    if (error) setNotice(t.draftSave.statusError)
    setBusy(false)
    return error
  }

  const handleChange = (next: boolean) => {
    if (next) {
      if (readSkipEnableModal(storageMode)) {
        void applySaveEnabled(true)
        return
      }
      openEnableModal(storageMode)
      return
    }
    void applySaveEnabled(false).then((error) => {
      if (!error) setModal('cleared')
    })
  }

  const handleModeChange = (mode: SaveStorageMode) => {
    if (mode === storageMode) return
    setNotice(null)
    if (saveEnabled && !readSkipEnableModal(mode)) {
      openEnableModal(mode)
      return
    }
    setStorageMode(mode)
  }

  const confirmEnable = () => {
    const consentMode = pendingMode ?? storageMode
    if (dontShowAgain) {
      setSkipEnableModal(consentMode, true)
      refreshSkipState((value) => value + 1)
    }
    if (pendingMode) {
      setStorageMode(pendingMode)
      setPendingMode(null)
      setModal(null)
      return
    }
    void applySaveEnabled(true).then((error) => {
      if (!error) setModal(null)
    })
  }

  const cancelEnable = () => {
    setPendingMode(null)
    setModal(null)
  }

  const dismissCleared = () => setModal(null)

  const { anchorRef, anchorHandlers, renderTooltip } = useFloatingTooltip({ placement: 'top' })

  const showGuideAgain = () => {
    setSkipEnableModal(storageMode, false)
    refreshSkipState((value) => value + 1)
    setModal('enable-info')
  }

  const handleMigrate = () => {
    setBusy(true)
    setNotice(null)
    void migrateLocalDraftToCloud().then((error) => {
      setNotice(error ? t.draftSave.migrateError : t.draftSave.migrateSuccess)
      setBusy(false)
    })
  }

  return (
    <>
      <div className="draft-save">
        <label
          ref={anchorRef as RefObject<HTMLLabelElement>}
          className="input-option-toggle draft-save-tooltip-anchor"
          {...anchorHandlers}
        >
          <input
            type="checkbox"
            checked={saveEnabled}
            disabled={busy || syncStatus === 'loading'}
            onChange={(e) => handleChange(e.target.checked)}
          />
          <span className="input-option-toggle__label">{label}</span>
          {renderTooltip('draft-save-tooltip', <TooltipBody text={hint} />)}
        </label>
        {cloudAvailable && (
          <div className="draft-save-mode" role="group" aria-label={t.draftSave.storageModeLabel}>
            {(['local', 'cloud'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`draft-save-mode__btn${storageMode === mode ? ' active' : ''}`}
                aria-pressed={storageMode === mode}
                disabled={busy || syncStatus === 'loading'}
                onClick={() => handleModeChange(mode)}
              >
                {mode === 'local' ? t.draftSave.localMode : t.draftSave.cloudMode}
              </button>
            ))}
          </div>
        )}
        {saveEnabled && statusText && (
          <span className={`draft-save-status draft-save-status--${syncStatus}`}>
            {statusText}
          </span>
        )}
        {canMigrateLocalDraft && (
          <button
            type="button"
            className="link-btn draft-save-migrate"
            disabled={busy}
            onClick={handleMigrate}
          >
            {t.draftSave.migrateLocalToCloud}
          </button>
        )}
        {notice && (
          <span
            className={`draft-save-notice${
              syncStatus === 'error' ? ' draft-save-notice--error' : ''
            }`}
          >
            {notice}
          </span>
        )}
        {skipActive && (
          <button type="button" className="link-btn draft-save-show-guide" onClick={showGuideAgain}>
            {t.draftSave.showGuideAgain}
          </button>
        )}
      </div>

      {modal === 'enable' && (
        <DraftSaveModal
          title={enableTitle}
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
          <EnableModalBody lines={enableBody} />
        </DraftSaveModal>
      )}

      {modal === 'enable-info' && (
        <DraftSaveModal
          title={enableTitle}
          confirmLabel={t.draftSave.confirm}
          onConfirm={() => setModal(null)}
          onDismiss={() => setModal(null)}
        >
          <EnableModalBody lines={enableBody} />
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
