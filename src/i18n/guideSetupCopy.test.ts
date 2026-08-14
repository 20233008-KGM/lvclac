import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

function sectionText(locale: typeof ko | typeof en, title: string) {
  const section = locale.guide.sections.find((item) => item.title === title)
  expect(section).toBeDefined()
  return [...section!.paragraphs, ...(section!.items ?? [])].join('\n')
}

describe('guide setup and margin mode copy', () => {
  it('lists the required Korean setup values and marks tick size optional', () => {
    expect(ko.guide.description).toContain('처음 필요한 값')
    expect(ko.guide.description).not.toContain('입력 순서')

    const setup = sectionText(ko, '처음 필요한 값')
    for (const value of [
      '롱·숏 방향',
      '보유 계약수',
      '약정가격',
      '계좌 평가금액',
      '현재가',
      '계약승수',
      '유지·개시 증거금',
    ]) {
      expect(setup).toContain(value)
    }
    expect(setup).toContain('틱 크기')
    expect(setup).toContain('선택값')
  })

  it('describes margin modes by structure instead of national categories in Korean', () => {
    const marginModes = sectionText(ko, '증거금 입력 모드')
    expect(marginModes).toContain('약정가치 대비 비율')
    expect(marginModes).toContain('KRX KOSPI 200')
    expect(marginModes).toContain('일부 종목선물')
    expect(marginModes).toContain('1계약당 고정 금액')
    expect(marginModes).toContain('CME E-mini Nasdaq-100')
    expect(marginModes).toContain('보유 포지션 전체의 증거금 합계')
    expect(marginModes).not.toContain('국내 선물')
    expect(marginModes).not.toContain('해외 선물')
  })

  it('mirrors the setup and structure-based margin descriptions in English', () => {
    const setup = sectionText(en, 'Minimum setup values')
    expect(setup).toContain('long or short')
    expect(setup).toContain('account equity')
    expect(setup).toContain('contract multiplier')
    expect(setup).toContain('Tick size is optional')

    const marginModes = sectionText(en, 'Margin input modes')
    expect(marginModes).toContain('percentage of notional value')
    expect(marginModes).toContain('KRX KOSPI 200')
    expect(marginModes).toContain('selected single-stock futures')
    expect(marginModes).toContain('fixed amount per contract')
    expect(marginModes).toContain('CME E-mini Nasdaq-100')
    expect(marginModes).toContain('aggregate margin')
    expect(marginModes).not.toContain('Domestic futures')
    expect(marginModes).not.toContain('international contracts')
  })
})
