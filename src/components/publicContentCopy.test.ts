import { describe, expect, it } from 'vitest'
import { en } from '../i18n/locales/en'
import { ko } from '../i18n/locales/ko'

function guideText(locale: typeof ko | typeof en): string {
  return JSON.stringify(locale.guide)
}

function aboutText(locale: typeof ko | typeof en): string {
  return JSON.stringify(locale.about)
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
    expect(koFormulas).toContain('약정가치 = 보유 계약수 × 약정가격 × 계약승수(계약크기)')
    expect(koFormulas).toContain('레버리지 = (현재가 × 총 민감도) ÷ 계좌평가금액')
    expect(enFormulas).toContain(
      'Total sensitivity = open contracts × contract multiplier / contract size',
    )
    expect(enFormulas).toContain('constant, price-independent')
    expect(enFormulas).toContain('Leverage = (current price × total sensitivity) ÷ account equity')
    expect(enFormulas).not.toContain('Q = N × M')
  })

  it('presents the about page as a benefit-led SaaS introduction in both languages', () => {
    const koAbout = aboutText(ko)
    const enAbout = aboutText(en)

    expect(ko.about.tagline).toBe('포지션 위험을, 한 화면에서')
    expect(en.about.tagline).toBe('See position risk in one place')
    expect(koAbout).toContain('흩어진 계산을 한곳에')
    expect(koAbout).toContain('결과와 기준을 함께')
    expect(koAbout).toContain('가볍게 시작하고, 선택해서 저장')
    expect(koAbout).toContain('현재 브라우저에만 보관됩니다')
    expect(enAbout).toContain('Bring scattered calculations together')
    expect(enAbout).toContain('See the result and the reasoning')
    expect(enAbout).toContain('Start light, save by choice')
    expect(enAbout).toContain('your inputs remain in this browser')
    expect(koAbout).not.toContain('검증 가능한 도구로')
    expect(enAbout).not.toContain('made verifiable')
  })
})
