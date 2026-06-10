interface FieldLabelTooltipProps {
  text: string
  label: string
  highlight?: boolean
}

export function FieldLabelTooltip({ text, label, highlight = false }: FieldLabelTooltipProps) {
  return (
    <span className="field-label-tooltip-anchor">
      <button
        type="button"
        className={`field-label-tooltip-trigger${highlight ? ' field-label-tooltip-trigger--glow' : ''}`}
        aria-label={label}
        tabIndex={0}
        onMouseDown={(e) => e.preventDefault()}
      >
        ?
      </button>
      <span className="field-label-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  )
}
