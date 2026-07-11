import type { Locale, PresetId } from '../i18n'

/** 지역 파생 자동스냅샷 시간대 기본값(localStorage, IANA tz 문자열). */
export const SNAPSHOT_TZ_KEY = 'leverage_snapshot_timezone'

/** 환영 플로우 "지역" 선택지. 언어·기본 프리셋·자동스냅샷 시간대 기본값을 파생한다. */
export type WelcomeRegion = 'KR' | 'US' | 'EU' | 'JP' | 'OTHER'

export const WELCOME_REGIONS: readonly WelcomeRegion[] = ['KR', 'US', 'EU', 'JP', 'OTHER']

/** 브라우저 추정 시간대(자동스냅샷 폼과 동일 로직, 공용화). */
export function suggestedBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** 지역 → 자동스냅샷 시간대 기본값. 알 수 없는 지역은 브라우저 추정값. */
export function regionToTimeZone(region: WelcomeRegion): string {
  switch (region) {
    case 'KR':
      return 'Asia/Seoul'
    case 'US':
      return 'America/New_York'
    case 'EU':
      return 'Europe/London'
    case 'JP':
      return 'Asia/Tokyo'
    default:
      return suggestedBrowserTimeZone()
  }
}

/** 지역 → 화면 언어(한국만 ko, 그 외 en). detectLocale의 localeFromCountry와 동형. */
export function regionToLocale(region: WelcomeRegion): Locale {
  return region === 'KR' ? 'ko' : 'en'
}

/** 지역 → 기본 추천 프리셋(거래 종목 단계의 초기 선택값). 한국은 지수선물, 그 외는 표준. */
export function regionToSuggestedPreset(region: WelcomeRegion): PresetId {
  return region === 'KR' ? 'index' : 'default'
}

export function readPreferredSnapshotTimeZone(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(SNAPSHOT_TZ_KEY)
  } catch {
    return null
  }
}

export function writePreferredSnapshotTimeZone(tz: string): void {
  try {
    localStorage.setItem(SNAPSHOT_TZ_KEY, tz)
  } catch {
    // ignore
  }
}
