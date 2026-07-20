import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/CompanyPage.tsx'), 'utf8')
const app = readFileSync(resolve('src/App.tsx'), 'utf8')
const css = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const operator = readFileSync(resolve('src/config/operator.ts'), 'utf8')
const footer = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')

describe('dev company page', () => {
  it('uses the footer-only public information shell without repeating legal details', () => {
    expect(source).toContain('activePath={null}')
    expect(source).toContain('showNavigation={false}')
    expect(source).not.toContain('publicFooterOperatorDetails(locale)')
    expect(source).not.toContain('company-details__grid')
    expect(source).toContain('PUBLIC_OPERATOR_INFO.contactEmail')
    expect(source).toContain('href={ABOUT_PATH}')
  })

  it('routes the independent company document through the dev app', () => {
    expect(app).toContain('isCompanyPath')
    expect(app).toContain("import('./components/CompanyPage')")
    expect(app).toContain('<CompanyPage />')
  })

  it('separates the company mission, direction, principles, product, and stewardship in both locales', () => {
    expect(source).toContain('소수에게, 오래 쓰이는 소프트웨어를')
    expect(source).toContain('Software made to last for the people who need it.')
    expect(source).toContain("workTitle: '우리가 하는 일'")
    expect(source).toContain("directionTitle: '우리가 향하는 곳'")
    expect(source).toContain("principlesTitle: '제품을 만드는 방식'")
    expect(source).toContain("stewardshipTitle: '운영과 책임'")
    expect(source).toContain("stewardshipTitle: 'Ownership and responsibility'")
    expect(source).toContain('aria-label={PUBLIC_OPERATOR_INFO.productName}')
    expect(source).toContain("makerRole: '대표'")
    expect(source).toContain("makerRole: 'CEO'")
  })

  it('shares localized representative names and keeps the six legal details in the footer', () => {
    expect(source).toContain('publicRepresentativeDisplayName(locale)')
    expect(operator).toContain("ko: '김규민'")
    expect(operator).toContain("en: 'Gyumin Kim'")
    expect(footer).toContain('publicFooterOperatorDetails(locale)')
    expect(footer).toContain('site-footer__operator')
    expect(source).not.toContain('operatorDetails.map')
  })

  it('uses desktop editorial grids and collapses them to one column on mobile', () => {
    expect(css).toMatch(
      /\.public-info-zone \.company-editorial \{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /\.public-info-zone \.company-principles__list \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /@media \(max-width: 720px\)[\s\S]*?\.public-info-zone \.company-editorial,[\s\S]*?\.public-info-zone \.company-principles__list \{[\s\S]*?grid-template-columns: 1fr;/,
    )
    expect(css).toMatch(
      /@media \(max-width: 520px\)[\s\S]*?\.public-info-zone \.company-current-product,[\s\S]*?\.public-info-zone \.company-stewardship \{[\s\S]*?grid-template-columns: 1fr;/,
    )
  })
})
