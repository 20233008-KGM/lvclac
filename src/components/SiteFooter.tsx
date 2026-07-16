import {
  ABOUT_PATH,
  FORMULAS_PATH,
  GUIDE_PATH,
  PRIVACY_PATH,
  TERMS_PATH,
} from '../config/routes'
import {
  PUBLIC_OPERATOR_INFO,
  publicOperatorDetails,
  publicOperatorDisplayName,
} from '../config/operator'
import { useGoogleConsent } from '../context/googleConsentState'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { DisclaimerShowAgainLink } from './ServiceDisclaimer'

const footerCopy = {
  ko: {
    columns: [
      {
        title: '제품',
        links: [
          { label: '선물 계산기', href: '/' },
          { label: '사용 가이드', href: GUIDE_PATH },
          { label: '수식 정의', href: FORMULAS_PATH },
        ],
      },
      {
        title: '회사',
        links: [
          { label: '서비스 소개', href: ABOUT_PATH },
          {
            label: PUBLIC_OPERATOR_INFO.contactEmail,
            href: `mailto:${PUBLIC_OPERATOR_INFO.contactEmail}`,
          },
        ],
      },
      {
        title: '약관 및 정책',
        links: [
          { label: '이용약관', href: TERMS_PATH },
          { label: '개인정보처리방침', href: PRIVACY_PATH },
        ],
      },
    ],
    privacySettings: '개인정보·쿠키 설정',
  },
  en: {
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Calculator', href: '/' },
          { label: 'User guide', href: GUIDE_PATH },
          { label: 'Formula reference', href: FORMULAS_PATH },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: ABOUT_PATH },
          {
            label: PUBLIC_OPERATOR_INFO.contactEmail,
            href: `mailto:${PUBLIC_OPERATOR_INFO.contactEmail}`,
          },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms', href: TERMS_PATH },
          { label: 'Privacy', href: PRIVACY_PATH },
        ],
      },
    ],
    privacySettings: 'Privacy and cookie settings',
  },
} as const

function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

export function SiteFooter() {
  const { t, locale } = useLanguage()
  const { openPrivacySettings } = useGoogleConsent()
  const navigate = useNavigate()
  const copy = footerCopy[locale]
  const operatorDetails = publicOperatorDetails(locale)

  return (
    <footer className="site-footer">
      <div className="site-footer__panel">
        <div className="site-footer__main">
          <div className="site-footer__brand">
            <p className="site-footer__company">{publicOperatorDisplayName()}</p>
            <p className="site-footer__product">{PUBLIC_OPERATOR_INFO.productName}</p>
            <p className="site-footer__tagline">{t.footer.tagline}</p>
          </div>

          <nav className="site-footer__nav" aria-label={t.footer.navAriaLabel}>
            {copy.columns.map((column) => (
              <div key={column.title} className="site-footer__col">
                <h2 className="site-footer__col-title">{column.title}</h2>
                <ul className="site-footer__col-list">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        className="site-footer__link"
                        href={link.href}
                        onClick={
                          isInternalPath(link.href)
                            ? (event) => {
                                event.preventDefault()
                                navigate(link.href)
                              }
                            : undefined
                        }
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                  {column.title === copy.columns[2].title && (
                    <li>
                      <button
                        type="button"
                        className="site-footer__link site-footer__link-button"
                        onClick={openPrivacySettings}
                      >
                        {copy.privacySettings}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <dl className="site-footer__operator">
          {operatorDetails.map((detail) => (
            <div key={detail.label} className="site-footer__operator-item">
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

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
