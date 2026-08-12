import { describe, expect, it } from 'vitest'
import {
  isAdFreePublicInfoPath,
  isCompanyPath,
  isContactPath,
  isLegalPath,
  isAdminFeedbackPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
  isUpdatesPath,
  ADMIN_FEEDBACK_PATH,
  MY_PAGE_PATH,
  RECORDS_PATH,
} from './routes'

describe('routes', () => {
  it('keeps company and legal information pages ad-free', () => {
    expect(isAdFreePublicInfoPath('/about')).toBe(true)
    expect(isAdFreePublicInfoPath('/about/')).toBe(true)
    expect(isAdFreePublicInfoPath('/company')).toBe(true)
    expect(isAdFreePublicInfoPath('/company/')).toBe(true)
    expect(isAdFreePublicInfoPath('/contact')).toBe(true)
    expect(isAdFreePublicInfoPath('/contact/')).toBe(true)
    expect(isAdFreePublicInfoPath('/terms')).toBe(true)
    expect(isAdFreePublicInfoPath('/terms/')).toBe(true)
    expect(isAdFreePublicInfoPath('/privacy')).toBe(true)
    expect(isAdFreePublicInfoPath('/privacy/')).toBe(true)
    expect(isAdFreePublicInfoPath('/guide')).toBe(true)
    expect(isAdFreePublicInfoPath('/guide/')).toBe(true)
    expect(isAdFreePublicInfoPath('/formulas')).toBe(true)
    expect(isAdFreePublicInfoPath('/formulas/')).toBe(true)
    expect(isAdFreePublicInfoPath('/updates')).toBe(true)
    expect(isAdFreePublicInfoPath('/updates/')).toBe(true)
    expect(isAdFreePublicInfoPath('/pricing')).toBe(true)
    expect(isAdFreePublicInfoPath('/pricing/')).toBe(true)
    expect(isAdFreePublicInfoPath('/refund-policy')).toBe(true)
    expect(isAdFreePublicInfoPath('/refund-policy/')).toBe(true)

    expect(isAdFreePublicInfoPath('/')).toBe(false)
  })

  it('recognizes the public company route with optional trailing slash', () => {
    expect(isCompanyPath('/company')).toBe(true)
    expect(isCompanyPath('/company/')).toBe(true)
    expect(isCompanyPath('/company/team')).toBe(false)
  })

  it('recognizes the public contact route with optional trailing slash', () => {
    expect(isContactPath('/contact')).toBe(true)
    expect(isContactPath('/contact/')).toBe(true)
    expect(isContactPath('/contact/team')).toBe(false)
  })

  it('recognizes the public updates route with optional trailing slash', () => {
    expect(isUpdatesPath('/updates')).toBe(true)
    expect(isUpdatesPath('/updates/')).toBe(true)
    expect(isUpdatesPath('/updates/archive')).toBe(false)
  })

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
