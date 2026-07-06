import { describe, expect, it } from 'vitest'
import { hasMeaningfulCalculatorInputs, parseStoredCalculatorInputs } from './storedCalculatorInputs'

describe('stored calculator inputs', () => {
  it('normalizes legacy percent rates to current decimal rates', () => {
    const inputs = parseStoredCalculatorInputs({
      accountEval: 1000,
      maintenanceMarginRate: 5,
      entrustedMarginRate: 10,
    })

    expect(inputs?.maintenanceMarginRate).toBe(0.05)
    expect(inputs?.entrustedMarginRate).toBe(0.1)
  })

  it('migrates legacy field names to current field names', () => {
    const inputs = parseStoredCalculatorInputs({
      additionalContracts: 3,
      priceMultiplier: 2,
      positionSide: 'short',
    })

    expect(inputs?.orderContracts).toBe(3)
    expect(inputs?.contractMultiplier).toBe(2)
    expect(inputs?.positionSide).toBe('short')
  })

  it('ignores non-object stored values', () => {
    expect(parseStoredCalculatorInputs(null)).toBeNull()
    expect(parseStoredCalculatorInputs('broken')).toBeNull()
    expect(parseStoredCalculatorInputs([])).toBeNull()
  })

  it('treats default-only calculator state as no saved value', () => {
    expect(hasMeaningfulCalculatorInputs({ mode: 'evaluate', positionSide: 'long' })).toBe(false)
    expect(
      hasMeaningfulCalculatorInputs({
        mode: 'order',
        positionSide: 'short',
        marginInputMode: 'total',
      }),
    ).toBe(false)
  })

  it('treats any finite numeric calculator field as a saved value', () => {
    expect(
      hasMeaningfulCalculatorInputs({
        mode: 'evaluate',
        positionSide: 'long',
        accountEval: 0,
      }),
    ).toBe(true)
    expect(
      hasMeaningfulCalculatorInputs({
        mode: 'evaluate',
        positionSide: 'long',
        scenarioPrice: Number.NaN,
        currentPrice: 350,
      }),
    ).toBe(true)
  })
})
