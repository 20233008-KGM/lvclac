import type { Locale } from './types'

export const STORAGE_KEY = 'leverage_locale'
export const SESSION_DETECTED_KEY = 'leverage_locale_detected'
export const GEO_COOKIE = 'leverage_geo_country'

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function localeFromCountry(country: string): Locale {
  return country === 'KR' ? 'ko' : 'en'
}

export function localeFromBrowserLanguage(language: string): Locale {
  return language.startsWith('ko') ? 'ko' : 'en'
}

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'ko'

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'ko') return stored

  const sessionDetected = sessionStorage.getItem(SESSION_DETECTED_KEY)
  if (sessionDetected === 'en' || sessionDetected === 'ko') return sessionDetected

  const country = getCookie(GEO_COOKIE)
  if (country) {
    const locale = localeFromCountry(country)
    sessionStorage.setItem(SESSION_DETECTED_KEY, locale)
    return locale
  }

  return localeFromBrowserLanguage(navigator.language)
}

export function shouldFetchGeo(): boolean {
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(STORAGE_KEY)) return false
  if (getCookie(GEO_COOKIE)) return false
  if (sessionStorage.getItem(SESSION_DETECTED_KEY)) return false
  return true
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
