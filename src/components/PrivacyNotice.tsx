import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

type PrivacyNoticeProps = {
  title: string
  intro: string
  desktopIntro: string
  closeLabel: string
  onRequestClose: () => void
  children: ReactNode
  footer: ReactNode
}

// A non-modal region: opening it must not steal focus or block the calculator.
export function PrivacyNotice({
  title, intro, desktopIntro, closeLabel, onRequestClose, children, footer,
}: PrivacyNoticeProps) {
  return createPortal(
    <section
      className="privacy-notice"
      aria-labelledby="privacy-settings-title"
      aria-describedby="privacy-settings-intro"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onRequestClose()
        }
      }}
    >
      <header className="privacy-notice__header">
        <h2 id="privacy-settings-title">{title}</h2>
        <button
          type="button"
          className="privacy-notice__close"
          aria-label={closeLabel}
          onClick={onRequestClose}
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </header>
      <div className="privacy-notice__body">
        <p id="privacy-settings-intro">{intro}</p>
        <p className="privacy-notice__desktop-intro">{desktopIntro}</p>
        {children}
      </div>
      <footer className="privacy-notice__footer">{footer}</footer>
    </section>,
    document.body,
  )
}
