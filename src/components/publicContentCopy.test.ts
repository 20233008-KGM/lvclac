import { describe, expect, it } from 'vitest'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'

function guideText(locale: typeof ko | typeof en): string {
  return JSON.stringify(locale.guide)
}

describe('public v1 content copy', () => {
  it('describes only opt-in browser storage in the guide', () => {
    const koGuide = guideText(ko)
    const enGuide = guideText(en)

    expect(koGuide).toContain('현재 브라우저의 localStorage')
    expect(enGuide).toContain('this browser localStorage')
    expect(koGuide).not.toContain('로그인 사용자')
    expect(koGuide).not.toContain('클라우드 세트')
    expect(koGuide).not.toContain('유료')
    expect(enGuide).not.toContain('signed-in user')
    expect(enGuide).not.toContain('cloud set')
    expect(enGuide).not.toContain('paid feature')
  })

  it('keeps the formula reference aligned with the calculation engine branches', () => {
    const koFormulas = JSON.stringify(ko.formulas)
    const enFormulas = JSON.stringify(en.formulas)

    expect(koFormulas).toContain('총 민감도 = 보유 계약수 × 계약승수')
    expect(koFormulas).toContain('계약당 고정금액 × 보유 계약수')
    expect(koFormulas).toContain('레버리지 = 약정가치 ÷ 계좌평가금액')
    expect(enFormulas).toContain('Q = N × M')
    expect(enFormulas).toContain('constant, price-independent')
    expect(enFormulas).toContain('Leverage = notional ÷ E₀')
  })
})
