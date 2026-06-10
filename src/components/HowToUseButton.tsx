import { useLanguage } from '../i18n'

export function HowToUseButton() {
  const { t } = useLanguage()
  const h = t.howToUse

  return (
    <span className="header-how-tooltip-anchor">
      <button
        type="button"
        className="header-how-btn"
        aria-label={h.ariaLabel}
        aria-describedby="how-to-use-tooltip"
      >
        {h.button}
      </button>
      <span id="how-to-use-tooltip" className="header-how-tooltip" role="tooltip">
        <p className="header-how-tooltip__section">
          <strong>{h.beginnerTitle}</strong>
          {h.beginnerBody}
        </p>
        <p className="header-how-tooltip__section">
          <strong>{h.experiencedTitle}</strong>
          {h.experiencedBody}
        </p>
        <p className="header-how-tooltip__footnote">{h.footnote}</p>
      </span>
    </span>
  )
}
