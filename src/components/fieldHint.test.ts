import { describe, it, expect } from 'vitest'
import { fieldHintActive } from './fieldHint'

describe('fieldHintActive', () => {
  it('거래 상태가 없으면 비활성', () => {
    expect(fieldHintActive(null, false)).toBe(false)
    expect(fieldHintActive(null, true)).toBe(false)
  })

  it('상태가 있고 아직 닫지 않았으면 활성', () => {
    expect(fieldHintActive('firstTrade', false)).toBe(true)
    expect(fieldHintActive('noPosition', false)).toBe(true)
    expect(fieldHintActive('hasPosition', false)).toBe(true)
  })

  it('닫았으면 비활성', () => {
    expect(fieldHintActive('firstTrade', true)).toBe(false)
    expect(fieldHintActive('hasPosition', true)).toBe(false)
  })
})
