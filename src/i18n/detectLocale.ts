import type { Locale } from './types'

export const STORAGE_KEY = 'leverage_locale'
export const SESSION_DETECTED_KEY = 'leverage_locale_detected'
export const GEO_COOKIE = 'leverage_geo_country'

export type LocaleDetectionSource =
  | 'url'
  | 'stored'
  | 'session'
  | 'country'
  | 'browser'

export interface LocaleDetectionSignals {
  urlLocale?: string | null
  storedLocale?: string | null
  sessionLocale?: string | null
  country?: string | null
  browserLanguage?: string | null
}

export interface LocaleDetectionResult {
  locale: Locale
  source: LocaleDetectionSource
}

function supportedLocale(value: string | null | undefined): Locale | null {
  return value === 'en' || value === 'ko' ? value : null
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function localeFromCountry(country: string): Locale {
  return country.trim().toUpperCase() === 'KR' ? 'ko' : 'en'
}

export function localeFromBrowserLanguage(language: string): Locale {
  return language.trim().toLowerCase().startsWith('ko') ? 'ko' : 'en'
}

/**
 * 언어 자동 감지의 단일 우선순위 계약.
 * 브라우저 전역과 분리해 국가·저장값 충돌 조합을 결정적으로 테스트한다.
 */
export function resolveLocale(signals: LocaleDetectionSignals): LocaleDetectionResult {
  const urlLocale = supportedLocale(signals.urlLocale)
  if (urlLocale) return { locale: urlLocale, source: 'url' }

  const storedLocale = supportedLocale(signals.storedLocale)
  if (storedLocale) return { locale: storedLocale, source: 'stored' }

  const sessionLocale = supportedLocale(signals.sessionLocale)
  if (sessionLocale) return { locale: sessionLocale, source: 'session' }

  if (signals.country?.trim()) {
    return { locale: localeFromCountry(signals.country), source: 'country' }
  }

  return {
    locale: localeFromBrowserLanguage(signals.browserLanguage ?? ''),
    source: 'browser',
  }
}

export function shouldFetchGeoFromSignals(signals: LocaleDetectionSignals): boolean {
  return !(
    supportedLocale(signals.urlLocale) ||
    supportedLocale(signals.storedLocale) ||
    supportedLocale(signals.sessionLocale) ||
    signals.country?.trim()
  )
}

/** URL 쿼리 ?lang=en|ko 로 명시된 언어. UI 키트 export 등에서 언어를 결정적으로 고정할 때 사용. */
export function localeFromUrlParam(): Locale | null {
  if (typeof window === 'undefined') return null
  const lang = new URLSearchParams(window.location.search).get('lang')
  return lang === 'en' || lang === 'ko' ? lang : null
}

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ko'

  const result = resolveLocale({
    urlLocale: localeFromUrlParam(),
    storedLocale: localStorage.getItem(STORAGE_KEY),
    sessionLocale: sessionStorage.getItem(SESSION_DETECTED_KEY),
    country: getCookie(GEO_COOKIE),
    browserLanguage: navigator.language,
  })

  if (result.source === 'country') {
    sessionStorage.setItem(SESSION_DETECTED_KEY, result.locale)
  }
  return result.locale
}

export function shouldFetchGeo(): boolean {
  if (typeof window === 'undefined') return false
  return shouldFetchGeoFromSignals({
    urlLocale: localeFromUrlParam(),
    storedLocale: localStorage.getItem(STORAGE_KEY),
    sessionLocale: sessionStorage.getItem(SESSION_DETECTED_KEY),
    country: getCookie(GEO_COOKIE),
  })
}

export async function fetchGeoLocale(): Promise<Locale | null> {
  try {
    const res = await fetch('https://ipapi.co/country_code/', {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const country = (await res.text()).trim()
    if (!country) return null
    return localeFromCountry(country)
  } catch {
    return null
  }
}
