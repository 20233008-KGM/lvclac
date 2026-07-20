import { ABOUT_PATH } from '../config/routes'
import { CONTACT_EMAIL } from '../config/site'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

export function AboutPage() {
  const { t } = useLanguage()
  const about = t.about

  return (
    <PublicInfoShell
      activePath={ABOUT_PATH}
      tone="company"
      eyebrow={`${about.company} · ${about.title}`}
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

        <p className="about-contact">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </div>
    </PublicInfoShell>
  )
}
