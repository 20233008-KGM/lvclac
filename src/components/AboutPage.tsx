import { useEffect } from 'react'
import { CONTACT_EMAIL } from '../config/site'
import {
  PUBLIC_OPERATOR_INFO,
  publicOperatorDetails,
  publicOperatorDisplayName,
} from '../config/operator'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

export function AboutPage() {
  const { t, locale } = useLanguage()
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
        </div>

        <div className="about-header__brand">
          <div className="about-header__meta">
            <p className="about-header__company">{publicOperatorDisplayName()}</p>
            <p className="about-header__label">{about.title}</p>
          </div>
          <h1 className="about-header__headline">{about.tagline}</h1>
          <p className="about-header__lead">{about.lead}</p>
        </div>
      </header>

      <main className="about-main">
        <div className="about-sections">
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
        </div>

        <section className="about-panel about-operator">
          <h2 className="about-panel__title">
            {locale === 'ko' ? '운영 정보' : 'Operator information'}
          </h2>
          <dl className="about-operator__list">
            {publicOperatorDetails(locale).map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
          <p className="about-panel__paragraph">
            {locale === 'ko'
              ? `${PUBLIC_OPERATOR_INFO.productName}는 ${PUBLIC_OPERATOR_INFO.brandName}가 설계·운영합니다.`
              : `${PUBLIC_OPERATOR_INFO.productName} is designed and operated by ${PUBLIC_OPERATOR_INFO.brandName}.`}
          </p>
        </section>

        <p className="about-contact">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
