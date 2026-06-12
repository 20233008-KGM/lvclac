import { useId, type RefObject } from 'react'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useLanguage } from '../i18n'
import { TooltipBody } from './TooltipBody'

export function SiteTitleTooltip() {
  const { t } = useLanguage()
  const tip = t.siteTitleTooltip
  const id = useId()
  const { anchorRef, anchorHandlers, focusWithinHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'bottom',
    focusWithin: true,
  })

  return (
    <span
      ref={anchorRef as RefObject<HTMLSpanElement>}
      className="site-title-tooltip-anchor"
      {...anchorHandlers}
      {...focusWithinHandlers}
    >
      <button
        type="button"
        className="site-title-tooltip-trigger"
        aria-label={tip.ariaLabel}
        aria-describedby={id}
      >
        ?
      </button>
      {renderTooltip(
        'site-title-tooltip',
        <>
          <div className="site-title-tooltip__section">
            <strong>{tip.overviewTitle}</strong>
            <TooltipBody text={tip.overviewBody} />
          </div>
          <div className="site-title-tooltip__section">
            <strong>{tip.usageTitle}</strong>
            <TooltipBody text={tip.usageBody} />
          </div>
          <p className="site-title-tooltip__footnote">
            <TooltipBody text={tip.footnote} />
          </p>
        </>,
        { id },
      )}
    </span>
  )
}
