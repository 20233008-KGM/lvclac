import {
  ABOUT_PATH,
  COMPANY_PATH,
  GUIDE_PATH,
  PRIVACY_PATH,
  TERMS_PATH,
  UPDATES_PATH,
} from '../config/routes'
import {
  PUBLIC_OPERATOR_INFO,
  publicFooterOperatorDetails,
} from '../config/operator'
import { useGoogleConsent } from '../context/googleConsentState'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { DisclaimerShowAgainLink } from './ServiceDisclaimer'

const footerCopy = {
  ko: {
    description:
      '선물 포지션의 청산 위험과 주문 이후 변화를 빠르게 검토하는 브라우저 기반 계산 보조 도구입니다.',
    columns: [
      {
        id: 'product',
        title: 'Product',
        links: [
          { label: '서비스 소개', href: ABOUT_PATH },
          { label: '사용 가이드', href: GUIDE_PATH },
          { label: '업데이트', href: UPDATES_PATH },
        ],
      },
      {
        id: 'company',
        title: 'Company',
        links: [
          { label: '회사 소개', href: COMPANY_PATH },
          {
            label: '문의하기',
            href: `mailto:${PUBLIC_OPERATOR_INFO.contactEmail}`,
          },
        ],
      },
      {
        id: 'legal',
        title: 'Legal',
        links: [],
      },
    ],
    privacySettings: '개인정보·쿠키 설정',
    bottomTerms: '이용약관',
    bottomPrivacy: '개인정보처리방침',
  },
  en: {
    description:
      'A browser-based calculation aid for reviewing futures liquidation risk and post-order changes.',
    columns: [
      {
        id: 'product',
        title: 'Product',
        links: [
          { label: 'Service overview', href: ABOUT_PATH },
          { label: 'User guide', href: GUIDE_PATH },
          { label: 'Updates', href: UPDATES_PATH },
        ],
      },
      {
        id: 'company',
        title: 'Company',
        links: [
          { label: 'About us', href: COMPANY_PATH },
          {
            label: 'Contact',
            href: `mailto:${PUBLIC_OPERATOR_INFO.contactEmail}`,
          },
        ],
      },
      {
        id: 'legal',
        title: 'Legal',
        links: [],
      },
    ],
    privacySettings: 'Privacy and cookie settings',
    bottomTerms: 'Terms',
    bottomPrivacy: 'Privacy',
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
            <p className="site-footer__tagline">{copy.description}</p>
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
                  {column.id === 'legal' && (
                    <>
                      <li>
                        <button
                          type="button"
                          className="site-footer__link site-footer__link-button"
                          onClick={openPrivacySettings}
                        >
                          {copy.privacySettings}
                        </button>
                      </li>
                      <li>
                        <DisclaimerShowAgainLink variant="footer-nav" />
                      </li>
                    </>
                  )}
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
            <a
              className="site-footer__bottom-link"
              href={TERMS_PATH}
              onClick={(event) => {
                event.preventDefault()
                navigate(TERMS_PATH)
              }}
            >
              {copy.bottomTerms}
            </a>
            <a
              className="site-footer__bottom-link"
              href={PRIVACY_PATH}
              onClick={(event) => {
                event.preventDefault()
                navigate(PRIVACY_PATH)
              }}
            >
              {copy.bottomPrivacy}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
