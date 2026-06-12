import type { ReactNode } from 'react'

export function EnterCommitIcon() {
  return (
    <span className="input-commit-btn__glyph" aria-hidden>
      ↵
    </span>
  )
}

export function ApplyPnlIcon() {
  return (
    <span className="input-commit-btn__glyph input-commit-btn__glyph--pnl" aria-hidden>
      ✓
    </span>
  )
}

export function ScenarioPriceCommitButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="input-commit-btn"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <EnterCommitIcon />
    </button>
  )
}

export function ScenarioPriceApplyButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="input-commit-btn input-commit-btn--apply-pnl"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <ApplyPnlIcon />
    </button>
  )
}

export function CommitButtonSlot({
  previewActive,
  commitButton,
  applyButton,
}: {
  previewActive: boolean
  commitButton: ReactNode
  applyButton: ReactNode
}) {
  return (
    <span className="input-commit-btn-slot">
      <span
        className={
          previewActive
            ? 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden'
            : 'input-commit-btn-slot__layer'
        }
        aria-hidden={previewActive}
      >
        {commitButton}
      </span>
      <span
        className={
          previewActive
            ? 'input-commit-btn-slot__layer'
            : 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden'
        }
        aria-hidden={!previewActive}
      >
        {applyButton}
      </span>
    </span>
  )
}
