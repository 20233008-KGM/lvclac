import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  PUBLIC_INFO_PATHS,
  publicInfoAriaCurrent,
  publicInfoNavigation,
} from './publicInfoNavigation'

const pagesCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const shellSource = readFileSync(resolve('src/components/PublicInfoShell.tsx'), 'utf8')
const legalSource = readFileSync(resolve('src/components/PublicLegalPage.tsx'), 'utf8')

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
    expect(publicInfoAriaCurrent('/guide', null)).toBeUndefined()
  })

  it('shares the legal gradient, legal width, and stable localized hero heights', () => {
    expect(pagesCss).toMatch(
      /\.public-info-zone\s*{[^}]*--public-info-accent:\s*color-mix\(in srgb, var\(--color-primary\) 64%, var\(--color-text-muted\) 36%\);/s,
    )
    expect(pagesCss).not.toMatch(/\.public-info-zone\[data-info-tone=/)
    expect(pagesCss).toMatch(/\.public-info-standalone\s*{[^}]*width:\s*min\(920px,/s)
    expect(pagesCss).toMatch(
      /\.public-info-document::before\s*{[^}]*top:\s*-1px;[^}]*width:\s*min\(210px, 32%\);[^}]*background:\s*linear-gradient\(90deg, var\(--color-primary\), transparent\);/s,
    )
    expect(pagesCss).toMatch(/\.public-info-hero\s*{[^}]*min-height:\s*264px;/s)
    expect(pagesCss).toMatch(/html\[lang='en'\] \.public-info-hero\s*{[^}]*min-height:\s*340px;/s)
    expect(pagesCss).toMatch(
      /@media \(max-width: 520px\)[\s\S]*\.public-info-hero\s*{[^}]*min-height:\s*280px;/,
    )
  })

  it('aligns the footer edges with the public document shell', () => {
    expect(pagesCss).toMatch(
      /\.public-info-zone \.site-footer\s*{[^}]*width:\s*100%;[^}]*margin-top:\s*var\(--space-xl\);[^}]*margin-inline:\s*0;/s,
    )
  })

  it('reuses the header back-link component at the end of legal documents', () => {
    expect(shellSource).toContain('export function BackToCalculatorLink')
    expect(shellSource).toContain('<BackToCalculatorLink />')
    expect(legalSource).toContain('<BackToCalculatorLink className="public-legal-home" />')
    expect(legalSource).not.toContain('className="btn btn-primary public-legal-home"')
    expect(pagesCss).toMatch(/\.public-info-zone \.public-legal-home\s*{[^}]*align-self:\s*flex-end;/s)
  })
})
