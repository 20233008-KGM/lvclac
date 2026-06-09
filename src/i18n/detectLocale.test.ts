import { describe, expect, it } from 'vitest'
import { localeFromBrowserLanguage, localeFromCountry } from './detectLocale'

describe('localeFromCountry', () => {
  it('maps KR to Korean', () => {
    expect(localeFromCountry('KR')).toBe('ko')
  })

  it('maps other countries to English', () => {
    expect(localeFromCountry('US')).toBe('en')
    expect(localeFromCountry('JP')).toBe('en')
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
