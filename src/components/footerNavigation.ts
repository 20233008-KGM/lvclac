import { GUIDE_PATH, PRICING_PATH, PRIVACY_PATH, REFUND_POLICY_PATH, TERMS_PATH } from '../config/routes'
import type { Locale, Messages } from '../i18n'

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
