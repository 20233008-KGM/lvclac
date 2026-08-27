import type { Messages } from '../i18n/types'

type FormulasMessages = Messages['formulas']

interface FormulasContentProps {
  formulas: FormulasMessages
  variant?: 'page' | 'modal'
}

export function FormulasContent({ formulas: f, variant = 'page' }: FormulasContentProps) {
  const rootClass =
    variant === 'modal' ? 'formulas-content formulas-content--modal' : 'formulas-content'

  return (
    <div className={rootClass}>
      {variant === 'page' && (
        <>
          <p className="formulas-page__desc">{f.description}</p>
          <p className="formulas-page__notice" role="note">
            {f.disclaimer}
          </p>
        </>
      )}

      {variant === 'modal' && (
        <p className="formulas-content__modal-notice" role="note">
          {f.disclaimer}
        </p>
      )}

      <section
        className="formulas-panel formulas-panel--symbols"
        aria-labelledby="formulas-symbols"
      >
        <h2 id="formulas-symbols" className="formulas-panel__title">
          {f.symbolTitle}
        </h2>
        <dl className="formulas-symbols">
          {f.symbols.map((row) => (
            <div key={row.symbol} className="formulas-symbols__row">
              <dt className="formulas-symbols__symbol">{row.symbol}</dt>
              <dd className="formulas-symbols__meaning">{row.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>

      {f.sections.map((section) => (
        <section
          key={section.title}
          className="formulas-panel"
          aria-labelledby={`formula-section-${section.title}`}
        >
          <h2 id={`formula-section-${section.title}`} className="formulas-panel__title">
            {section.title}
          </h2>
          {section.intro && <p className="formulas-panel__intro">{section.intro}</p>}
          <ul className="formulas-list">
            {section.entries.map((entry) => (
              <li key={entry.name} className="formulas-entry">
                <h3 className="formulas-entry__name">{entry.name}</h3>
                <p className="formulas-entry__expr">{entry.expression}</p>
                {entry.description && (
                  <p className="formulas-entry__desc">{entry.description}</p>
                )}
              </li>
            ))}
          </ul>
          {section.notes && section.notes.length > 0 && (
            <ul className="formulas-notes">
              {section.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
