import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { GuideContent } from './GuideContent'
import { PageShell } from './PageShell'
import { SiteFooter } from './SiteFooter'
import '../styles/pages.css'

export function GuidePage() {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <PageShell>
      <div className="guide-page formulas-page">
        <header className="formulas-page__header">
          <h1 className="formulas-page__title">{t.guide.title}</h1>
          <button
            type="button"
            className="formulas-page__close"
            onClick={() => navigate('/')}
            aria-label={t.close}
          >
            ×
          </button>
        </header>

        <GuideContent guide={t.guide} />
      </div>
      <SiteFooter />
    </PageShell>
  )
}
