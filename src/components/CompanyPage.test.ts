import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/CompanyPage.tsx'), 'utf8')
const css = readFileSync(resolve('src/styles/pages.css'), 'utf8')
const sitemap = readFileSync(resolve('public/sitemap.xml'), 'utf8')

describe('public company page', () => {
  it('uses the footer-only public information shell and shared operator details', () => {
    expect(source).toContain('activePath={null}')
    expect(source).toContain('showNavigation={false}')
    expect(source).toContain('publicFooterOperatorDetails(locale)')
    expect(source).toContain('PUBLIC_OPERATOR_INFO.contactEmail')
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

  it('publishes the company URL in the sitemap', () => {
    expect(sitemap).toContain('<loc>https://liqguard.com/company</loc>')
  })
})
