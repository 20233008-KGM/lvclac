import { useEffect } from 'react'
import { CONTACT_EMAIL } from '../config/site'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { AuthButton } from './auth/AuthButton'
import { LanguageToggle } from './LanguageToggle'
import { LegalLinks } from './ServiceDisclaimer'
import '../styles/pages.css'

export function AboutPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const about = t.about

  useEffect(() => {
    document.documentElement.dataset.zone = 'about'
    return () => {
      delete document.documentElement.dataset.zone
    }
  }, [])

  return (
    <div className="about-zone">
      <header className="about-header">
        <div className="about-header__top">
          <button
            type="button"
            className="about-header__back"
            onClick={() => navigate('/')}
          >
            {about.backToHome}
          </button>
          <div className="about-header__actions">
            <AuthButton variant="header" />
            <LanguageToggle variant="header" />
          </div>
        </div>

        <div className="about-header__brand">
          <div className="about-header__meta">
            <p className="about-header__company">{about.company}</p>
            <p className="about-header__label">{about.title}</p>
          </div>
          <h1 className="about-header__headline">{about.tagline}</h1>
          <p className="about-header__lead">{about.lead}</p>
        </div>
      </header>

      <main className="about-main">
        {about.sections.map((section) => (
          <section key={section.title} className="about-panel">
            <h2 className="about-panel__title">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="about-panel__paragraph">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <p className="about-contact">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </main>

      <footer className="about-footer">
        <p className="about-footer__copy">{t.footer.copyright}</p>
        <LegalLinks variant="footer" />
      </footer>
    </div>
  )
}
