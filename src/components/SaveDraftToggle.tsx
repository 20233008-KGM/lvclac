import { usePublicCalculator } from '../context/PublicCalculatorContext'
import { useLanguage } from '../i18n'
import { formatSavedAtCompact } from '../utils/format'

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
    syncStatus,
    syncError,
    hasLocalDraft,
    localDraftSavedAt,
    setSaveEnabled,
    pauseSaving,
  } = usePublicCalculator()

  const statusText =
    syncStatus === 'error'
      ? t.draftSave.statusError
      : localDraftSavedAt
        ? formatSavedAtCompact(localDraftSavedAt)
        : syncStatus === 'saving'
          ? t.draftSave.statusSaving
          : null
  const showSavedCheck = syncStatus === 'saved' && Boolean(localDraftSavedAt) && !syncError

  return (
    <div className="draft-save">
      <div className="draft-save-row">
        <div className="draft-save-slots" role="group" aria-label={t.draftSave.storageModeLabel}>
          <button
            type="button"
            data-save-slot="off"
            className={[
              'draft-save-slot',
              'draft-save-slot--off',
              !saveEnabled ? 'draft-save-slot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={!saveEnabled}
            aria-label={t.draftSave.noSaveMode}
            title={t.draftSave.noSaveMode}
            onClick={pauseSaving}
          >
            <OffIcon />
            <span className="draft-save-slot__sr-label">{t.draftSave.noSaveMode}</span>
          </button>
          <button
            type="button"
            data-save-slot="local"
            className={[
              'draft-save-slot',
              'draft-save-slot--local',
              hasLocalDraft ? 'draft-save-slot--stored' : '',
              saveEnabled ? 'draft-save-slot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-pressed={saveEnabled}
            aria-label={t.draftSave.localMode}
            title={t.draftSave.localMode}
            onClick={() => {
              if (!saveEnabled) void setSaveEnabled(true, 'local')
            }}
          >
            <LocalComputerIcon />
            <span className="draft-save-slot__sr-label">{t.draftSave.localMode}</span>
          </button>
        </div>
        {saveEnabled && statusText && (
          <span className={`draft-save-status draft-save-status--${syncStatus}`}>
            <span className="draft-save-status__check" aria-hidden="true">
              {showSavedCheck ? '✓' : ''}
            </span>
            <span className="draft-save-status__time">{statusText}</span>
          </span>
        )}
      </div>
    </div>
  )
}
