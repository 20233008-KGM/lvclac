import { describe, expect, it } from 'vitest'
import { buildDocuments } from './PublicLegalPage'

describe('public paid-service legal copy', () => {
  it('separates current browser-only storage from future billing in Korean', () => {
    const documents = buildDocuments('ko')
    const terms = JSON.stringify(documents.terms)
    const privacy = JSON.stringify(documents.privacy)
    const refund = JSON.stringify(documents.refund)

    expect(terms).toContain('Paddle')
    expect(terms).toContain('자동 갱신')
    expect(terms).toContain('현재 공개 서비스는 로그인이나 클라우드 저장 기능을 제공하지 않습니다')
    expect(privacy).toContain('현재 공개 서비스에는 로그인, 클라우드 저장, 결제 또는 Pro 기능이 없습니다')
    expect(privacy).toContain('개인정보의 파기')
    expect(privacy).toContain('향후 계정·결제 기능')
    expect(refund).toContain('Merchant of Record')
    expect(refund).toContain('30일 이내')
    expect(refund).toContain('별도의 사유나 이용량 조건을 두지 않습니다')
    expect(refund).not.toContain('원칙적으로 환불되지 않습니다')
    expect(refund).toContain('구독 취소가 현재 결제 기간의 자동 환불을 의미하지는 않습니다')
  })

  it('keeps equivalent current-state and Paddle information in English', () => {
    const documents = buildDocuments('en')
    const terms = JSON.stringify(documents.terms)
    const privacy = JSON.stringify(documents.privacy)
    const refund = JSON.stringify(documents.refund)

    expect(terms).toContain('Paddle')
    expect(terms).toContain('renew')
    expect(terms).toContain('current public service does not offer sign-in or cloud storage')
    expect(privacy).toContain('does not currently offer sign-in, cloud storage, billing, or Pro features')
    expect(privacy).toContain('Data destruction')
    expect(privacy).toContain('Future account and billing features')
    expect(refund).toContain('merchant of record')
    expect(refund).toContain('30-calendar-day money-back guarantee')
    expect(refund).toContain('No reason or usage threshold is required')
    expect(refund).not.toContain('generally non-refundable')
    expect(refund).toContain('Cancellation does not automatically refund')
  })

  it('links directly to Paddle buyer and refund terms in both locales', () => {
    for (const locale of ['ko', 'en'] as const) {
      const documents = buildDocuments(locale)
      const legalCopy = JSON.stringify(documents)

      expect(legalCopy).toContain('https://www.paddle.com/legal/buyer-terms')
      expect(legalCopy).toContain('https://www.paddle.com/legal/refund-policy')
      expect(legalCopy).toContain('https://paddle.net/')
    }
  })
})
