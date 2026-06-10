import { describe, expect, it } from 'vitest'
import { calculateEvaluate } from './leverage'
import {
  buildLiquidationParams,
  calcLongLiquidationPrice,
  calcShortLiquidationPrice,
  calcToleranceRate,
  calcTotalQuantity,
} from './liquidation'

/** 사용자 제공 KOSPI200 시나리오 — Q = N×M = 580 */
const kospiInputs = {
  mode: 'evaluate' as const,
  accountEval: 73_511_744,
  maintenanceMarginRate: 0.247,
  entrustedMarginRate: 0.35,
  contracts: 58,
  contractAmount: 320_500,
  contractMultiplier: 10,
  currentPrice: 320_500,
}

describe('KOSPI200 사용자 시나리오 — 롱/숏 분리 엔진', () => {
  it('Q = N × 계약승수 = 58 × 10 = 580', () => {
    expect(calcTotalQuantity(kospiInputs, 58)).toBe(580)
  })

  it('약정금액과 무관 — Q는 N×M만 사용', () => {
    const params = buildLiquidationParams(
      { ...kospiInputs, contractAmount: 303_500, positionSide: 'long' },
      58,
    )!
    expect(params.totalQuantity).toBe(580)
    expect(calcLongLiquidationPrice(params)).toBeCloseTo(257_312, -1)
  })

  it('LONG: 청산가 ≈ 257,312 / 버퍼 ≈ 19.72%', () => {
    const params = buildLiquidationParams(
      { ...kospiInputs, positionSide: 'long' },
      58,
    )!
    const price = calcLongLiquidationPrice(params)!
    const rate = calcToleranceRate(320_500, price, 'long')!

    expect(price).toBeCloseTo(257_312, -1)
    expect(rate).toBeCloseTo(19.72, 1)
  })

  it('SHORT: 청산가 ≈ 358,656 / 버퍼 ≈ 11.91% (롱보다 작음)', () => {
    const params = buildLiquidationParams(
      { ...kospiInputs, positionSide: 'short' },
      58,
    )!
    const price = calcShortLiquidationPrice(params)!
    const rate = calcToleranceRate(320_500, price, 'short')!

    // 손계산(580×0.247=143.26 반올림) ≈ 358,668 — 엔진은 M(C0)/C0 정밀값 사용
    expect(price).toBeCloseTo(358_656, 0)
    expect(rate).toBeCloseTo(11.91, 1)
  })

  it('동일 E0에서 숏 버퍼 < 롱 버퍼', () => {
    const long = calculateEvaluate({ ...kospiInputs, positionSide: 'long' })
    const short = calculateEvaluate({ ...kospiInputs, positionSide: 'short' })

    expect(long.toleranceRate).toBeCloseTo(19.72, 1)
    expect(short.toleranceRate).toBeCloseTo(11.91, 1)
    expect(short.toleranceRate!).toBeLessThan(long.toleranceRate!)
    expect(short.liquidationPrice!).toBeGreaterThan(kospiInputs.currentPrice)
    expect(long.liquidationPrice!).toBeLessThan(kospiInputs.currentPrice)
  })
})

describe('calcLongLiquidationPrice — 경계', () => {
  it('R ≥ 1 수준: 분모 ≤ 0 → null', () => {
    const price = calcLongLiquidationPrice({
      equity: 1_000_000,
      currentPrice: 100,
      totalQuantity: 10,
      maintenanceAtCurrent: 100 * 10 * 1,
    })
    expect(price).toBeNull()
  })
})

describe('calcShortLiquidationPrice — 경계', () => {
  it('항상 양의 분모 → 청산가 산출', () => {
    const price = calcShortLiquidationPrice({
      equity: 1_000_000,
      currentPrice: 100,
      totalQuantity: 10,
      maintenanceAtCurrent: 50,
    })
    expect(price).toBeGreaterThan(100)
  })
})
