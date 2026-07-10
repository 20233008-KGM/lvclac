import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import {
  calcEntryPriceReturnRate,
  calcPositionUnrealizedPnl,
  calcPositionTickPnl,
} from './positionMetrics'

const baseInputs: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  contracts: 3,
  contractAmount: 100,
  currentPrice: 105,
  contractMultiplier: 10,
  tickSize: 0.25,
}

describe('positionMetrics', () => {
  describe('calcEntryPriceReturnRate', () => {
    it('returns positive percentage when a long position is above entry', () => {
      expect(calcEntryPriceReturnRate(baseInputs)).toBeCloseTo(5)
    })

    it('returns positive percentage when a short position is below entry', () => {
      expect(
        calcEntryPriceReturnRate({
          ...baseInputs,
          positionSide: 'short',
          currentPrice: 95,
        }),
      ).toBeCloseTo(5)
    })

    it('returns null when entry price is missing or invalid', () => {
      expect(calcEntryPriceReturnRate({ ...baseInputs, contractAmount: undefined })).toBeNull()
      expect(calcEntryPriceReturnRate({ ...baseInputs, contractAmount: 0 })).toBeNull()
    })
  })

  describe('calcPositionTickPnl', () => {
    it('uses held contracts, tick size, and multiplier as an absolute per-tick move', () => {
      expect(calcPositionTickPnl(baseInputs)).toBeCloseTo(7.5)
    })

    it('returns zero for a flat position with complete tick spec', () => {
      expect(calcPositionTickPnl({ ...baseInputs, contracts: 0 })).toBe(0)
    })

    it('returns null when tick size or multiplier is invalid', () => {
      expect(calcPositionTickPnl({ ...baseInputs, tickSize: undefined })).toBeNull()
      expect(calcPositionTickPnl({ ...baseInputs, tickSize: 0 })).toBeNull()
      expect(calcPositionTickPnl({ ...baseInputs, contractMultiplier: 0 })).toBeNull()
    })
  })

  describe('calcPositionUnrealizedPnl', () => {
    it('returns positive P&L when a long position is above entry', () => {
      expect(calcPositionUnrealizedPnl(baseInputs)).toBeCloseTo(150)
    })

    it('returns positive P&L when a short position is below entry', () => {
      expect(
        calcPositionUnrealizedPnl({
          ...baseInputs,
          positionSide: 'short',
          currentPrice: 95,
        }),
      ).toBeCloseTo(150)
    })

    it('returns zero for a flat position with complete prices', () => {
      expect(calcPositionUnrealizedPnl({ ...baseInputs, contracts: 0 })).toBe(0)
    })

    it('returns null when required price or multiplier values are invalid', () => {
      expect(calcPositionUnrealizedPnl({ ...baseInputs, contractAmount: undefined })).toBeNull()
      expect(calcPositionUnrealizedPnl({ ...baseInputs, currentPrice: undefined })).toBeNull()
      expect(calcPositionUnrealizedPnl({ ...baseInputs, contractMultiplier: 0 })).toBeNull()
    })
  })
})
