import { describe, it, expect } from 'vitest'
import { fieldHintActive, fieldHintCalculationComplete } from './fieldHint'

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

describe('fieldHintCalculationComplete', () => {
  it('첫 거래와 무포지션은 주문 후 청산가가 나오면 완료', () => {
    expect(fieldHintCalculationComplete('firstTrade', null, 123)).toBe(true)
    expect(fieldHintCalculationComplete('noPosition', null, 123)).toBe(true)
    expect(fieldHintCalculationComplete('firstTrade', 100, null)).toBe(false)
  })

  it('보유 포지션은 현재 보유분 청산가가 나오면 완료', () => {
    expect(fieldHintCalculationComplete('hasPosition', 123, null)).toBe(true)
    expect(fieldHintCalculationComplete('hasPosition', null, 123)).toBe(false)
  })

  it('거래 상태가 없으면 결과가 있어도 완료하지 않음', () => {
    expect(fieldHintCalculationComplete(null, 123, 456)).toBe(false)
  })
})
