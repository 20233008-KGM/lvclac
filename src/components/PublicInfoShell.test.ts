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
const guideSource = readFileSync(resolve('src/components/GuidePage.tsx'), 'utf8')
const formulasSource = readFileSync(resolve('src/components/FormulasPage.tsx'), 'utf8')
const aboutSource = readFileSync(resolve('src/components/AboutPage.tsx'), 'utf8')
const legalSource = readFileSync(resolve('src/components/PaddleReviewPages.tsx'), 'utf8')

describe('dev public information shell navigation', () => {
  it('keeps the same five routes and order in Korean and English', () => {
    expect(publicInfoNavigation('ko').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
    expect(publicInfoNavigation('en').map((item) => item.path)).toEqual(PUBLIC_INFO_PATHS)
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

  it('marks only the active document as the current page', () => {
    expect(publicInfoAriaCurrent('/about', '/about')).toBe('page')
    expect(publicInfoAriaCurrent('/guide', '/about')).toBeUndefined()
    expect(publicInfoAriaCurrent('/guide', null)).toBeUndefined()
  })

  it('routes all five documents through the shared shell without replacing refund', () => {
    expect(guideSource).toContain('<PublicInfoShell')
    expect(formulasSource).toContain('<PublicInfoShell')
    expect(aboutSource).toContain('<PublicInfoShell')
    expect(guideSource).not.toContain('<PageShell')
    expect(formulasSource).not.toContain('<PageShell')
    expect(legalSource).toContain("if (kind === 'terms' || kind === 'privacy')")
    expect(legalSource).toContain("const activePath = kind === 'terms' ? TERMS_PATH : PRIVACY_PATH")
    expect(legalSource).toContain('<PublicPageShell')
  })

  it('preserves the dev sign-in entry and footer inside the imported shell', () => {
    expect(shellSource).toContain('<AuthButton variant="header" />')
    expect(shellSource).toContain('<SiteFooter />')
    expect(shellSource).toContain("data-info-navigation={showNavigation ? 'visible' : 'hidden'}")
    expect(shellSource).toContain('{showNavigation && (')
  })

  it('supports footer-only documents without adding them to the five-page navigator', () => {
    expect(shellSource).toContain('activePath: PublicInfoPath | null')
    expect(shellSource).toContain('showNavigation?: boolean')
    expect(PUBLIC_INFO_PATHS).not.toContain('/company')
    expect(pagesCss).toMatch(
      /\.public-info-document\[data-info-navigation='hidden'\] \.public-info-hero \{[^}]*min-height: 0;/s,
    )
  })

  it('uses the 920px document frame and responsive five-item navigator', () => {
    expect(pagesCss).toMatch(/\.public-info-standalone\s*{[^}]*width:\s*min\(920px,/s)
    expect(pagesCss).toMatch(
      /\.public-info-nav__list\s*{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\);/s,
    )
    expect(pagesCss).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.public-info-nav__list\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
    )
    expect(pagesCss).toMatch(
      /\.public-info-zone \.site-footer\s*{[^}]*width:\s*100%;[^}]*margin-top:\s*var\(--space-xl\);[^}]*margin-inline:\s*0;/s,
    )
  })
})
