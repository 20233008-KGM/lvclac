import { describe, expect, it } from 'vitest'
import { buildDocuments } from './PublicLegalPage'

describe('public paid-service legal copy', () => {
  it('covers Paddle subscriptions, cloud data, and refunds in Korean', () => {
    const documents = buildDocuments('ko')
    const terms = JSON.stringify(documents.terms)
    const privacy = JSON.stringify(documents.privacy)
    const refund = JSON.stringify(documents.refund)

    expect(terms).toContain('Paddle')
    expect(terms).toContain('자동 갱신')
    expect(privacy).toContain('Supabase')
    expect(privacy).toContain('Paddle')
    expect(refund).toContain('Merchant of Record')
    expect(refund).toContain('구독 취소가 현재 결제 기간의 자동 환불을 의미하지는 않습니다')
  })

  it('keeps equivalent review information available in English', () => {
    const documents = buildDocuments('en')
    const terms = JSON.stringify(documents.terms)
    const privacy = JSON.stringify(documents.privacy)
    const refund = JSON.stringify(documents.refund)

    expect(terms).toContain('Paddle')
    expect(terms).toContain('renew')
    expect(privacy).toContain('Supabase')
    expect(privacy).toContain('Paddle')
    expect(refund).toContain('merchant of record')
    expect(refund).toContain('Cancellation does not automatically refund')
  })
})
