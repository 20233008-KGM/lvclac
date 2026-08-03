import {
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  PRIVACY_PATH,
  REFUND_POLICY_PATH,
  TERMS_PATH,
} from '../config/routes'
import { usePathname } from '../hooks/usePathname'
import { usePublicCalculator } from '../context/PublicCalculatorContext'
import { FirstVisitFlowContext } from '../context/FirstVisitFlowContext'
import { useLanguage, type Locale } from '../i18n'
import {
  shouldShowPublicSaveConsent,
  writePublicSaveConsent,
  type PublicSaveConsent,
} from './publicSaveConsent'
import {
  readDisclaimerSkip,
  shouldAutoShowDisclaimer,
  writeDisclaimerAck,
  writeDisclaimerSkip,
} from './serviceDisclaimerLogic'
import { shouldShowWelcome, writeWelcomeCompleted } from './welcomeFlowLogic'
import { WelcomeFlow } from './WelcomeFlow'
import { CloudIcon, LocalComputerIcon } from './StorageModeIcons'
import { TrustModalFrame } from './TrustModalFrame'

type LegalView = 'terms' | 'privacy' | null
type DisclaimerMode = 'required' | 'info'

const footerLegalCopy: Record<Locale, { refundPolicy: string }> = {
  ko: { refundPolicy: '환불 정책' },
  en: { refundPolicy: 'Refund Policy' },
}

function ServiceNoticeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.5 7.7-7 9.3-4.5-1.6-7-4.9-7-9.3V6z" />
      <path d="M9 12.1 11.1 14 15.4 9.6" />
    </svg>
  )
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

export function DisclaimerShowAgainLink({
  variant = 'default',
}: {
  variant?: 'default' | 'footer' | 'footer-nav'
}) {
  const { t } = useLanguage()
  const ctx = useContext(FirstVisitFlowContext)

  if (!ctx || (variant !== 'footer-nav' && !ctx.skipActive)) return null

  const className =
    variant === 'footer'
      ? 'link-btn site-footer__legal-extra'
      : variant === 'footer-nav'
        ? 'site-footer__link site-footer__link-button'
        : 'link-btn legal-show-again'

  return (
    <button type="button" className={className} onClick={ctx.showAgain}>
      {t.legal.showModalAgain}
    </button>
  )
}

export function LegalLinks({ variant = 'default' }: { variant?: 'default' | 'footer' }) {
  const { t, locale } = useLanguage()
  const [view, setView] = useState<LegalView>(null)
  const isFooter = variant === 'footer'

  if (isFooter) {
    return (
      <div className="site-footer__legal">
        <a className="link-btn" href={TERMS_PATH}>
          {t.legal.termsLink}
        </a>
        <a className="link-btn" href={PRIVACY_PATH}>
          {t.legal.privacyLink}
        </a>
        <a className="link-btn" href={REFUND_POLICY_PATH}>
          {footerLegalCopy[locale].refundPolicy}
        </a>
      </div>
    )
  }

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
  const pathname = usePathname()
  const [welcomeOpen, setWelcomeOpen] = useState(() =>
    shouldShowWelcome(pathname, localStorage, sessionStorage),
  )
  const [open, setOpen] = useState(
    () =>
      !shouldShowWelcome(pathname, localStorage, sessionStorage) &&
      shouldAutoShowDisclaimer(pathname, localStorage, sessionStorage),
  )
  const [saveConsentResolved, setSaveConsentResolved] = useState(false)
  const [mode, setMode] = useState<DisclaimerMode>('required')
  const [skipActive, setSkipActive] = useState(() => readDisclaimerSkip(localStorage))
  const saveConsentOpen =
    !welcomeOpen &&
    !open &&
    !saveConsentResolved &&
    shouldShowPublicSaveConsent(pathname, localStorage)
  const firstVisitGateActive =
    mode === 'required' && (welcomeOpen || open || saveConsentOpen)

  const showAgain = () => {
    setMode('info')
    setOpen(true)
  }

  const handleWelcomeComplete = () => {
    writeDisclaimerAck(sessionStorage)
    writeDisclaimerSkip(localStorage, true)
    writeWelcomeCompleted(localStorage)
    setSkipActive(true)
    setWelcomeOpen(false)
  }

  return (
    <FirstVisitFlowContext.Provider value={{ skipActive, showAgain, firstVisitGateActive }}>
      {children}
      {welcomeOpen ? (
        <WelcomeFlow onComplete={handleWelcomeComplete} />
      ) : open && (
        <DisclaimerModalContent
          mode={mode}
          onClose={() => setOpen(false)}
          onAcknowledge={(dontShowAgain) => {
            writeDisclaimerAck(sessionStorage)
            if (dontShowAgain) {
              writeDisclaimerSkip(localStorage, true)
              setSkipActive(true)
            }
            setOpen(false)
          }}
        />
      )}
      {saveConsentOpen && (
        <PublicSaveConsentModal
          onDecision={(decision) => {
            writePublicSaveConsent(localStorage, decision)
            setSaveConsentResolved(true)
          }}
        />
      )}
    </FirstVisitFlowContext.Provider>
  )
}

function PublicSaveConsentModal({
  onDecision,
}: {
  onDecision: (decision: PublicSaveConsent) => void
}) {
  const { t } = useLanguage()
  const { setSaveEnabled, pauseSaving } = usePublicCalculator()
  const [selectedDecision, setSelectedDecision] = useState<PublicSaveConsent | null>(null)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const copy = t.draftSave

  const selectDecision = (decision: PublicSaveConsent) => {
    setSelectedDecision(decision)
    setSubmitError(null)
  }

  const confirmDecision = async () => {
    if (!selectedDecision || busy) return

    setSubmitError(null)
    if (selectedDecision === 'off') {
      pauseSaving()
      onDecision('off')
      return
    }

    setBusy(true)
    try {
      const error = await setSaveEnabled(true, 'local')
      if (error) {
        setSubmitError(copy.statusError)
        setBusy(false)
        return
      }
      onDecision('local')
    } catch {
      setSubmitError(copy.statusError)
      setBusy(false)
    }
  }

  const confirmLabel =
    selectedDecision === 'off'
      ? copy.publicConsentOffConfirm
      : selectedDecision === 'local'
        ? copy.publicConsentLocalConfirm
        : copy.publicConsentSelectPrompt

  const actions = (
    <>
      <div
        className="public-save-consent-actions"
        role="radiogroup"
        aria-label={copy.publicConsentActionLabel}
      >
        <label
          className={`public-save-consent-choice ${
            selectedDecision === 'off' ? 'public-save-consent-choice--selected' : ''
          }`}
        >
          <input
            type="radio"
            name="public-save-consent"
            value="off"
            checked={selectedDecision === 'off'}
            disabled={busy}
            onChange={() => selectDecision('off')}
          />
          <span className="public-save-consent-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 5 19 19" />
              <path d="M7 4h9l3 3v10l-2 2H7l-2-2V7" />
            </svg>
          </span>
          <span>
            <strong>{copy.publicConsentOff}</strong>
            <span>{copy.publicConsentOffDescription}</span>
          </span>
          <span className="public-save-consent-choice-check" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="m2.5 6 2.1 2.1 4.9-5" />
            </svg>
          </span>
        </label>
        <label
          className={`public-save-consent-choice ${
            selectedDecision === 'local' ? 'public-save-consent-choice--selected' : ''
          }`}
        >
          <input
            type="radio"
            name="public-save-consent"
            value="local"
            checked={selectedDecision === 'local'}
            disabled={busy}
            onChange={() => selectDecision('local')}
          />
          <span className="public-save-consent-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 4h11l3 3v13H5z" />
              <path d="M8 4v6h8V4" />
              <path d="M8 20v-6h8v6" />
            </svg>
          </span>
          <span>
            <strong>{copy.publicConsentLocal}</strong>
            <span>{copy.publicConsentLocalDescription}</span>
          </span>
          <span className="public-save-consent-choice-check" aria-hidden="true">
            <svg viewBox="0 0 12 12" fill="none">
              <path d="m2.5 6 2.1 2.1 4.9-5" />
            </svg>
          </span>
        </label>
      </div>
      {submitError && (
        <p className="public-save-consent-error" role="alert">
          {submitError}
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary public-save-consent-confirm"
        disabled={!selectedDecision || busy}
        aria-busy={busy}
        onClick={() => void confirmDecision()}
      >
        {busy ? copy.statusSaving : confirmLabel}
      </button>
      <p className="public-save-consent-footnote">{copy.publicConsentFootnote}</p>
    </>
  )

  return (
    <TrustModalFrame
      variant="storage"
      titleId="public-save-consent-title"
      descriptionId="public-save-consent-intro"
      eyebrow={copy.publicConsentEyebrow}
      title={copy.publicConsentTitle}
      intro={copy.publicConsentIntro}
      icon={<LocalComputerIcon className="public-save-consent-storage-icon" />}
      footer={actions}
    >
      <div
        className="public-save-consent-facts"
        aria-label={copy.publicConsentSummaryLabel}
      >
        <div className="public-save-consent-fact">
          <span className="public-save-consent-fact-icon" aria-hidden="true">
            <LocalComputerIcon className="public-save-consent-storage-icon" />
          </span>
          <span>
            <strong>{copy.publicConsentBrowserOnlyTitle}</strong>
            <span>{copy.publicConsentBrowserOnlyBody}</span>
          </span>
        </div>
        <div className="public-save-consent-fact">
          <span className="public-save-consent-fact-icon" aria-hidden="true">
            <CloudIcon className="public-save-consent-storage-icon" />
          </span>
          <span>
            <strong>{copy.publicConsentNoServerTitle}</strong>
            <span>{copy.publicConsentNoServerBody}</span>
          </span>
        </div>
      </div>
      <div className="public-save-consent-saved-summary">
        <span>{copy.publicConsentSavedLabel}</span>
        <p>{copy.publicConsentSavedItems.join(' · ')}</p>
      </div>
      <div className="public-save-consent-warning">
        <span>{copy.publicConsentSharedDeviceLabel}</span>
        <p>
          <strong>{copy.publicConsentSharedDeviceTitle}</strong>{' '}
          {copy.publicConsentSharedDeviceBody}
        </p>
      </div>
    </TrustModalFrame>
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

  const footer = required ? (
    <>
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
    </>
  ) : (
    <button
      type="button"
      className="btn btn-primary disclaimer-modal-btn"
      onClick={acknowledge}
    >
      {t.legal.dismissButton}
    </button>
  )

  return (
    <TrustModalFrame
      variant="service"
      titleId="disclaimer-title"
      eyebrow={t.legal.modalEyebrow}
      title={t.legal.modalTitle}
      intro={t.legal.modalIntro}
      icon={<ServiceNoticeIcon />}
      footer={footer}
    >
      <div className="disclaimer-sections">
        {t.legal.sections.map((section, index) => (
          <section key={section.title}>
            <span className="disclaimer-section-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </div>
          </section>
        ))}
      </div>
      <p className="disclaimer-modal-warning">
        <span className="disclaimer-warning-icon" aria-hidden="true">!</span>
        <LegalEmphasis>{t.legal.resultMismatchWarning}</LegalEmphasis>
      </p>
    </TrustModalFrame>
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
