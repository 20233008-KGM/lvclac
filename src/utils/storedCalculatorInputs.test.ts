import { describe, expect, it } from 'vitest'
import { parseStoredCalculatorInputs } from './storedCalculatorInputs'

describe('stored calculator inputs', () => {
  it('구버전 비율 저장값을 현재 소수 비율로 정규화한다', () => {
    const inputs = parseStoredCalculatorInputs({
      accountEval: 1000,
      maintenanceMarginRate: 5,
      entrustedMarginRate: 10,
    })

    expect(inputs?.maintenanceMarginRate).toBe(0.05)
    expect(inputs?.entrustedMarginRate).toBe(0.1)
  })

  it('구버전 필드명을 현재 필드명으로 마이그레이션한다', () => {
    const inputs = parseStoredCalculatorInputs({
      additionalContracts: 3,
      priceMultiplier: 2,
      positionSide: 'short',
    })

    expect(inputs?.orderContracts).toBe(3)
    expect(inputs?.contractMultiplier).toBe(2)
    expect(inputs?.positionSide).toBe('short')
  })

  it('객체가 아닌 저장값은 무시한다', () => {
    expect(parseStoredCalculatorInputs(null)).toBeNull()
    expect(parseStoredCalculatorInputs('broken')).toBeNull()
    expect(parseStoredCalculatorInputs([])).toBeNull()
  })
})
