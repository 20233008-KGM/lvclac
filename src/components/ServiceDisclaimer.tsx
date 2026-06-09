import { useState } from 'react'
import { useLanguage } from '../i18n'

const SESSION_KEY = 'leverage-disclaimer-ack-v2'

type LegalView = 'terms' | 'privacy' | null

export function ServiceDisclaimer() {
  const { t } = useLanguage()

  return (
    <div className="service-disclaimer" role="note">
      <p>{t.legal.bannerShort}</p>
    </div>
  )
}

export function LegalLinks() {
  const { t } = useLanguage()
  const [view, setView] = useState<LegalView>(null)

  return (
    <>
      <div className="legal-links">
        <button type="button" className="link-btn" onClick={() => setView('terms')}>
          {t.legal.termsLink}
        </button>
        <span aria-hidden="true">·</span>
        <button type="button" className="link-btn" onClick={() => setView('privacy')}>
          {t.legal.privacyLink}
        </button>
      </div>
      {view && (
        <LegalOverlay
          title={view === 'terms' ? t.legal.termsTitle : t.legal.privacyTitle}
          paragraphs={view === 'terms' ? t.legal.termsBody : t.legal.privacyBody}
          backLabel={t.legal.back}
          onClose={() => setView(null)}
        />
      )}
    </>
  )
}

export function DisclaimerModal() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(() => sessionStorage.getItem(SESSION_KEY) !== '1')

  if (!open) return null

  function acknowledge() {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }

  return (
    <div className="disclaimer-overlay" role="presentation">
      <div
        className="disclaimer-modal disclaimer-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
      >
        <h2 id="disclaimer-title" className="disclaimer-modal-title">
          {t.legal.modalTitle}
        </h2>
        <p className="disclaimer-modal-text">{t.legal.modalIntro}</p>
        <div className="disclaimer-sections">
          {t.legal.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <p className="disclaimer-modal-ack">{t.legal.acknowledge}</p>
        <button type="button" className="btn btn-primary" onClick={acknowledge}>
          {t.legal.confirmButton}
        </button>
      </div>
    </div>
  )
}

function LegalOverlay({
  title,
  paragraphs,
  backLabel,
  onClose,
}: {
  title: string
  paragraphs: string[]
  backLabel: string
  onClose: () => void
}) {
  return (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="disclaimer-modal disclaimer-modal--wide" role="dialog" aria-modal="true">
        <h2 className="disclaimer-modal-title">{title}</h2>
        <div className="legal-body">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          {backLabel}
        </button>
      </div>
    </div>
  )
}
