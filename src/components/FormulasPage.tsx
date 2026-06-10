import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { FormulasContent } from './FormulasContent'
import { PageShell } from './PageShell'
import { SiteFooter } from './SiteFooter'

export function FormulasPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const f = t.formulas

  return (
    <PageShell>
      <div className="formulas-page">
        <header className="formulas-page__header">
          <h1 className="formulas-page__title">{f.title}</h1>
          <button
            type="button"
            className="formulas-page__close"
            onClick={() => navigate('/')}
            aria-label={t.close}
          >
            ×
          </button>
        </header>

        <FormulasContent formulas={f} variant="page" />
      </div>
      <SiteFooter />
    </PageShell>
  )
}
