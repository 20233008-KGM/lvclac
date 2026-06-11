import { useLanguage } from '../i18n'

export function SiteTitleTooltip() {
  const { t } = useLanguage()
  const tip = t.siteTitleTooltip

  return (
    <span className="site-title-tooltip-anchor">
      <button
        type="button"
        className="site-title-tooltip-trigger"
        aria-label={tip.ariaLabel}
        aria-describedby="site-title-tooltip"
      >
        ?
      </button>
      <span id="site-title-tooltip" className="site-title-tooltip" role="tooltip">
        <p className="site-title-tooltip__section">
          <strong>{tip.overviewTitle}</strong>
          {tip.overviewBody}
        </p>
        <p className="site-title-tooltip__section">
          <strong>{tip.usageTitle}</strong>
          {tip.usageBody}
        </p>
        <p className="site-title-tooltip__footnote">{tip.footnote}</p>
      </span>
    </span>
  )
}
