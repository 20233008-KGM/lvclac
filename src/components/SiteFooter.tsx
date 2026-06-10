import { useLanguage } from '../i18n'
import { useNavigate } from '../hooks/usePathname'
import { DisclaimerShowAgainLink, LegalLinks } from './ServiceDisclaimer'

function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

export function SiteFooter() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <footer className="site-footer">
      <div className="site-footer__panel">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <p className="site-footer__company">Farfield Software</p>
            <p className="site-footer__product">{t.siteTitle}</p>
            <p className="site-footer__tagline">{t.footer.tagline}</p>
          </div>

          <nav className="site-footer__nav" aria-label={t.footer.navAriaLabel}>
            {t.footer.columns.map((column) => (
              <div key={column.title} className="site-footer__col">
                <h2 className="site-footer__col-title">{column.title}</h2>
                <ul className="site-footer__col-list">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.soon ? (
                        <span className="site-footer__link site-footer__link--soon">
                          {link.label}
                          <span className="site-footer__soon">{t.footer.soon}</span>
                        </span>
                      ) : link.href && isInternalPath(link.href) ? (
                        <a
                          className="site-footer__link"
                          href={link.href}
                          onClick={(event) => {
                            event.preventDefault()
                            navigate(link.href!)
                          }}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <a className="site-footer__link" href={link.href}>
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">{t.footer.copyright}</p>
          <div className="site-footer__bottom-actions">
            <LegalLinks variant="footer" />
            <DisclaimerShowAgainLink variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  )
}
