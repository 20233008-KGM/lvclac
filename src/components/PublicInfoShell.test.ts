import { describe, expect, it } from 'vitest'
import {
  PUBLIC_INFO_PATHS,
  publicInfoAriaCurrent,
  publicInfoNavigation,
} from './publicInfoNavigation'

describe('public information shell navigation', () => {
  it('keeps the same five routes in Korean and English', () => {
    expect(publicInfoNavigation('ko').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
    expect(publicInfoNavigation('en').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
  })

  it('provides localized labels for every route', () => {
    expect(publicInfoNavigation('ko').map((item) => item.label)).toEqual([
      '사용 가이드',
      '수식 정의',
      '서비스 소개',
      '이용약관',
      '개인정보',
    ])
    expect(publicInfoNavigation('en').map((item) => item.label)).toEqual([
      'User guide',
      'Formulas',
      'About',
      'Terms',
      'Privacy',
    ])
  })

  it('marks only the active route as the current page', () => {
    expect(publicInfoAriaCurrent('/about', '/about')).toBe('page')
    expect(publicInfoAriaCurrent('/guide', '/about')).toBeUndefined()
  })
})
