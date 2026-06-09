import { useLanguage } from '../i18n'
import { LegalLinks } from './ServiceDisclaimer'

export function SiteFooter() {
  const { t } = useLanguage()

  return (
    <footer className="site-footer">
      <LegalLinks />
      <p className="site-footer-tagline">{t.footer.tagline}</p>
      <div className="site-footer-row">
        <span className="site-footer-copy">{t.footer.copyright}</span>
      </div>
    </footer>
  )
}
