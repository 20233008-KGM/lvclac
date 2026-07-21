import { useCalculator, type SaveStorageMode } from '../context/CalculatorContext'
import { useLanguage } from '../i18n'
import { isUserNamedNumberSetTitle } from './activeNumberSetTitle'

function StorageIcon({ mode }: { mode: SaveStorageMode }) {
  return mode === 'cloud' ? (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.25 12.25h7.1a3.15 3.15 0 0 0 .25-6.28A4 4 0 0 0 3.95 7.15a2.65 2.65 0 0 0 .3 5.1Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2.75" y="2.5" width="10.5" height="8.25" rx="1.25" />
      <path d="M5.25 13.5h5.5M8 10.75v2.75" />
    </svg>
  )
}

export function ActiveNumberSetLabel() {
  const { t } = useLanguage()
  const {
    saveEnabled,
    storageMode,
    numberSets,
    activeNumberSetId,
  } = useCalculator()

  if (!saveEnabled || !activeNumberSetId) return null

  const activeNumberSet = numberSets.find(
    (numberSet) => numberSet.id === activeNumberSetId && numberSet.storageMode === storageMode,
  )
  if (!activeNumberSet || !isUserNamedNumberSetTitle(activeNumberSet.title)) return null

  const storageLabel = storageMode === 'local'
    ? t.draftSave.localMode
    : t.draftSave.cloudMode
  const accessibleLabel = `${activeNumberSet.title} · ${storageLabel}`

  return (
    <span
      className="active-number-set-label"
      title={accessibleLabel}
      aria-label={accessibleLabel}
    >
      <span className="active-number-set-label__name">{activeNumberSet.title}</span>
      <span className="active-number-set-label__storage" aria-hidden="true">
        <StorageIcon mode={storageMode} />
      </span>
    </span>
  )
}
