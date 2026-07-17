import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

describe('public-lite footer links', () => {
  it('publishes the product, company, and legal destinations', () => {
    expect(source).toContain("{ label: '선물 계산기', href: '/' }")
    expect(source).toContain("{ label: '사용 가이드', href: GUIDE_PATH }")
    expect(source).toContain("{ label: '수식 정의', href: FORMULAS_PATH }")
    expect(source).toContain("{ label: '서비스 소개', href: ABOUT_PATH }")
    expect(source).toContain("label: '문의하기'")
    expect(source).toContain("{ label: '이용약관', href: TERMS_PATH }")
    expect(source).toContain("{ label: '개인정보처리방침', href: PRIVACY_PATH }")
    expect(source).toContain("{ label: 'User guide', href: GUIDE_PATH }")
    expect(source).toContain("{ label: 'Formula reference', href: FORMULAS_PATH }")
    expect(source).toContain("{ label: 'About', href: ABOUT_PATH }")
    expect(source).toContain("label: 'Contact'")
    expect(source).toContain("{ label: 'Terms', href: TERMS_PATH }")
    expect(source).toContain("{ label: 'Privacy', href: PRIVACY_PATH }")
    expect(source).toContain('PUBLIC_OPERATOR_INFO.contactEmail')
    expect(source).toContain('openPrivacySettings')
    expect(source).toContain('site-footer__operator-row')
    expect(source).toContain('publicFooterOperatorDetails(locale)')
    expect(source).not.toContain('site-footer__operator-heading')
    expect(source).toContain('site-footer__wordmark')
    expect(source).toContain('src="/favicon.svg"')
    expect(source).toContain('alt=""')
    expect(css).not.toContain('.site-footer__mark::before')
    expect(css).not.toContain('.site-footer__mark::after')
  })

  it('uses the shared compact type scale for structured company details', () => {
    expect(css).toMatch(
      /\.site-footer__operator \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /\.site-footer__operator dt \{[\s\S]*?font-size: var\(--font-size-xs\);/,
    )
    expect(css).toMatch(
      /\.site-footer__operator dd \{[\s\S]*?font-size: var\(--font-size-xs\);/,
    )
  })

  it('keeps the footer brand mark optically balanced with the wordmark', () => {
    expect(css).toMatch(/\.site-footer__wordmark \{[\s\S]*?gap: 9px;/)
    expect(css).toMatch(
      /\.site-footer__mark \{[\s\S]*?width: 24px;[\s\S]*?height: 24px;[\s\S]*?filter: saturate\(0\.62\) brightness\(0\.92\);[\s\S]*?opacity: 0\.9;/,
    )
  })

  it('does not restore removed paid-plan destinations', () => {
    expect(source).not.toContain('PRICING_PATH')
    expect(source).not.toContain('REFUND_POLICY_PATH')
  })
})
