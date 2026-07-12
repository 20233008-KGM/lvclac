import {
  createContext,
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
import { useLanguage, type Locale } from '../i18n'
import {
  readDisclaimerSkip,
  shouldAutoShowDisclaimer,
  writeDisclaimerAck,
  writeDisclaimerSkip,
} from './serviceDisclaimerLogic'
import { shouldShowWelcome, writeWelcomeCompleted } from './welcomeFlowLogic'
import { WelcomeFlow } from './WelcomeFlow'

type LegalView = 'terms' | 'privacy' | null
type DisclaimerMode = 'required' | 'info'

export const footerLegalCopy: Record<Locale, { refundPolicy: string }> = {
  ko: { refundPolicy: '환불 정책' },
  en: { refundPolicy: 'Refund Policy' },
}

type DisclaimerContextValue = {
  skipActive: boolean
  showAgain: () => void
}

const DisclaimerContext = createContext<DisclaimerContextValue | null>(null)

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
  // 신규 방문자는 환영 플로우가 유일한 첫 관문. 환영이 뜨는 동안 면책 모달은 배타적으로 숨긴다.
  const [welcomeOpen, setWelcomeOpen] = useState(() =>
    shouldShowWelcome(pathname, localStorage, sessionStorage),
  )
  const [open, setOpen] = useState(
    () =>
      !shouldShowWelcome(pathname, localStorage, sessionStorage) &&
      shouldAutoShowDisclaimer(pathname, localStorage, sessionStorage),
  )
  const [mode, setMode] = useState<DisclaimerMode>('required')
  const [skipActive, setSkipActive] = useState(() => readDisclaimerSkip(localStorage))

  const showAgain = () => {
    setMode('info')
    setOpen(true)
  }

  // 환영 플로우 완료. persist=true면 면책 ack/skip + 온보딩 완료 플래그를 남겨 다시 안 뜨게 한다.
  // persist=false('저장 안 함' 선택)면 아무 억제 플래그도 남기지 않아 다음 새로고침에 환영이 다시 뜬다.
  const handleWelcomeComplete = (persist: boolean) => {
    if (persist) {
      writeDisclaimerAck(sessionStorage)
      writeDisclaimerSkip(localStorage, true)
      writeWelcomeCompleted(localStorage)
      setSkipActive(true)
    }
    setWelcomeOpen(false)
  }

  return (
    <DisclaimerContext.Provider value={{ skipActive, showAgain }}>
      {children}
      {welcomeOpen ? (
        <WelcomeFlow onComplete={handleWelcomeComplete} />
      ) : (
        open && (
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
        )
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
