import { describe, expect, it } from 'vitest'
import { publicReviewCopy } from './PaddleReviewPages'

describe('public Paddle review page copy', () => {
  it('provides Korean copy for product, pricing, and refund policy pages', () => {
    expect(publicReviewCopy.ko.product.title).toBe('선물 계산기')
    expect(publicReviewCopy.ko.pricing.title).toBe('요금제')
    expect(publicReviewCopy.ko.legal.refund.title).toBe('환불 정책')
    expect(publicReviewCopy.ko.legal.refund.sections[0].body).toContain('Paddle')
  })

  it('keeps English copy for Paddle reviewers', () => {
    expect(publicReviewCopy.en.product.title).toBe('Futures Calculator')
    expect(publicReviewCopy.en.pricing.title).toBe('Pricing')
    expect(publicReviewCopy.en.legal.refund.title).toBe('Refund Policy')
  })
})
