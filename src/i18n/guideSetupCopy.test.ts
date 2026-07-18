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

  it('uses market examples instead of national categories in Korean', () => {
    const marginModes = sectionText(ko, '증거금 입력 모드')
    expect(marginModes).toContain('KOSPI 200 지수선물')
    expect(marginModes).toContain('KOSPI 종목선물')
    expect(marginModes).toContain('CME 주가지수선물')
    expect(marginModes).toContain('원자재 선물')
    expect(marginModes).not.toContain('국내 선물')
    expect(marginModes).not.toContain('해외 선물')
  })

  it('mirrors the setup and market-based examples in English', () => {
    const setup = sectionText(en, 'Minimum setup values')
    expect(setup).toContain('long or short')
    expect(setup).toContain('account equity')
    expect(setup).toContain('contract multiplier')
    expect(setup).toContain('Tick size is optional')

    const marginModes = sectionText(en, 'Margin input modes')
    expect(marginModes).toContain('KOSPI 200 index futures')
    expect(marginModes).toContain('KOSPI single-stock futures')
    expect(marginModes).toContain('CME equity-index futures')
    expect(marginModes).toContain('commodity futures')
    expect(marginModes).not.toContain('Domestic futures')
    expect(marginModes).not.toContain('international contracts')
  })
})
