import { GUIDE_PATH, PRICING_PATH, PRIVACY_PATH, REFUND_POLICY_PATH, TERMS_PATH } from '../config/routes'
import { useLanguage, type Locale, type Messages } from '../i18n'
import { useNavigate } from '../hooks/usePathname'
import { DisclaimerShowAgainLink, footerLegalCopy } from './ServiceDisclaimer'

type FooterColumn = Messages['footer']['columns'][number]
type FooterLink = FooterColumn['links'][number]
type FooterPolicyLabels = {
  terms: string
  privacy: string
  refund: string
}

export const paddleReviewFooterLinks: Record<Locale, { label: string; href: string }[]> = {
  ko: [{ label: 'Pro 요금제', href: PRICING_PATH }],
  en: [{ label: 'Pro Pricing', href: PRICING_PATH }],
}

export const footerPolicyColumnTitles: Record<Locale, string> = {
  ko: '약관 및 정책',
  en: 'Legal',
}

export function buildFooterColumns(
  columns: FooterColumn[],
  locale: Locale,
  policyLabels?: FooterPolicyLabels,
): FooterColumn[] {
  const guideLink = columns.flatMap((column) => column.links).find((link) => link.href === GUIDE_PATH)

  const navigationColumns = columns
    .filter((column, index) => index === 0 || !column.links.some((link) => link.href === GUIDE_PATH))
    .map((column, index) => {
      if (index !== 0) return column

      const [primaryLink] = column.links
      const reviewLinks = paddleReviewFooterLinks[locale]
      const links: FooterLink[] = [
        ...(primaryLink ? [primaryLink] : []),
        ...reviewLinks,
        ...(guideLink ? [guideLink] : []),
      ]

      return { ...column, links }
    })

  if (!policyLabels) return navigationColumns

  const policyLinks: FooterLink[] = [
    { label: policyLabels.terms, href: TERMS_PATH },
    { label: policyLabels.privacy, href: PRIVACY_PATH },
    { label: policyLabels.refund, href: REFUND_POLICY_PATH },
  ]

  return [
    ...navigationColumns,
    {
      title: footerPolicyColumnTitles[locale],
      links: policyLinks,
    },
  ]
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
