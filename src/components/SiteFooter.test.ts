import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDE_PATH, PRIVACY_PATH, REFUND_POLICY_PATH, TERMS_PATH } from '../config/routes'
import { footerLegalCopy } from './ServiceDisclaimer'
import { buildFooterColumns, footerPolicyColumnTitles, paddleReviewFooterLinks } from './footerNavigation'

const source = readFileSync(resolve('src/components/SiteFooter.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')
const footerMark = readFileSync(resolve('public/footer-brand-mark.svg'), 'utf8')

describe('public review footer labels', () => {
  it('uses Korean Pro pricing label when the active locale is Korean', () => {
    expect(paddleReviewFooterLinks.ko.map((link) => link.label)).toEqual(['Pro 요금제'])
    expect(footerPolicyColumnTitles.ko).toBe('약관 및 정책')
    expect(footerLegalCopy.ko.refundPolicy).toBe('환불 정책')
  })

  it('uses English Pro pricing label when the active locale is English', () => {
    expect(paddleReviewFooterLinks.en.map((link) => link.label)).toEqual(['Pro Pricing'])
    expect(footerPolicyColumnTitles.en).toBe('Legal')
    expect(footerLegalCopy.en.refundPolicy).toBe('Refund Policy')
  })

  it('moves the user guide into the product column and adds a policies column', () => {
    const columns = buildFooterColumns(
      [
        {
          title: '제품',
          links: [
            { label: '선물 계산기', href: '/' },
            { label: 'Pro', soon: true },
            { label: '업데이트 노트', soon: true },
          ],
        },
        {
          title: '리소스',
          links: [
            { label: '이용 가이드', href: GUIDE_PATH },
            { label: 'API 문서', soon: true },
            { label: '상태 페이지', soon: true },
          ],
        },
        { title: '회사', links: [{ label: '문의', href: 'mailto:contact@example.com' }] },
        { title: '의견 보내기', links: [{ label: '버그 제보', href: '/feedback/bugs' }] },
      ],
      'ko',
      {
        terms: '이용약관',
        privacy: '개인정보 처리방침',
        refund: '환불 정책',
      },
    )

    expect(columns.map((column) => column.title)).toEqual(['제품', '회사', '의견 보내기', '약관 및 정책'])
    expect(columns[0].links.map((link) => link.label)).toEqual(['선물 계산기', 'Pro 요금제', '이용 가이드'])
    expect(columns[0].links[2].href).toBe(GUIDE_PATH)
    expect(columns[3].links).toEqual([
      { label: '이용약관', href: TERMS_PATH },
      { label: '개인정보 처리방침', href: PRIVACY_PATH },
      { label: '환불 정책', href: REFUND_POLICY_PATH },
    ])
  })

  it('uses the public footer body without replacing dev navigation', () => {
    expect(source).toContain('PUBLIC_OPERATOR_INFO.productName')
    expect(source).toContain('publicFooterOperatorDetails(locale)')
    expect(source).toContain('site-footer__operator-row')
    expect(source).toContain('src="/footer-brand-mark.svg"')
    expect(source).toContain('alt=""')
    expect(source).toContain('<DisclaimerShowAgainLink variant="footer" />')
    expect(source).toContain('buildFooterColumns(t.footer.columns')
  })

  it('keeps the imported brand mark and company grid dimensions', () => {
    expect(css).toMatch(/\.site-footer__wordmark \{[\s\S]*?gap: 9px;/)
    expect(css).toMatch(/\.site-footer__mark \{[^}]*width: 20px;[^}]*height: 20px;/)
    expect(css).toMatch(
      /\.site-footer__operator \{[\s\S]*?@media \(min-width: 768px\) \{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    )
    expect(css).toMatch(
      /@media \(min-width: 960px\) \{[\s\S]*?\.site-footer__nav \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0, 1fr\)\);/,
    )
    expect(footerMark).toContain('#7183b8')
    expect(footerMark).toContain('#596a94')
    expect(footerMark).toContain('#46516a')
    expect(footerMark).toContain('#bd5551')
    expect(footerMark).toContain('#ef6657')
    expect(footerMark).toContain('#f5f7fa')
  })

  it('keeps the accepted calculator notice and footer spacing', () => {
    expect(css).toMatch(
      /\.content-risk-notice \{[\s\S]*?margin: calc\(var\(--space-xl\) \* 2 \+ var\(--space-md\)\) 0 0;/,
    )
    expect(css).toMatch(/\.site-footer \{[\s\S]*?margin-top: var\(--space-md\);/)
  })
})
