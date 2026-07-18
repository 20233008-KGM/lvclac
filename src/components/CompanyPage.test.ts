import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/CompanyPage.tsx'), 'utf8')
const css = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8')
const operator = readFileSync(resolve('src/config/operator.ts'), 'utf8')

describe('public company page', () => {
  it('uses the footer-only public information shell and shared operator details', () => {
    expect(source).toContain('activePath={null}')
    expect(source).toContain('showNavigation={false}')
    expect(source).toContain('publicFooterOperatorDetails(locale)')
    expect(source).toContain('PUBLIC_OPERATOR_INFO.contactEmail')
    expect(source).toContain('href={ABOUT_PATH}')
  })

  it('separates the company mission, product, principles, and leadership in both locales', () => {
    expect(source).toContain('복잡한 금융 계산을 더 명확한 도구로 만듭니다')
    expect(source).toContain(
      'We make complex financial calculations easier to understand.',
    )
    expect(source).toContain("problemTitle: '우리가 푸는 문제'")
    expect(source).toContain("productTitle: '우리가 만드는 것'")
    expect(source).toContain("principlesTitle: '제품을 만드는 기준'")
    expect(source).toContain("makerTitle: '만드는 사람'")
    expect(source).toContain("title: '명확한 근거'")
    expect(source).toContain("title: '사용자의 선택'")
    expect(source).toContain("title: '작고 완성도 높게'")
    expect(source).toContain("makerRole: '대표'")
    expect(source).toContain("makerRole: 'CEO'")
  })

  it('shares localized representative names with the company grid and footer', () => {
    expect(source).toContain('publicRepresentativeDisplayName(locale)')
    expect(operator).toContain("ko: '김규민'")
    expect(operator).toContain("en: 'Gyumin Kim'")
    expect(operator).toContain('publicRepresentativeDisplayName(locale, operator)')
  })

  it('renders the six company details as a three-column desktop grid', () => {
    expect(source).toContain('company-details__grid')
    expect(css).toMatch(
      /\.public-info-zone \.company-details__grid \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.public-info-zone \.company-details__grid \{[\s\S]*?grid-template-columns: 1fr;/,
    )
  })

  it('uses two editorial columns and three principle columns on desktop, then one column on mobile', () => {
    expect(css).toMatch(
      /\.public-info-zone \.company-editorial \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /\.public-info-zone \.company-principles__list \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.public-info-zone \.company-editorial,[\s\S]*?\.public-info-zone \.company-principles__list \{[\s\S]*?grid-template-columns: 1fr;/,
    )
  })

  it('publishes the company URL in the sitemap', () => {
    expect(sitemap).toContain('<loc>https://liqguard.com/company</loc>')
  })
})
