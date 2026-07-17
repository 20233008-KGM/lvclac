import { CONTACT_EMAIL } from '../config/site'
import { ABOUT_PATH } from '../config/routes'
import {
  PUBLIC_OPERATOR_INFO,
  publicOperatorDetails,
  publicOperatorDisplayName,
} from '../config/operator'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

export function AboutPage() {
  const { t, locale } = useLanguage()
  const about = t.about

  return (
    <PublicInfoShell
      activePath={ABOUT_PATH}
      tone="company"
      eyebrow={`${publicOperatorDisplayName()} · ${about.title}`}
      title={about.tagline}
      lead={about.lead}
    >
      <div className="about-main">
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
      </div>
    </PublicInfoShell>
  )
}
