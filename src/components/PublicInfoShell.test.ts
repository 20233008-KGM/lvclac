import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_INFO_PATHS,
  publicInfoAriaCurrent,
  publicInfoNavigation,
} from './publicInfoNavigation'

const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')

describe('public information shell navigation', () => {
  it('keeps the same five routes in Korean and English', () => {
    expect(publicInfoNavigation('ko').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
    expect(publicInfoNavigation('en').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
  })

  it('provides localized labels for every route', () => {
    expect(publicInfoNavigation('ko').map((item) => item.label)).toEqual([
      '서비스 소개',
      '사용 가이드',
      '수식 정의',
      '이용약관',
      '개인정보',
    ])
    expect(publicInfoNavigation('en').map((item) => item.label)).toEqual([
      'About',
      'User guide',
      'Formulas',
      'Terms',
      'Privacy',
    ])
  })

  it('marks only the active route as the current page', () => {
    expect(publicInfoAriaCurrent('/about', '/about')).toBe('page')
    expect(publicInfoAriaCurrent('/guide', '/about')).toBeUndefined()
  })

  it('shares the legal gradient, legal width, and stable localized hero heights', () => {
    expect(pagesCss).toMatch(
      /\.public-info-zone\s*{[^}]*--public-info-accent:\s*color-mix\(in srgb, var\(--color-primary\) 64%, var\(--color-text-muted\) 36%\);/s,
    )
    expect(pagesCss).not.toMatch(/\.public-info-zone\[data-info-tone=/)
    expect(pagesCss).toMatch(/\.public-info-zone \.page-content\s*{[^}]*max-width:\s*920px;/s)
    expect(pagesCss).toMatch(
      /\.public-info-document::before\s*{[^}]*top:\s*-1px;[^}]*width:\s*min\(210px, 32%\);[^}]*background:\s*linear-gradient\(90deg, var\(--color-primary\), transparent\);/s,
    )
    expect(pagesCss).toMatch(/\.public-info-hero\s*{[^}]*min-height:\s*264px;/s)
    expect(pagesCss).toMatch(/html\[lang='en'\] \.public-info-hero\s*{[^}]*min-height:\s*340px;/s)
    expect(pagesCss).toMatch(
      /@media \(max-width: 520px\)[\s\S]*\.public-info-hero\s*{[^}]*min-height:\s*280px;/,
    )
  })
})
