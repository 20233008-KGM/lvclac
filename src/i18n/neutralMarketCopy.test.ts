import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('neutral market copy', () => {
  it('does not frame Korean copy as domestic versus overseas', () => {
    const copy = JSON.stringify(ko)

    expect(copy).not.toMatch(/국내\s*선물|해외\s*선물/)
    expect(copy).not.toMatch(/\bHTS\b|\bMTS\b/)
    expect(ko.marginMode.rateHint).toContain('약정가치 대비 비율')
    expect(ko.marginMode.perContractHint).toContain('1계약당 고정 금액')
  })

  it('uses structure-based margin terms in English', () => {
    const copy = JSON.stringify(en)

    expect(copy).not.toMatch(/domestic\s+futures|overseas\s+futures/i)
    expect(copy).not.toMatch(/\bHTS\b|\bMTS\b/)
    expect(en.marginMode.rateHint).toContain('ratio of notional value')
    expect(en.marginMode.perContractHint).toContain('fixed margin amount per contract')
  })
})
