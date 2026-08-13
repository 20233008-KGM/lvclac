import { describe, expect, it } from 'vitest'
import {
  COMPANY_PATH,
  isLegalPath,
  isAdminFeedbackPath,
  isCompanyPath,
  isEnglishPublicPath,
  isGuidePath,
  isLocalizablePublicPath,
  isMyPagePath,
  isPricingPath,
  isProductPath,
  isRecordsPath,
  isUpdatesPath,
  localizedPublicPath,
  publicPathWithoutLocale,
  updateDetailPath,
  updateIdFromPath,
  ADMIN_FEEDBACK_PATH,
  MY_PAGE_PATH,
  RECORDS_PATH,
} from './routes'

describe('routes', () => {
  it('recognizes the company page route with optional trailing slash', () => {
    expect(COMPANY_PATH).toBe('/company')
    expect(isCompanyPath('/company')).toBe(true)
    expect(isCompanyPath('/company/')).toBe(true)
    expect(isCompanyPath('/company/team')).toBe(false)
  })

  it('maps English public routes without changing private dev routes', () => {
    expect(isEnglishPublicPath('/en')).toBe(true)
    expect(isEnglishPublicPath('/en/guide')).toBe(true)
    expect(publicPathWithoutLocale('/en/guide')).toBe('/guide')
    expect(localizedPublicPath('/guide', 'en')).toBe('/en/guide')
    expect(localizedPublicPath('/en/guide', 'ko')).toBe('/guide')
    expect(isGuidePath('/en/guide')).toBe(true)
    expect(isLocalizablePublicPath('/en/guide')).toBe(true)
    expect(isLocalizablePublicPath('/my')).toBe(false)
    expect(isMyPagePath('/en/my')).toBe(false)
  })

  it('recognizes localized update list and detail routes', () => {
    expect(isUpdatesPath('/updates')).toBe(true)
    expect(isUpdatesPath('/en/updates/')).toBe(true)
    expect(updateIdFromPath('/updates/2026-08-12-beta-experience')).toBe(
      '2026-08-12-beta-experience',
    )
    expect(updateIdFromPath('/en/updates/2026-08-12-beta-experience')).toBe(
      '2026-08-12-beta-experience',
    )
    expect(updateIdFromPath('/updates/nested/post')).toBe(null)
    expect(updateDetailPath('2026-08-12-beta-experience', 'en')).toBe(
      '/en/updates/2026-08-12-beta-experience',
    )
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
