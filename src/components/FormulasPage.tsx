import { FORMULAS_PATH } from '../config/routes'
import { useLanguage } from '../i18n'
import { FormulasContent } from './FormulasContent'
import { PublicInfoShell } from './PublicInfoShell'

export function FormulasPage() {
  const { t } = useLanguage()
  const f = t.formulas

  return (
    <PublicInfoShell
      activePath={FORMULAS_PATH}
      tone="product-doc"
      eyebrow="LiqGuard · Reference"
      title={f.title}
      lead={f.description}
    >
      <FormulasContent formulas={f} variant="page" />
    </PublicInfoShell>
  )
}
