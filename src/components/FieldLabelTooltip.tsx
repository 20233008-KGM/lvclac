import { useId, type RefObject } from 'react'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { TooltipBody } from './TooltipBody'

interface FieldLabelTooltipProps {
  text: string
  label: string
  highlight?: boolean
}

export function FieldLabelTooltip({ text, label, highlight = false }: FieldLabelTooltipProps) {
  const id = useId()
  const { anchorRef, anchorHandlers, focusWithinHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'top',
    focusWithin: true,
  })

  return (
    <span
      ref={anchorRef as RefObject<HTMLSpanElement>}
      className="field-label-tooltip-anchor"
      {...anchorHandlers}
      {...focusWithinHandlers}
    >
      <button
        type="button"
        className={`field-label-tooltip-trigger${highlight ? ' field-label-tooltip-trigger--glow' : ''}`}
        aria-label={label}
        aria-describedby={id}
        tabIndex={0}
        onMouseDown={(e) => e.preventDefault()}
      >
        ?
      </button>
      {renderTooltip('field-label-tooltip', <TooltipBody text={text} />, { id })}
    </span>
  )
}
