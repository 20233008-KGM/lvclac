import { useId, useState, type RefObject } from 'react'
import { GUIDE_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useLanguage } from '../i18n'
import { TooltipBody } from './TooltipBody'
import type { TraderStage } from './welcomeFlowState'

type HowToTab = 'beginner' | 'experienced'

export function HowToUseButton({
  fieldGuideStage = null,
  fieldGuideActive = false,
  onFieldGuideToggle,
}: {
  fieldGuideStage?: TraderStage | null
  fieldGuideActive?: boolean
  onFieldGuideToggle?: () => void
} = {}) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const h = t.howToUse
  const id = useId()
  const tabListId = `${id}-tabs`
  const panelId = `${id}-panel`
  const [tab, setTab] = useState<HowToTab>('beginner')
  const { anchorRef, anchorHandlers, focusWithinHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'bottom',
    focusWithin: true,
  })

  const fieldGuideAvailable = fieldGuideStage !== null && onFieldGuideToggle !== undefined
  const panelBody = tab === 'beginner'
    ? fieldGuideActive && fieldGuideStage
      ? t.fieldHint[fieldGuideStage]
      : h.beginnerBody
    : h.experiencedBody

  return (
    <span
      ref={anchorRef as RefObject<HTMLSpanElement>}
      className="header-how-tooltip-anchor"
      {...anchorHandlers}
      {...focusWithinHandlers}
    >
      <button
        type="button"
        className={`header-how-btn${fieldGuideActive ? ' header-how-btn--guide-active' : ''}`}
        aria-label={
          fieldGuideAvailable
            ? fieldGuideActive
              ? t.fieldHint.disable
              : t.fieldHint.enable
            : h.ariaLabel
        }
        aria-describedby={id}
        aria-pressed={fieldGuideAvailable ? fieldGuideActive : undefined}
        onClick={fieldGuideAvailable ? onFieldGuideToggle : undefined}
      >
        {fieldGuideActive ? t.fieldHint.activeButton : h.button}
      </button>
      {fieldGuideActive && (
        <span className="header-field-guide-callout" role="status">
          <span className="header-field-guide-callout__dot" aria-hidden="true" />
          {t.fieldHint.callout}
        </span>
      )}
      {renderTooltip(
        'header-how-tooltip',
        <>
          <div
            className="header-how-tooltip__tabs"
            role="tablist"
            aria-label={h.ariaLabel}
            id={tabListId}
          >
            <button
              type="button"
              role="tab"
              id={`${id}-tab-beginner`}
              className={`header-how-tooltip__tab${tab === 'beginner' ? ' header-how-tooltip__tab--active' : ''}`}
              aria-selected={tab === 'beginner'}
              aria-controls={panelId}
              onClick={() => setTab('beginner')}
            >
              {h.beginnerTab}
            </button>
            <button
              type="button"
              role="tab"
              id={`${id}-tab-experienced`}
              className={`header-how-tooltip__tab${tab === 'experienced' ? ' header-how-tooltip__tab--active' : ''}`}
              aria-selected={tab === 'experienced'}
              aria-controls={panelId}
              onClick={() => setTab('experienced')}
            >
              {h.experiencedTab}
            </button>
          </div>
          <div
            className="header-how-tooltip__panel"
            role="tabpanel"
            id={panelId}
            aria-labelledby={tab === 'beginner' ? `${id}-tab-beginner` : `${id}-tab-experienced`}
          >
            <TooltipBody text={panelBody} />
          </div>
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
