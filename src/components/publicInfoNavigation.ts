import {
  ABOUT_PATH,
  FORMULAS_PATH,
  GUIDE_PATH,
  PRIVACY_PATH,
  TERMS_PATH,
  localizedPublicPath,
  publicPathWithoutLocale,
} from '../config/routes'
import type { Locale } from '../i18n'

export const PUBLIC_INFO_PATHS = [
  ABOUT_PATH,
  GUIDE_PATH,
  FORMULAS_PATH,
  TERMS_PATH,
  PRIVACY_PATH,
] as const

export type PublicInfoPath = (typeof PUBLIC_INFO_PATHS)[number]

interface PublicInfoNavigationItem {
  path: string
  label: string
}

const navigationCopy: Record<Locale, readonly PublicInfoNavigationItem[]> = {
  ko: [
    { path: ABOUT_PATH, label: '서비스 소개' },
    { path: GUIDE_PATH, label: '사용 가이드' },
    { path: FORMULAS_PATH, label: '수식 정의' },
    { path: TERMS_PATH, label: '이용약관' },
    { path: PRIVACY_PATH, label: '개인정보' },
  ],
  en: [
    { path: ABOUT_PATH, label: 'About' },
    { path: GUIDE_PATH, label: 'User guide' },
    { path: FORMULAS_PATH, label: 'Formulas' },
    { path: TERMS_PATH, label: 'Terms' },
    { path: PRIVACY_PATH, label: 'Privacy' },
  ],
}

export function publicInfoNavigation(locale: Locale) {
  return navigationCopy[locale].map((item) => ({
    ...item,
    path: localizedPublicPath(item.path, locale),
  }))
}

export function publicInfoAriaCurrent(
  path: string,
  activePath: PublicInfoPath | null,
): 'page' | undefined {
  return publicPathWithoutLocale(path) === activePath ? 'page' : undefined
}
