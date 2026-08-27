import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { publicReviewCopy } from './PaddleReviewPages'

const source = readFileSync(resolve('src/components/PaddleReviewPages.tsx'), 'utf8')

describe('public Paddle review page copy', () => {
  it('provides Korean copy for product, pricing, and refund policy pages', () => {
    expect(publicReviewCopy.ko.product.title).toBe('선물 계산기')
    expect(publicReviewCopy.ko.pricing.title).toBe('요금제')
    expect(publicReviewCopy.ko.legal.refund.title).toBe('환불 정책')
    const refund = JSON.stringify(publicReviewCopy.ko.legal.refund)

    expect(refund).toContain('Paddle을 통해 구매한')
    expect(refund).toContain('Merchant of Record')
    expect(refund).toContain('원칙적으로 환불되지 않습니다')
    expect(refund).toContain('구독 취소가 현재 결제 기간의 자동 환불을 의미하지는 않습니다')
  })

  it('keeps English copy for Paddle reviewers', () => {
    expect(publicReviewCopy.en.product.title).toBe('Futures Calculator')
    expect(publicReviewCopy.en.pricing.title).toBe('Pricing')
    const refund = JSON.stringify(publicReviewCopy.en.legal.refund)

    expect(publicReviewCopy.en.legal.refund.title).toBe('Refund Policy')
    expect(refund).toContain('purchased through Paddle')
    expect(refund).toContain('merchant of record')
    expect(refund).toContain('generally non-refundable')
    expect(refund).toContain('Cancellation does not automatically refund')
  })

  it('links directly to Paddle buyer and refund support in both locales', () => {
    for (const locale of ['ko', 'en'] as const) {
      const refund = JSON.stringify(publicReviewCopy[locale].legal.refund)

      expect(refund).toContain('https://www.paddle.com/legal/buyer-terms')
      expect(refund).toContain('https://www.paddle.com/legal/refund-policy')
      expect(refund).toContain('https://paddle.net/')
    }
  })

  it('moves locale switching from the review header into the footer', () => {
    expect(source).not.toContain('<LanguageToggle variant="header" />')
    expect(source).toContain('<LocaleRouteLink className="site-footer__locale-link" />')
  })
})
