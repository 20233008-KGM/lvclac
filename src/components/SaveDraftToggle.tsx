import { useEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useCalculator, type SaveStorageMode } from '../context/CalculatorContext'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useLanguage } from '../i18n'
import { TooltipBody } from './TooltipBody'

const SKIP_ENABLE_MODAL_KEY = 'leverage_save_enable_modal_skip'

type ModalKind = 'enable' | 'enable-info' | 'delete-confirm' | null

type SaveSlot = 'off' | SaveStorageMode

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

  return createPortal(modal, document.body)
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

function LocalComputerIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect className="draft-save-slot__fill" x="7.4" y="6.2" width="13.2" height="10.8" rx="1.4" />
      <rect x="6.1" y="4.9" width="15.8" height="13.4" rx="1.9" fill="none" />
      <line x1="10.4" y1="22.1" x2="17.6" y2="22.1" />
      <line x1="14" y1="18.4" x2="14" y2="22.1" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path
        className="draft-save-slot__fill"
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
      />
      <path
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
        fill="none"
      />
    </svg>
  )
}

function OffIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="8.4" fill="none" />
      <line x1="8.1" y1="8.1" x2="19.9" y2="19.9" />
    </svg>
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
    hasLocalDraft,
    hasCloudDraft,
    setSaveEnabled,
    pauseSaving,
    deleteSavedData,
    setStorageMode,
    migrateLocalDraftToCloud,
  } = useCalculator()
  const [modal, setModal] = useState<ModalKind>(null)
  const [pendingMode, setPendingMode] = useState<SaveStorageMode | null>(null)
  const [pendingDeleteMode, setPendingDeleteMode] = useState<SaveStorageMode | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [, refreshSkipState] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const isCloud = storageMode === 'cloud'
  const modalMode = pendingMode ?? storageMode
  const modalIsCloud = modalMode === 'cloud'
  const skipActive = readSkipEnableModal(storageMode)
  const hint = !saveEnabled
    ? t.draftSave.offHint
    : isCloud
      ? t.draftSave.cloudHint
      : t.draftSave.hint
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
        : syncStatus === 'error'
          ? t.draftSave.statusError
          : null

  const openEnableModal = (mode: SaveStorageMode = storageMode) => {
    setPendingMode(mode === storageMode ? null : mode)
    setDontShowAgain(false)
    setModal('enable')
  }

  const applySaveEnabled = async (next: boolean, mode: SaveStorageMode = storageMode) => {
    setBusy(true)
    setNotice(null)
    const error = await setSaveEnabled(next, mode)
    if (error) setNotice(t.draftSave.statusError)
    setBusy(false)
    return error
  }

  const storedForMode = (mode: SaveStorageMode) => (mode === 'local' ? hasLocalDraft : hasCloudDraft)

  const handleModeChange = (mode: SaveStorageMode) => {
    if (mode === storageMode) return
    setNotice(null)
    if (storedForMode(mode)) {
      setStorageMode(mode)
      return
    }
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
      const targetMode = pendingMode
      setStorageMode(targetMode)
      setPendingMode(null)
      if (!saveEnabled) {
        void applySaveEnabled(true, targetMode).then((error) => {
          if (!error) setModal(null)
        })
        return
      }
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

  const confirmDelete = () => {
    const mode = pendingDeleteMode
    if (!mode) return
    setBusy(true)
    setNotice(null)
    void deleteSavedData(mode).then((error) => {
      setBusy(false)
      setPendingDeleteMode(null)
      if (error) setNotice(t.draftSave.statusError)
      else setModal(null)
    })
  }

  const cancelDelete = () => {
    setPendingDeleteMode(null)
    setModal(null)
  }

  const { anchorRef, anchorHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'top',
    horizontalAlign: 'right',
  })

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

  const handleSlotClick = (slot: SaveSlot) => {
    if (busy || syncStatus === 'loading') return
    setNotice(null)

    if (slot === 'off') {
      if (!saveEnabled) return
      pauseSaving()
      return
    }

    const mode = slot

    if (saveEnabled && storageMode === mode) {
      // 이미 활성인 저장 슬롯을 다시 누르면 저장값 삭제 여부를 묻는다.
      if (!storedForMode(mode)) return
      setPendingDeleteMode(mode)
      setModal('delete-confirm')
      return
    }

    if (!saveEnabled) {
      if (mode !== storageMode) {
        setStorageMode(mode)
      }
      if (storedForMode(mode)) {
        void applySaveEnabled(true, mode)
        return
      }
      if (!storedForMode(mode) && !readSkipEnableModal(mode)) {
        openEnableModal(mode)
        return
      }
      if (readSkipEnableModal(mode)) {
        void applySaveEnabled(true, mode)
        return
      }
      return
    }

    handleModeChange(mode)
  }

  const slots: SaveSlot[] = cloudAvailable ? ['off', 'local', 'cloud'] : ['off', 'local']

  return (
    <>
      <div className="draft-save">
        <div
          ref={anchorRef as RefObject<HTMLDivElement>}
          className="draft-save-slots draft-save-tooltip-anchor"
          role="group"
          aria-label={t.draftSave.storageModeLabel}
          {...anchorHandlers}
        >
          {slots.map((slot) => {
            if (slot === 'off') {
              const active = !saveEnabled
              const className = [
                'draft-save-slot',
                'draft-save-slot--off',
                active ? 'draft-save-slot--active' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key="off"
                  type="button"
                  className={className}
                  aria-pressed={active}
                  aria-label={t.draftSave.noSaveMode}
                  title={t.draftSave.noSaveMode}
                  disabled={busy || syncStatus === 'loading'}
                  onClick={() => handleSlotClick('off')}
                >
                  <OffIcon />
                  <span className="draft-save-slot__sr-label">{t.draftSave.noSaveMode}</span>
                </button>
              )
            }

            const mode = slot
            const stored = mode === 'local' ? hasLocalDraft : hasCloudDraft
            const active = saveEnabled && storageMode === mode
            const modeLabel = mode === 'local' ? t.draftSave.localMode : t.draftSave.cloudMode
            const modeClass =
              mode === 'local' ? 'draft-save-slot--local' : 'draft-save-slot--cloud'
            const className = [
              'draft-save-slot',
              modeClass,
              stored ? 'draft-save-slot--stored' : '',
              active ? 'draft-save-slot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={mode}
                type="button"
                className={className}
                aria-pressed={active}
                aria-label={modeLabel}
                title={modeLabel}
                disabled={busy || syncStatus === 'loading'}
                onClick={() => handleSlotClick(mode)}
              >
                {mode === 'local' ? <LocalComputerIcon /> : <CloudIcon />}
                <span className="draft-save-slot__sr-label">{modeLabel}</span>
              </button>
            )
          })}
          {renderTooltip('draft-save-tooltip', <TooltipBody text={hint} />)}
        </div>
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

      {modal === 'delete-confirm' && (
        <DraftSaveModal
          title={t.draftSave.deleteConfirmTitle}
          confirmLabel={t.draftSave.deleteConfirm}
          onConfirm={confirmDelete}
          onDismiss={cancelDelete}
          footer={
            <button type="button" className="link-btn draft-save-delete-cancel" onClick={cancelDelete}>
              {t.draftSave.deleteCancel}
            </button>
          }
        >
          <p className="disclaimer-modal-text draft-save-delete-text">
            {pendingDeleteMode === 'cloud'
              ? t.draftSave.cloudDeleteConfirmBody
              : t.draftSave.deleteConfirmBody}
          </p>
        </DraftSaveModal>
      )}
    </>
  )
}
