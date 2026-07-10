import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

function guideSection(locale: typeof ko | typeof en, title: string) {
  const section = locale.guide.sections.find((item) => item.title === title)
  expect(section).toBeDefined()
  return section!
}

function expectInOrder(text: string, first: string, second: string) {
  const firstIndex = text.indexOf(first)
  const secondIndex = text.indexOf(second)
  expect(firstIndex).toBeGreaterThanOrEqual(0)
  expect(secondIndex).toBeGreaterThanOrEqual(0)
  expect(firstIndex).toBeLessThan(secondIndex)
}

describe('rollover copy', () => {
  it('mentions rollover resnapshot guidance in the Korean order tooltip and guide', () => {
    expect(ko.orderScenarioHint).toContain('[롤오버]')
    expect(ko.orderScenarioHint).toContain('새 약정가격·보유계약수')
    expect(ko.orderScenarioHint).toContain('계좌평가금액·현재가')
    expect(ko.orderScenarioHint).toContain('스냅샷해 다시 맞춰 주세요')
    expect(ko.orderScenarioHint).toContain('소폭 오차')
    expectInOrder(ko.orderScenarioHint, '주문가·실제 체결가', '새 약정가격·보유계약수')

    const orderGuide = guideSection(ko, '주문 시뮬레이션')
    const guideText = [...orderGuide.paragraphs, ...(orderGuide.items ?? [])].join('\n')
    expect(guideText).toContain('롤오버·전량청산 후 재진입')
    expect(guideText).toContain('같은 시점')
    expect(guideText).toContain('스냅샷하여 다시 맞춰 주세요')
    expect(guideText).toContain('체결가와 현재가')
    expectInOrder(guideText, '체결가와 현재가', '새 포지션 기준')
  })

  it('mentions rollover resnapshot guidance in the English order tooltip and guide', () => {
    expect(en.orderScenarioHint).toContain('[Rollover]')
    expect(en.orderScenarioHint).toContain('new entry price/open contracts')
    expect(en.orderScenarioHint).toContain('account equity/mark at the same timestamp')
    expect(en.orderScenarioHint).toContain('resnapshot')
    expect(en.orderScenarioHint).toContain('small differences')
    expectInOrder(en.orderScenarioHint, 'order price vs actual fill', 'new entry price/open contracts')

    const orderGuide = guideSection(en, 'Order simulation')
    const guideText = [...orderGuide.paragraphs, ...(orderGuide.items ?? [])].join('\n')
    expect(guideText).toContain('After rollover or re-entering from flat')
    expect(guideText).toContain('same timestamp')
    expect(guideText).toContain('actual fill')
    expectInOrder(guideText, 'order price vs actual fill', 'new entry price/open contracts')
  })
})
