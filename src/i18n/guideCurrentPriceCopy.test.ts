import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

function guideSection(locale: typeof ko | typeof en, title: string) {
  const section = locale.guide.sections.find((item) => item.title === title)
  expect(section).toBeDefined()
  return section!
}

function sectionText(section: ReturnType<typeof guideSection>) {
  return [...section.paragraphs, ...(section.items ?? [])].join('\n')
}

describe('guide current price routine copy', () => {
  it('describes the Korean daily routine through current price instead of scenario price', () => {
    expect(ko.guide.description).toContain('현재가 갱신 루틴')
    expect(ko.guide.description).not.toContain('시나리오 기능')

    const daily = sectionText(guideSection(ko, '매일 아침 빠르게 맞추기'))
    expect(daily).toContain('현재가 입력창')
    expect(daily).toContain('현재가만')
    expect(daily).toContain('자동 반영')
    expect(daily).not.toContain('시나리오 가격')
    expect(daily).not.toContain('Enter → Enter')

    const priceCheck = sectionText(guideSection(ko, '현재가를 바꿔 결과 확인하기'))
    expect(priceCheck).toContain('계좌 평가금액에 반영')
    expect(priceCheck).toContain('저장값도 갱신')
    expect(priceCheck).toContain('Ctrl+Z')
    expect(priceCheck).not.toContain('Esc')
    expect(JSON.stringify(ko.guide)).not.toContain('시나리오 가격')

    const saving = sectionText(guideSection(ko, '입력값 저장'))
    expect(saving).toContain('현재가만')
    expect(saving).not.toContain('시나리오 가격')
  })

  it('describes the English daily routine through mark price instead of Scenario price', () => {
    expect(en.guide.description).toContain('update the mark price')
    expect(en.guide.description).not.toContain('scenario preview')

    const daily = sectionText(guideSection(en, 'Daily mark-to-market'))
    expect(daily).toContain('mark price field')
    expect(daily).toContain('only the mark')
    expect(daily).toContain('automatically rolls')
    expect(daily).not.toContain('Scenario price')
    expect(daily).not.toContain('Enter → Enter')

    const priceCheck = sectionText(guideSection(en, 'Check results at a different mark price'))
    expect(priceCheck).toContain('apply the price-change P&L to account equity')
    expect(priceCheck).toContain('saved values update too')
    expect(priceCheck).toContain('Ctrl+Z')
    expect(priceCheck).not.toContain('Esc')
    expect(JSON.stringify(en.guide)).not.toContain('Scenario price')

    const saving = sectionText(guideSection(en, 'Saving inputs'))
    expect(saving).toContain('only the mark')
    expect(saving).not.toContain('Scenario price')
  })
})
