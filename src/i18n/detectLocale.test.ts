import { describe, expect, it } from 'vitest'
import {
  localeFromBrowserLanguage,
  localeFromCountry,
  localeFromPathname,
  resolveLocale,
  shouldFetchGeoFromSignals,
  type LocaleDetectionSignals,
} from './detectLocale'

describe('localeFromCountry', () => {
  it('maps KR to Korean', () => {
    expect(localeFromCountry('KR')).toBe('ko')
  })

  it('maps other countries to English', () => {
    expect(localeFromCountry('US')).toBe('en')
    expect(localeFromCountry('JP')).toBe('en')
  })

  it('normalizes country codes returned by external providers', () => {
    expect(localeFromCountry(' kr ')).toBe('ko')
  })
})

describe('localeFromBrowserLanguage', () => {
  it('maps Korean browser languages to Korean', () => {
    expect(localeFromBrowserLanguage('ko-KR')).toBe('ko')
    expect(localeFromBrowserLanguage('ko')).toBe('ko')
  })

  it('maps other browser languages to English', () => {
    expect(localeFromBrowserLanguage('en-US')).toBe('en')
    expect(localeFromBrowserLanguage('ja')).toBe('en')
  })
})

describe('locale detection priority', () => {
  const allSignals: LocaleDetectionSignals = {
    urlLocale: 'en',
    pathLocale: 'ko',
    storedLocale: 'ko',
    sessionLocale: 'en',
    country: 'KR',
    browserLanguage: 'ko-KR',
  }

  it.each([
    ['URL override', allSignals, 'en', 'url'],
    [
      'manual choice',
      { ...allSignals, urlLocale: null, pathLocale: null },
      'ko',
      'stored',
    ],
    [
      'session detection',
      { ...allSignals, urlLocale: null, pathLocale: null, storedLocale: null },
      'en',
      'session',
    ],
    [
      'country cookie',
      {
        ...allSignals,
        urlLocale: null,
        pathLocale: null,
        storedLocale: null,
        sessionLocale: null,
      },
      'ko',
      'country',
    ],
    [
      'browser fallback',
      {
        urlLocale: null,
        pathLocale: null,
        storedLocale: null,
        sessionLocale: null,
        country: null,
        browserLanguage: 'ko-KR',
      },
      'ko',
      'browser',
    ],
  ] as const)('uses %s at the expected priority', (_label, signals, locale, source) => {
    expect(resolveLocale(signals)).toEqual({ locale, source })
  })

  it('uses the stable route locale before stored or geographic signals', () => {
    expect(resolveLocale({ ...allSignals, urlLocale: null })).toEqual({
      locale: 'ko',
      source: 'path',
    })
  })

  it('ignores invalid stored and query values instead of treating them as choices', () => {
    expect(
      resolveLocale({
        urlLocale: 'de',
        storedLocale: 'ja',
        sessionLocale: 'en',
        country: 'KR',
        browserLanguage: 'ko-KR',
      }),
    ).toEqual({ locale: 'en', source: 'session' })
  })
})

describe('geo lookup eligibility', () => {
  it.each([
    ['URL override', { urlLocale: 'en' }],
    ['localized route', { pathLocale: 'en' }],
    ['manual choice', { storedLocale: 'ko' }],
    ['session detection', { sessionLocale: 'en' }],
    ['country cookie', { country: 'KR' }],
  ] as const)('does not fetch after %s exists', (_label, signals) => {
    expect(shouldFetchGeoFromSignals(signals)).toBe(false)
  })

  it('fetches only when no stronger signal exists', () => {
    expect(shouldFetchGeoFromSignals({ browserLanguage: 'en-US' })).toBe(true)
  })

  it('treats an invalid stored locale as absent', () => {
    expect(shouldFetchGeoFromSignals({ storedLocale: 'ja' })).toBe(true)
  })
})

describe('localeFromPathname', () => {
  it('maps the English prefix to English and unprefixed public URLs to Korean', () => {
    expect(localeFromPathname('/en')).toBe('en')
    expect(localeFromPathname('/en/guide')).toBe('en')
    expect(localeFromPathname('/')).toBe('ko')
    expect(localeFromPathname('/guide')).toBe('ko')
  })
})
