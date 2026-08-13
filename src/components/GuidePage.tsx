import { GUIDE_PATH } from '../config/routes'
import { useLanguage } from '../i18n'
import { GuideContent } from './GuideContent'
import { PublicInfoShell } from './PublicInfoShell'
import { PublicDocumentNext } from './PublicSeoContent'

export function GuidePage() {
  const { t } = useLanguage()

  return (
    <PublicInfoShell
      activePath={GUIDE_PATH}
      tone="product-doc"
      eyebrow="LiqGuard · Guide"
      title={t.guide.title}
      lead={t.guide.description}
    >
      <GuideContent guide={t.guide} />
      <PublicDocumentNext current="guide" />
    </PublicInfoShell>
  )
}
