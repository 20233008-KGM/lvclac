import { describe, it, expect } from 'vitest'
import { ko } from '../locales/ko'
import { applyPreset, mergeOverride } from './applyPreset'
import type { PresetOverride } from './types'

describe('applyPreset', () => {
  it('override=null이면 base를 그대로(참조 동일) 반환', () => {
    expect(applyPreset(ko, null)).toBe(ko)
  })

  it('지정한 label만 바뀌고 hint/placeholder·다른 필드는 불변', () => {
    const override: PresetOverride = { fields: { contractAmount: { label: '진입 환율' } } }
    const out = applyPreset(ko, override)
    expect(out.fields.contractAmount.label).toBe('진입 환율')
    expect(out.fields.contractAmount.hint).toBe(ko.fields.contractAmount.hint)
    expect(out.fields.contractAmount.placeholder).toBe(ko.fields.contractAmount.placeholder)
    expect(out.fields.contracts.label).toBe(ko.fields.contracts.label)
  })

  it('results를 얕게 병합(지정 키만 교체)', () => {
    const override: PresetOverride = { results: { contractNotional: '명목 금액' } }
    const out = applyPreset(ko, override)
    expect(out.results.contractNotional).toBe('명목 금액')
    expect(out.results.liquidationPrice).toBe(ko.results.liquidationPrice)
  })

  it('base 객체를 변형하지 않는다', () => {
    const beforeLabel = ko.fields.contractAmount.label
    const beforeResult = ko.results.contractNotional
    applyPreset(ko, {
      fields: { contractAmount: { label: 'X' } },
      results: { contractNotional: 'Y' },
    })
    expect(ko.fields.contractAmount.label).toBe(beforeLabel)
    expect(ko.results.contractNotional).toBe(beforeResult)
  })

  it('siteTitle 등 최상위 키는 그대로 보존된다', () => {
    const out = applyPreset(ko, { fields: { contracts: { label: '수량' } } })
    expect(out.siteTitle).toBe(ko.siteTitle)
    expect(out.calcMessages).toBe(ko.calcMessages)
  })
})

describe('mergeOverride', () => {
  it('공통 베이스 + patch를 필드 키 단위로 병합', () => {
    const base: PresetOverride = {
      fields: { contractAmount: { label: 'A' }, contracts: { label: 'B' } },
      results: { contractNotional: 'N' },
    }
    const merged = mergeOverride(base, { fields: { contractAmount: { label: 'A2' } } })
    expect(merged.fields?.contractAmount?.label).toBe('A2')
    expect(merged.fields?.contracts?.label).toBe('B')
    expect(merged.results?.contractNotional).toBe('N')
  })
})
