import { ABOUT_PATH } from '../config/routes'
import { CONTACT_EMAIL } from '../config/site'
import { publicOperatorDisplayName } from '../config/operator'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

export function AboutPage() {
  const { t } = useLanguage()
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

        <section className="about-contact">
          <div className="about-contact__copy">
            <h2 className="about-contact__title">{about.contact.title}</h2>
            <p className="about-contact__body">{about.contact.body}</p>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </section>
      </div>
    </PublicInfoShell>
  )
}
