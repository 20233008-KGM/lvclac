import { describe, expect, it } from 'vitest'
import {
  isLegalPath,
  isAdminFeedbackPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
  ADMIN_FEEDBACK_PATH,
  MY_PAGE_PATH,
  RECORDS_PATH,
} from './routes'

describe('routes', () => {
  it('recognizes the my page route with optional trailing slash', () => {
    expect(MY_PAGE_PATH).toBe('/my')
    expect(isMyPagePath('/my')).toBe(true)
    expect(isMyPagePath('/my/')).toBe(true)
    expect(isMyPagePath('/my/settings')).toBe(false)
  })

  it('recognizes the records archive route with optional trailing slash', () => {
    expect(RECORDS_PATH).toBe('/records')
    expect(isRecordsPath('/records')).toBe(true)
    expect(isRecordsPath('/records/')).toBe(true)
    expect(isRecordsPath('/records/orders')).toBe(false)
  })

  it('recognizes the admin feedback route with optional trailing slash', () => {
    expect(ADMIN_FEEDBACK_PATH).toBe('/admin/feedback')
    expect(isAdminFeedbackPath('/admin/feedback')).toBe(true)
    expect(isAdminFeedbackPath('/admin/feedback/')).toBe(true)
    expect(isAdminFeedbackPath('/admin/feedback/posts')).toBe(false)
  })

  it('recognizes public Paddle review pages with optional trailing slash', () => {
    expect(isProductPath('/product')).toBe(true)
    expect(isProductPath('/product/')).toBe(true)
    expect(isProductPath('/product/pro')).toBe(false)

    expect(isPricingPath('/pricing')).toBe(true)
    expect(isPricingPath('/pricing/')).toBe(true)
    expect(isPricingPath('/pricing/annual')).toBe(false)

    expect(isLegalPath('/terms')).toBe('terms')
    expect(isLegalPath('/terms/')).toBe('terms')
    expect(isLegalPath('/privacy')).toBe('privacy')
    expect(isLegalPath('/privacy/')).toBe('privacy')
    expect(isLegalPath('/refund-policy')).toBe('refund')
    expect(isLegalPath('/refund-policy/')).toBe('refund')
    expect(isLegalPath('/refund-policy/archive')).toBe(null)
  })
})
