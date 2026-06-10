interface FieldLabelTooltipProps {
  text: string
  label: string
}

export function FieldLabelTooltip({ text, label }: FieldLabelTooltipProps) {
  return (
    <span className="field-label-tooltip-anchor">
      <button
        type="button"
        className="field-label-tooltip-trigger"
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
