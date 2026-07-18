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

  it('separates the company mission, direction, principles, current product, and leadership in both locales', () => {
    expect(source).toContain('소수에게, 오래 쓰이는 소프트웨어를')
    expect(source).toContain(
      'Software made to last for the people who need it.',
    )
    expect(source).toContain("workTitle: '우리가 하는 일'")
    expect(source).toContain("directionTitle: '우리가 향하는 곳'")
    expect(source).toContain("principlesTitle: '제품을 만드는 방식'")
    expect(source).toContain("currentProductTitle: '현재 만드는 제품'")
    expect(source).toContain("makerTitle: '만드는 사람'")
    expect(source).toContain("title: '필요한 문제부터'")
    expect(source).toContain("title: '넓이보다 깊이'")
    expect(source).toContain("title: '있는 것을 더 좋게'")
    expect(source).toContain('금융 도구에만 머무르지 않고')
    expect(source).toContain('서로 다른 분야에서 오래 남는 소프트웨어')
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
