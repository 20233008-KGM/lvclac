import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { publicReviewCopy } from './PaddleReviewPages'

const source = readFileSync(resolve('src/components/PaddleReviewPages.tsx'), 'utf8')

describe('public Paddle review page copy', () => {
  it('provides specific Korean plan deliverables', () => {
    expect(publicReviewCopy.ko.pricing.title).toBe('요금제')
    expect(publicReviewCopy.ko.pricing.pro.features).toEqual([
      '광고 완전 제거.',
      '로컬 숫자세트 10개와 클라우드 숫자세트 10개.',
      '계좌 스냅샷 매일 자동 저장.',
      '주문 기록 무제한 아카이브.',
    ])
    expect(publicReviewCopy.ko.pricing.pro.billing.monthly.price).toBe('$5')
    expect(publicReviewCopy.ko.pricing.pro.billing.yearly.detail).toContain('연 $12 절약')
    expect(publicReviewCopy.ko.pricing.billingItems.join(' ')).toContain('Paddle')
    expect(publicReviewCopy.ko.pricing.free.features.join(' ')).toContain(
      '현재 공개 서비스에는 로그인과 클라우드 저장 기능이 없습니다',
    )
    expect(publicReviewCopy.ko.pricing.billingItems.join(' ')).toContain(
      '도메인 심사가 완료된 뒤에만',
    )
  })

  it('keeps equivalent English pricing copy for Paddle reviewers', () => {
    expect(publicReviewCopy.en.pricing.title).toBe('Pricing')
    expect(publicReviewCopy.en.pricing.pro.features).toContain(
      'Unlimited order-history archive.',
    )
    expect(publicReviewCopy.en.pricing.pro.billing.yearly.badge).toBe('Save 20%')
    expect(publicReviewCopy.en.pricing.billingItems.join(' ')).toContain('Paddle')
    expect(publicReviewCopy.en.pricing.free.features.join(' ')).toContain(
      'current public service has no sign-in or cloud storage',
    )
  })

  it('presents billing cycles inside one Pro tier instead of duplicate plan cards', () => {
    expect(source).not.toContain('pricing.plans.map')
    expect(source).toContain('aria-pressed={selected}')
    expect(source).toContain('pricing.pro.features')
    expect(source).not.toContain('pricing.pro.availability')
  })

  it('keeps the five-page information navigator off the pricing page', () => {
    expect(source).toMatch(
      /export function PricingReviewPage\(\)[\s\S]*?<PublicInfoShell[\s\S]*?showNavigation=\{false\}/,
    )
  })
})
