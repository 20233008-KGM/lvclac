import { PRIVACY_PATH, TERMS_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { DisclaimerShowAgainLink } from './ServiceDisclaimer'

const publicFooterLinks = {
  ko: [
    { label: '이용약관', href: TERMS_PATH },
    { label: '개인정보처리방침', href: PRIVACY_PATH },
  ],
  en: [
    { label: 'Terms', href: TERMS_PATH },
    { label: 'Privacy', href: PRIVACY_PATH },
  ],
} as const

export function SiteFooter() {
  const { t, locale } = useLanguage()
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
            <div className="site-footer__col">
              <h2 className="site-footer__col-title">{locale === 'ko' ? '약관 및 정책' : 'Legal'}</h2>
              <ul className="site-footer__col-list">
                {publicFooterLinks[locale].map((link) => (
                  <li key={link.href}>
                    <a
                      className="site-footer__link"
                      href={link.href}
                      onClick={(event) => {
                        event.preventDefault()
                        navigate(link.href)
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
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
