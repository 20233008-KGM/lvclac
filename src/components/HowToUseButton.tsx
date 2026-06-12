import { useId, type RefObject } from 'react'
import { GUIDE_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useLanguage } from '../i18n'
import { TooltipBody } from './TooltipBody'

export function HowToUseButton() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const h = t.howToUse
  const id = useId()
  const { anchorRef, anchorHandlers, focusWithinHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'bottom',
    focusWithin: true,
  })

  return (
    <span
      ref={anchorRef as RefObject<HTMLSpanElement>}
      className="header-how-tooltip-anchor"
      {...anchorHandlers}
      {...focusWithinHandlers}
    >
      <button
        type="button"
        className="header-how-btn"
        aria-label={h.ariaLabel}
        aria-describedby={id}
      >
        {h.button}
      </button>
      {renderTooltip(
        'header-how-tooltip',
        <>
          <div className="header-how-tooltip__section">
            <strong>{h.beginnerTitle}</strong>
            <TooltipBody text={h.beginnerBody} />
          </div>
          <div className="header-how-tooltip__section">
            <strong>{h.experiencedTitle}</strong>
            <TooltipBody text={h.experiencedBody} />
          </div>
          <p className="header-how-tooltip__footnote">
            <TooltipBody text={h.footnote} />
          </p>
          <p className="header-how-tooltip__link-row">
            <a
              className="header-how-tooltip__guide-btn"
              href={GUIDE_PATH}
              onClick={(event) => {
                event.preventDefault()
                navigate(GUIDE_PATH)
              }}
            >
              {h.guideLink}
            </a>
          </p>
        </>,
        { id },
      )}
    </span>
  )
}
