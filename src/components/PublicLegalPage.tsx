import { PRIVACY_PATH, TERMS_PATH } from '../config/routes'
import { useLanguage } from '../i18n'
import { BackToCalculatorLink, PublicInfoShell } from './PublicInfoShell'
import { buildLegalDocuments } from './legalDocuments'

export function PublicLegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const { locale } = useLanguage()
  const page = buildLegalDocuments(locale)[kind]
  const eyebrow = locale === 'ko' ? 'LiqGuard · 법적 고지' : 'LiqGuard · Legal'
  const activePath = kind === 'terms' ? TERMS_PATH : PRIVACY_PATH

  return (
    <PublicInfoShell
      activePath={activePath}
      tone="legal"
      eyebrow={eyebrow}
      title={page.title}
      lead={page.intro}
    >
      <div className="public-legal-document">
        <p className="public-legal-effective">{page.effective}</p>
        <div className="public-legal-sections">
            {page.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.table && section.table.headers.length > 2 && (
                  <p className="public-legal-table-hint">
                    {locale === 'ko' ? '표를 좌우로 밀어 전체 내용을 확인하세요.' : 'Scroll the table sideways to read all columns.'}
                  </p>
                )}
                {section.table && (
                  <div className="public-legal-table-wrap" role="region" aria-label={section.title} tabIndex={0}>
                    <table className="public-legal-table">
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join('|')}>
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th key={cell} scope="row">
                                  {cell}
                                </th>
                              ) : (
                                <td key={`${index}-${cell}`}>{cell}</td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.links && (
                  <ul className="public-legal-links">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
        </div>
        <BackToCalculatorLink className="public-legal-home" />
      </div>
    </PublicInfoShell>
  )
}
