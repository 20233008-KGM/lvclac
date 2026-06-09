import { describe, expect, it } from 'vitest'
import {
  calcLiquidationPrice,
  calcMaxBuyable,
  calcToleranceDelta,
  calcToleranceRate,
  calculateEvaluate,
  getPointValue,
} from './leverage'
import { calcContractNotional, calcMarginFromNotional } from './margins'
import { defaultInputs } from '../types'

describe('getPointValue', () => {
  it('약정금액×계약승수 ÷ 현재가', () => {
    expect(getPointValue(200_000, 10, 350)).toBeCloseTo(5714.286, 2)
  })
})

describe('calcContractNotional', () => {
  it('약정금액 × 계약승수 × 총 계약수', () => {
    expect(calcContractNotional(10, 200_000, 10)).toBe(20_000_000)
  })
})

describe('calcLiquidationPrice', () => {
  it('롱: 계좌평가 − 유지증거금 만큼 하락 시 청산', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'long')
    expect(price).toBeCloseTo(-6632.5, 1)
  })

  it('숏: 계좌평가 − 유지증거금 만큼 상승 시 청산', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'short')
    expect(price).toBeCloseTo(7332.5, 1)
  })
})

describe('calcToleranceRate', () => {
  it('롱 하락율', () => {
    const rate = calcToleranceRate(350, 347.5, 'long')
    expect(rate).toBeCloseTo(0.714, 2)
  })
})

describe('calcToleranceDelta', () => {
  it('롱 하락폭', () => {
    expect(calcToleranceDelta(350, 347.5, 'long')).toBe(2.5)
  })

  it('숏 상승폭', () => {
    expect(calcToleranceDelta(350, 352.5, 'short')).toBe(2.5)
  })
})

describe('calcMaxBuyable', () => {
  it('위탁증거금이 계좌평가를 초과하면 0계약', () => {
    const entrusted = calcMarginFromNotional(
      calcContractNotional(2, 250_000, 1),
      0.1,
    )
    const perContract = calcContractNotional(1, 250_000, 1) * 0.1
    const { value } = calcMaxBuyable(10_000_000, entrusted, perContract)
    expect(value).toBe(398)
  })

  it('여유 증거금이 있으면 추가 매수 가능', () => {
    const entrusted = calcMarginFromNotional(
      calcContractNotional(1, 250_000, 1),
      0.1,
    )
    const perContract = calcContractNotional(1, 250_000, 1) * 0.1
    const { value } = calcMaxBuyable(20_000_000, entrusted, perContract)
    expect(value).toBe(799)
  })
})

describe('calculateEvaluate', () => {
  it('기본값으로 청산가·하락율 산출', () => {
    const result = calculateEvaluate(defaultInputs)
    expect(result.liquidationPrice).toBeCloseTo(-6632.5, 1)
    expect(result.toleranceRate).toBeCloseTo(1995, 0)
    expect(result.margins?.maintenanceMargin).toBe(25_000)
    expect(result.margins?.entrustedMargin).toBe(50_000)
    expect(result.margins?.availableMargin).toBe(25_000)
    expect(result.margins?.perContractEntrusted).toBe(25_000)
    expect(result.margins?.perContractMaintenance).toBe(12_500)
    expect(result.margins?.contractNotional).toBe(500_000)
    expect(result.toleranceDelta).toBeCloseTo(6982.5, 1)
  })

  it('약정금액·계약승수·비율로 유지증거금 산출', () => {
    const result = calculateEvaluate({
      ...defaultInputs,
      contracts: 10,
      contractAmount: 200_000,
      contractMultiplier: 10,
      maintenanceMarginRate: 0.2,
      currentPrice: 30_000,
    })
    expect(result.margins?.contractNotional).toBe(20_000_000)
    expect(result.margins?.maintenanceMargin).toBe(4_000_000)
  })

  it('직접 입력 유지증거금 우선', () => {
    const result = calculateEvaluate({
      ...defaultInputs,
      maintenanceMargin: 2_000_000,
    })
    expect(result.margins?.maintenanceMargin).toBe(2_000_000)
    expect(result.margins?.maintenanceMarginSource).toBe('direct')
    const pointValue = getPointValue(250_000, 1, 350)!
    expect(result.liquidationPrice).toBeCloseTo(
      calcLiquidationPrice(10_000_000, 2_000_000, 2, 350, pointValue, 'long')!,
      2,
    )
  })
})
