import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useLanguage } from '../i18n'

const ACK_KEY = 'leverage-disclaimer-ack-v3'
const SKIP_KEY = 'leverage-disclaimer-skip-v3'

type LegalView = 'terms' | 'privacy' | null
type DisclaimerMode = 'required' | 'info'

type DisclaimerContextValue = {
  skipActive: boolean
  showAgain: () => void
}

const DisclaimerContext = createContext<DisclaimerContextValue | null>(null)

function readDisclaimerSkip(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) === '1'
  } catch {
    return false
  }
}

function setDisclaimerSkip(skip: boolean): void {
  try {
    if (skip) localStorage.setItem(SKIP_KEY, '1')
    else localStorage.removeItem(SKIP_KEY)
  } catch {
    // ignore
  }
}

function readDisclaimerAck(): boolean {
  try {
    return sessionStorage.getItem(ACK_KEY) === '1'
  } catch {
    return false
  }
}

function setDisclaimerAck(): void {
  try {
    sessionStorage.setItem(ACK_KEY, '1')
  } catch {
    // ignore
  }
}

function shouldAutoShowDisclaimer(): boolean {
  if (readDisclaimerSkip()) return false
  if (readDisclaimerAck()) return false
  return true
}

export function LegalEmphasis({ children }: { children: ReactNode }) {
  return <span className="legal-emphasis">{children}</span>
}

export function ServiceDisclaimer() {
  const { t } = useLanguage()

  return (
    <div className="service-disclaimer" role="note">
      <p>
        {t.legal.bannerShort}{' '}
        <LegalEmphasis>{t.legal.resultMismatchWarning}</LegalEmphasis>
      </p>
    </div>
  )
}

export function ContentRiskNotice() {
  const { t } = useLanguage()

  return (
    <aside className="content-risk-notice" role="note" aria-label={t.legal.contentNoticeLabel}>
      <p className="content-risk-notice__text">{t.footer.disclaimer}</p>
    </aside>
  )
}

export function DisclaimerShowAgainLink({ variant = 'default' }: { variant?: 'default' | 'footer' }) {
  const { t } = useLanguage()
  const ctx = useContext(DisclaimerContext)

  if (!ctx?.skipActive) return null

  const className =
    variant === 'footer' ? 'link-btn site-footer__legal-extra' : 'link-btn legal-show-again'

  return (
    <button type="button" className={className} onClick={ctx.showAgain}>
      {t.legal.showModalAgain}
    </button>
  )
}

export function LegalLinks({ variant = 'default' }: { variant?: 'default' | 'footer' }) {
  const { t } = useLanguage()
  const [view, setView] = useState<LegalView>(null)
  const isFooter = variant === 'footer'

  return (
    <>
      <div className={isFooter ? 'site-footer__legal' : 'legal-links'}>
        <button type="button" className="link-btn" onClick={() => setView('terms')}>
          {t.legal.termsLink}
        </button>
        {!isFooter && <span aria-hidden="true">·</span>}
        <button type="button" className="link-btn" onClick={() => setView('privacy')}>
          {t.legal.privacyLink}
        </button>
      </div>
      {!isFooter && <DisclaimerShowAgainLink />}
      {view && (
        <LegalOverlay
          kind={view}
          backLabel={t.legal.back}
          onClose={() => setView(null)}
        />
      )}
    </>
  )
}

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(shouldAutoShowDisclaimer)
  const [mode, setMode] = useState<DisclaimerMode>('required')
  const [skipActive, setSkipActive] = useState(readDisclaimerSkip)

  const showAgain = () => {
    setMode('info')
    setOpen(true)
  }

  return (
    <DisclaimerContext.Provider value={{ skipActive, showAgain }}>
      {children}
      {open && (
        <DisclaimerModalContent
          mode={mode}
          onClose={() => setOpen(false)}
          onAcknowledge={(dontShowAgain) => {
            setDisclaimerAck()
            if (dontShowAgain) {
              setDisclaimerSkip(true)
              setSkipActive(true)
            }
            setOpen(false)
          }}
        />
      )}
    </DisclaimerContext.Provider>
  )
}

function DisclaimerModalContent({
  mode,
  onClose,
  onAcknowledge,
}: {
  mode: DisclaimerMode
  onClose: () => void
  onAcknowledge: (dontShowAgain: boolean) => void
}) {
  const { t } = useLanguage()
  const [ackChecked, setAckChecked] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const required = mode === 'required'

  function acknowledge() {
    if (required && !ackChecked) return
    if (required) onAcknowledge(dontShowAgain)
    else onClose()
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="disclaimer-overlay" role="presentation">
      <div
        className="disclaimer-modal disclaimer-modal--wide disclaimer-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
      >
        <div className="disclaimer-modal-scroll">
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
          <p className="disclaimer-modal-warning">
            <LegalEmphasis>{t.legal.resultMismatchWarning}</LegalEmphasis>
          </p>
        </div>
        {required ? (
          <div className="disclaimer-modal-foot">
            <label className="disclaimer-modal-ack">
              <input
                type="checkbox"
                checked={ackChecked}
                onChange={(e) => setAckChecked(e.target.checked)}
              />
              <span>{t.legal.acknowledge}</span>
            </label>
            <button
              type="button"
              className="btn btn-primary disclaimer-modal-btn"
              onClick={acknowledge}
              disabled={!ackChecked}
            >
              {t.legal.confirmButton}
            </button>
            <label className="disclaimer-modal-skip">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span>{t.legal.skipModalLabel}</span>
            </label>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary disclaimer-modal-btn"
            onClick={acknowledge}
          >
            {t.legal.dismissButton}
          </button>
        )}
      </div>
    </div>
  )
}

function LegalOverlay({
  kind,
  backLabel,
  onClose,
}: {
  kind: Exclude<LegalView, null>
  backLabel: string
  onClose: () => void
}) {
  const { t } = useLanguage()
  const isTerms = kind === 'terms'
  const title = isTerms ? t.legal.termsTitle : t.legal.privacyTitle
  const effectiveDate = isTerms ? t.legal.termsEffectiveDate : t.legal.privacyEffectiveDate
  const intro = isTerms ? t.legal.termsIntro : t.legal.privacyIntro
  const articles = isTerms ? t.legal.termsArticles : t.legal.privacyArticles
  const titleId = `legal-${kind}-title`

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal disclaimer-modal--wide disclaimer-modal--legal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="legal-document-scroll">
          <header className="legal-document-header">
            <h2 id={titleId} className="legal-document-title">
              {title}
            </h2>
            <p className="legal-document-meta">{effectiveDate}</p>
          </header>
          <p className="legal-document-intro">{intro}</p>
          <div className="legal-articles">
            {articles.map((article) => (
              <section key={article.title} className="legal-article">
                <h3 className="legal-article__title">{article.title}</h3>
                <p className="legal-article__body">{article.body}</p>
              </section>
            ))}
          </div>
        </div>
        <footer className="legal-document-foot">
          <button type="button" className="btn btn-ghost legal-document-back" onClick={onClose}>
            {backLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
