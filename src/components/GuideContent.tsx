import type { Messages } from '../i18n/types'

type GuideMessages = Messages['guide']

interface GuideContentProps {
  guide: GuideMessages
}

export function GuideContent({ guide }: GuideContentProps) {
  return (
    <div className="guide-content">
      {guide.description.split('\n').map((line, lineIndex) => (
        <p key={lineIndex} className="guide-page__desc">
          {line}
        </p>
      ))}

      {guide.sections.map((section, sectionIndex) => (
        <section
          key={`${sectionIndex}-${section.title}`}
          className="guide-panel"
          aria-labelledby={`guide-section-${sectionIndex}`}
        >
          <h2 id={`guide-section-${sectionIndex}`} className="guide-panel__title">
            {section.title}
          </h2>
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} className="guide-panel__paragraph">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ul className="guide-panel__list">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <p className="guide-page__footnote" role="note">
        {guide.footnote}
      </p>
    </div>
  )
}
