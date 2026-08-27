import { describe, it, expect } from 'vitest'
import {
  normalizeRegion,
  regionToLocale,
  regionToSuggestedPreset,
  regionToTimeZone,
  WELCOME_REGIONS,
} from './welcomePreferences'

describe('welcomePreferences', () => {
  it('regionToTimeZone: 지역별 IANA tz', () => {
    expect(regionToTimeZone('KR')).toBe('Asia/Seoul')
    expect(regionToTimeZone('US')).toBe('America/New_York')
    expect(regionToTimeZone('JP')).toBe('Asia/Tokyo')
    expect(regionToTimeZone('EU')).toBe('Europe/London')
    // OTHER는 브라우저 추정값(문자열)로 폴백
    expect(typeof regionToTimeZone('OTHER')).toBe('string')
    expect(regionToTimeZone('OTHER').length).toBeGreaterThan(0)
  })

  it('regionToLocale: 한국만 ko, 그 외 en', () => {
    expect(regionToLocale('KR')).toBe('ko')
    expect(regionToLocale('US')).toBe('en')
    expect(regionToLocale('EU')).toBe('en')
    expect(regionToLocale('JP')).toBe('en')
    expect(regionToLocale('OTHER')).toBe('en')
  })

  it('regionToSuggestedPreset: 한국은 지수선물, 그 외 표준', () => {
    expect(regionToSuggestedPreset('KR')).toBe('index')
    expect(regionToSuggestedPreset('US')).toBe('default')
  })

  it('WELCOME_REGIONS는 5종', () => {
    expect(WELCOME_REGIONS).toEqual(['KR', 'US', 'EU', 'JP', 'OTHER'])
  })

  it('normalizeRegion: 유효 지역만 통과, 나머지는 null(미선택)', () => {
    expect(normalizeRegion('KR')).toBe('KR')
    expect(normalizeRegion('JP')).toBe('JP')
    expect(normalizeRegion('OTHER')).toBe('OTHER')
    // 알 수 없는/빈/누락 값은 모두 null
    expect(normalizeRegion('XX')).toBe(null)
    expect(normalizeRegion('kr')).toBe(null) // 대소문자 구분
    expect(normalizeRegion('')).toBe(null)
    expect(normalizeRegion(null)).toBe(null)
    expect(normalizeRegion(undefined)).toBe(null)
  })
})
