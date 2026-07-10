import { describe, expect, it } from 'vitest'
import { GUIDE_PATH, PRIVACY_PATH, REFUND_POLICY_PATH, TERMS_PATH } from '../config/routes'
import { buildFooterColumns, footerPolicyColumnTitles, paddleReviewFooterLinks } from './SiteFooter'
import { footerLegalCopy } from './ServiceDisclaimer'

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
})
