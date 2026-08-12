export const FORMULAS_PATH = '/formulas'
export const GUIDE_PATH = '/guide'
export const ABOUT_PATH = '/about'
export const COMPANY_PATH = '/company'
export const CONTACT_PATH = '/contact'
export const UPDATES_PATH = '/updates'
export const MY_PAGE_PATH = '/my'
export const BILLING_PATH = '/billing'
export const RECORDS_PATH = '/records'
export const ADMIN_FEEDBACK_PATH = '/admin/feedback'
export const PRODUCT_PATH = '/product'
export const PRICING_PATH = '/pricing'
export const TERMS_PATH = '/terms'
export const PRIVACY_PATH = '/privacy'
export const REFUND_POLICY_PATH = '/refund-policy'
export const ENGLISH_PATH_PREFIX = '/en'

export type LegalPageKind = 'terms' | 'privacy' | 'refund'

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname === `${path}/`
}

export function isEnglishPublicPath(pathname: string): boolean {
  return pathname === ENGLISH_PATH_PREFIX
    || pathname === `${ENGLISH_PATH_PREFIX}/`
    || pathname.startsWith(`${ENGLISH_PATH_PREFIX}/`)
}

export function publicPathWithoutLocale(pathname: string): string {
  if (pathname === ENGLISH_PATH_PREFIX || pathname === `${ENGLISH_PATH_PREFIX}/`) {
    return '/'
  }
  if (pathname.startsWith(`${ENGLISH_PATH_PREFIX}/`)) {
    return pathname.slice(ENGLISH_PATH_PREFIX.length) || '/'
  }
  return pathname
}

export function localizedPublicPath(pathname: string, locale: 'ko' | 'en'): string {
  const basePath = publicPathWithoutLocale(pathname)
  const normalized = basePath !== '/' ? basePath.replace(/\/$/, '') : '/'
  if (locale === 'ko') return normalized
  return normalized === '/' ? ENGLISH_PATH_PREFIX : `${ENGLISH_PATH_PREFIX}${normalized}`
}

export function isCalculatorHomePath(pathname: string): boolean {
  return matchesPath(publicPathWithoutLocale(pathname), '/')
}

function matchesLocalizedPublicPath(pathname: string, path: string): boolean {
  return matchesPath(publicPathWithoutLocale(pathname), path)
}

export function isFormulasPath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, FORMULAS_PATH)
}

export function isGuidePath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, GUIDE_PATH)
}

export function isAboutPath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, ABOUT_PATH)
}

export function isCompanyPath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, COMPANY_PATH)
}

export function isContactPath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, CONTACT_PATH)
}

export function isUpdatesPath(pathname: string): boolean {
  return matchesLocalizedPublicPath(pathname, UPDATES_PATH)
}

export function isAdFreePublicInfoPath(pathname: string): boolean {
  return (
    isGuidePath(pathname) ||
    isFormulasPath(pathname) ||
    isAboutPath(pathname) ||
    isCompanyPath(pathname) ||
    isContactPath(pathname) ||
    isUpdatesPath(pathname) ||
    isPricingPath(pathname) ||
    matchesLocalizedPublicPath(pathname, TERMS_PATH) ||
    matchesLocalizedPublicPath(pathname, PRIVACY_PATH) ||
    matchesLocalizedPublicPath(pathname, REFUND_POLICY_PATH)
  )
}

export function isMyPagePath(pathname: string): boolean {
  return matchesPath(pathname, MY_PAGE_PATH)
}

export function isBillingPath(pathname: string): boolean {
  return matchesPath(pathname, BILLING_PATH)
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
  return matchesLocalizedPublicPath(pathname, PRICING_PATH)
}

export function isLegalPath(pathname: string): LegalPageKind | null {
  if (matchesLocalizedPublicPath(pathname, TERMS_PATH)) return 'terms'
  if (matchesLocalizedPublicPath(pathname, PRIVACY_PATH)) return 'privacy'
  if (matchesLocalizedPublicPath(pathname, REFUND_POLICY_PATH)) return 'refund'
  return null
}

/** 컴포넌트 전시장(UI 키트) — Figma export용. 미링크·noindex, 정식 공개 전 제거/재게이팅 예정. */
export const KIT_PATH = '/kit'

export function isKitPath(pathname: string): boolean {
  return matchesPath(pathname, KIT_PATH)
}
