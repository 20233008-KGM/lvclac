import { describe, expect, it } from 'vitest'
import { publicReviewCopy } from './PaddleReviewPages'

describe('public Paddle review page copy', () => {
  it('provides specific Korean plan deliverables', () => {
    expect(publicReviewCopy.ko.pricing.title).toBe('요금제')
    expect(publicReviewCopy.ko.pricing.plans[1].features).toEqual([
      '광고 완전 제거.',
      '로컬 숫자세트 10개와 클라우드 숫자세트 10개.',
      '계좌 스냅샷 매일 자동 저장.',
      '주문 기록 무제한 아카이브.',
    ])
    expect(publicReviewCopy.ko.pricing.billingItems.join(' ')).toContain('Paddle')
  })

  it('keeps equivalent English pricing copy for Paddle reviewers', () => {
    expect(publicReviewCopy.en.pricing.title).toBe('Pricing')
    expect(publicReviewCopy.en.pricing.plans[1].features).toContain(
      'Unlimited order-history archive.',
    )
    expect(publicReviewCopy.en.pricing.billingItems.join(' ')).toContain('Paddle')
  })
})
