import { PUBLIC_OPERATOR_INFO, publicFooterOperatorDetails } from '../config/operator'
import { useLanguage, type Locale } from '../i18n'
import { useNavigate } from '../hooks/usePathname'
import { DisclaimerShowAgainLink, footerLegalCopy } from './ServiceDisclaimer'
import { buildFooterColumns } from './footerNavigation'

const footerDescription: Record<Locale, string> = {
  ko: '선물 포지션의 청산 위험과 주문 이후 변화를 빠르게 검토하는 브라우저 기반 계산 보조 도구입니다.',
  en: 'A browser-based calculation aid for reviewing futures liquidation risk and post-order changes.',
}

function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

function isExternalPath(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://')
}

export function SiteFooter() {
  const { t, locale } = useLanguage()
  const navigate = useNavigate()
  const footerColumns = buildFooterColumns(t.footer.columns, locale, {
    terms: t.legal.termsLink,
    privacy: t.legal.privacyLink,
    refund: footerLegalCopy[locale].refundPolicy,
  })
  const operatorDetails = publicFooterOperatorDetails(locale)

  return (
    <footer className="site-footer">
      <div className="site-footer__panel">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <a
              className="site-footer__wordmark"
              href="/"
              onClick={(event) => {
                event.preventDefault()
                navigate('/')
              }}
            >
              <img
                className="site-footer__mark"
                src="/footer-brand-mark.svg"
                alt=""
                aria-hidden="true"
              />
              <span>{PUBLIC_OPERATOR_INFO.productName}</span>
            </a>
            <p className="site-footer__tagline">{footerDescription[locale]}</p>
          </div>

          <nav className="site-footer__nav" aria-label={t.footer.navAriaLabel}>
            {footerColumns.map((column) => (
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
                        <a
                          className="site-footer__link"
                          href={link.href}
                          {...(link.href && isExternalPath(link.href)
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                        >
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

        <div className="site-footer__operator-row">
          <dl className="site-footer__operator">
            {operatorDetails.map((detail) => (
              <div key={detail.label} className="site-footer__operator-item">
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">{t.footer.copyright}</p>
          <div className="site-footer__bottom-actions">
            <DisclaimerShowAgainLink variant="footer" />
          </div>
        </div>
      </div>
    </footer>
  )
}
