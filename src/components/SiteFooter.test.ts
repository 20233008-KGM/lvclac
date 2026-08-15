import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')
const footerMark = readFileSync(resolve('public/footer-brand-mark.svg'), 'utf8')

describe('public-lite footer links', () => {
  it('publishes the product, company, and legal destinations', () => {
    expect(source).toContain("{ label: '서비스 소개', href: ABOUT_PATH }")
    expect(source).toContain("{ label: 'Pro 요금제', href: PRICING_PATH }")
    expect(source).toContain("{ label: '사용 가이드', href: GUIDE_PATH }")
    expect(source).toContain("{ label: '업데이트', href: UPDATES_PATH }")
    expect(source).toContain("{ label: '회사 소개', href: COMPANY_PATH }")
    expect(source).toContain("{ label: '문의하기', href: CONTACT_PATH }")
    expect(source).toContain("{ label: 'Service overview', href: ABOUT_PATH }")
    expect(source).toContain("{ label: 'Pro pricing', href: PRICING_PATH }")
    expect(source).toContain("{ label: 'User guide', href: GUIDE_PATH }")
    expect(source).toContain("{ label: 'Updates', href: UPDATES_PATH }")
    expect(source).toContain("{ label: 'About us', href: COMPANY_PATH }")
    expect(source).toContain("{ label: 'Contact', href: CONTACT_PATH }")
    expect(source).not.toContain('FORMULAS_PATH')
    expect(source).toContain("{ label: '이용약관', href: TERMS_PATH }")
    expect(source).toContain("{ label: '개인정보처리방침', href: PRIVACY_PATH }")
    expect(source).toContain("{ label: '환불 정책', href: REFUND_POLICY_PATH }")
    expect(source).toContain("{ label: 'Terms', href: TERMS_PATH }")
    expect(source).toContain("{ label: 'Privacy', href: PRIVACY_PATH }")
    expect(source).toContain("{ label: 'Refund policy', href: REFUND_POLICY_PATH }")
    expect(source).not.toContain("{ label: '선물 계산기', href: '/' }")
    expect(source).not.toContain("{ label: 'Calculator', href: '/' }")
    expect(source).toContain('CONTACT_PATH')
    expect(source).toContain('openPrivacySettings')
    expect(source).not.toContain('<DisclaimerShowAgainLink variant="footer-nav" />')
    expect(source).toContain('<DisclaimerShowAgainLink variant="footer" />')
    expect(source).toContain('<LocaleRouteLink className="site-footer__bottom-link" />')
    expect(source).not.toContain('<ContentRiskNotice />')
    expect(source).toContain('site-footer__operator-row')
    expect(source).toContain('publicFooterOperatorDetails(locale)')
    expect(source).not.toContain('site-footer__operator-heading')
    expect(source).toContain('site-footer__wordmark')
    expect(source).toContain('src="/footer-brand-mark.svg"')
    expect(source).toContain('alt=""')
    expect(css).not.toContain('.site-footer__mark::before')
    expect(css).not.toContain('.site-footer__mark::after')
  })

  it('keeps the requested first-row ordering in product and company columns', () => {
    expect(source.indexOf("{ label: '서비스 소개', href: ABOUT_PATH }")).toBeLessThan(
      source.indexOf("{ label: '사용 가이드', href: GUIDE_PATH }"),
    )
    expect(source.indexOf("{ label: '회사 소개', href: COMPANY_PATH }")).toBeLessThan(
      source.indexOf("{ label: '문의하기', href: CONTACT_PATH }"),
    )
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

  it('switches the main footer columns based on the width actually allocated to the footer', () => {
    expect(css).toMatch(
      /\.site-footer \{[\s\S]*?container-name: site-footer;[\s\S]*?container-type: inline-size;/,
    )
    expect(css).toMatch(
      /@container site-footer \(min-width: 800px\) \{[\s\S]*?\.site-footer__main \{[\s\S]*?grid-template-columns: minmax\(220px, 1\.1fr\) minmax\(0, 1\.9fr\);/,
    )
  })

  it('keeps the footer brand mark optically balanced with the wordmark', () => {
    expect(css).toMatch(/\.site-footer__wordmark \{[\s\S]*?gap: 9px;/)
    expect(css).toMatch(/\.site-footer__mark \{[^}]*width: 20px;[^}]*height: 20px;/)
    expect(css).not.toMatch(/\.site-footer__mark \{[^}]*filter:/)
    expect(css).not.toMatch(/\.site-footer__mark \{[^}]*opacity:/)
  })

  it('uses a footer-specific cool blue palette with a clear red accent', () => {
    expect(footerMark).toContain('#7183b8')
    expect(footerMark).toContain('#596a94')
    expect(footerMark).toContain('#46516a')
    expect(footerMark).toContain('#bd5551')
    expect(footerMark).toContain('#ef6657')
    expect(footerMark).toContain('#f5f7fa')
  })

  it('publishes Paddle review destinations and keeps quiet utility links in the bottom row', () => {
    expect(source).toContain('PRICING_PATH')
    expect(source).toContain('REFUND_POLICY_PATH')
    expect(source).toContain('site-footer__bottom-actions')
    expect(source.indexOf('site-footer__bottom-actions')).toBeGreaterThan(
      source.indexOf('site-footer__bottom'),
    )
  })
})
