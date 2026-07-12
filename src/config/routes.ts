export const FORMULAS_PATH = '/formulas'
export const GUIDE_PATH = '/guide'
export const ABOUT_PATH = '/about'
export const MY_PAGE_PATH = '/my'
export const RECORDS_PATH = '/records'
export const ADMIN_FEEDBACK_PATH = '/admin/feedback'
export const PRODUCT_PATH = '/product'
export const PRICING_PATH = '/pricing'
export const TERMS_PATH = '/terms'
export const PRIVACY_PATH = '/privacy'
export const REFUND_POLICY_PATH = '/refund-policy'

export type LegalPageKind = 'terms' | 'privacy' | 'refund'

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname === `${path}/`
}

export function isFormulasPath(pathname: string): boolean {
  return matchesPath(pathname, FORMULAS_PATH)
}

export function isGuidePath(pathname: string): boolean {
  return matchesPath(pathname, GUIDE_PATH)
}

export function isAboutPath(pathname: string): boolean {
  return matchesPath(pathname, ABOUT_PATH)
}

export function isMyPagePath(pathname: string): boolean {
  return matchesPath(pathname, MY_PAGE_PATH)
}

export function isRecordsPath(pathname: string): boolean {
  return matchesPath(pathname, RECORDS_PATH)
}

export function isAdminFeedbackPath(pathname: string): boolean {
  return matchesPath(pathname, ADMIN_FEEDBACK_PATH)
}

export function isProductPath(pathname: string): boolean {
  return matchesPath(pathname, PRODUCT_PATH)
}

export function isPricingPath(pathname: string): boolean {
  return matchesPath(pathname, PRICING_PATH)
}

export function isLegalPath(pathname: string): LegalPageKind | null {
  if (matchesPath(pathname, TERMS_PATH)) return 'terms'
  if (matchesPath(pathname, PRIVACY_PATH)) return 'privacy'
  if (matchesPath(pathname, REFUND_POLICY_PATH)) return 'refund'
  return null
}

/** 개발 전용 컴포넌트 전시장(UI 키트) — Figma export용. import.meta.env.DEV에서만 라우팅됨. */
export const KIT_PATH = '/kit'

export function isKitPath(pathname: string): boolean {
  return matchesPath(pathname, KIT_PATH)
}
