/**
 * 숏 포지션 — 계산값이 롱과 구분되는지, UI 표시용 포맷이 올바른지 검증
 * Q = N × 계약승수 (ES 예: N=1, M=1 → Q=1)
 */
import { describe, expect, it } from 'vitest'
import { calculateEvaluate, calculateOrder } from './leverage'
import { formatToleranceDelta, formatTolerancePercent } from '../utils/format'
import { maxAddableLabel } from '../utils/positionLabels'
import { ko } from '../i18n/locales/ko'
import { en } from '../i18n/locales/en'

const kospiCompareBase = {
  mode: 'evaluate' as const,
  accountEval: 73_511_744,
  maintenanceMarginRate: 0.247,
  entrustedMarginRate: 0.35,
  contracts: 58,
  contractAmount: 320_500,
  contractMultiplier: 10,
  currentPrice: 320_500,
}

const esShortBase = {
  mode: 'evaluate' as const,
  accountEval: 25_000,
  maintenanceMarginRate: 0.04,
  entrustedMarginRate: 0.08,
  contracts: 1,
  contractAmount: 250_000,
  contractMultiplier: 1,
  currentPrice: 5_000,
  positionSide: 'short' as const,
}

describe('숏 vs 롱 — 동일 입력에서 청산가·버퍼 비대칭', () => {
  const longInputs = { ...kospiCompareBase, positionSide: 'long' as const }
  const shortInputs = { ...kospiCompareBase, positionSide: 'short' as const }

  it('청산가가 현재가 기준 롱/숏 반대편에 위치', () => {
    const long = calculateEvaluate(longInputs)
    const short = calculateEvaluate(shortInputs)

    expect(long.liquidationPrice).toBeCloseTo(257_312, -1)
    expect(short.liquidationPrice).toBeCloseTo(358_656, 0)

    const price = kospiCompareBase.currentPrice!
    expect(long.liquidationPrice! < price).toBe(true)
    expect(short.liquidationPrice! > price).toBe(true)
  })

  it('숏 버퍼 < 롱 버퍼 (Equity vs Maintenance 모델)', () => {
    const long = calculateEvaluate(longInputs)
    const short = calculateEvaluate(shortInputs)

    expect(long.toleranceRate).toBeCloseTo(19.72, 1)
    expect(short.toleranceRate).toBeCloseTo(11.91, 1)
    expect(short.toleranceRate!).toBeLessThan(long.toleranceRate!)

    expect(formatTolerancePercent(long.toleranceRate, 'long')).toBe('-19.72')
    expect(formatTolerancePercent(short.toleranceRate, 'short')).toBe('+11.91')
  })

  it('가격 변동폭 — 롱 하락(-), 숏 상승(+)', () => {
    const short = calculateEvaluate({ ...esShortBase, positionSide: 'short' })
    expect(short.toleranceDelta).toBeCloseTo(23_846, 0)
    expect(formatToleranceDelta(short.toleranceDelta, 'short')).toBe('+23,846')
    expect(formatToleranceDelta(short.toleranceDelta, 'long')).toBe('-23,846')
  })

  it('증거금 명목·위탁은 포지션 방향과 무관 (동일)', () => {
    const long = calculateEvaluate(longInputs)
    const short = calculateEvaluate(shortInputs)

    expect(long.margins?.maintenanceMargin).toBe(short.margins?.maintenanceMargin)
    expect(long.margins?.entrustedMargin).toBe(short.margins?.entrustedMargin)
    expect(long.maxBuyable).toBe(short.maxBuyable)
  })

  it('추가 매수/매도 한도 라벨이 포지션에 따라 구분', () => {
    expect(maxAddableLabel('long', ko.results)).toBe('추가 매수 한도')
    expect(maxAddableLabel('short', ko.results)).toBe('추가 매도 한도')
    expect(maxAddableLabel('long', en.results)).toBe('Addl. buy limit')
    expect(maxAddableLabel('short', en.results)).toBe('Addl. sell limit')
  })

  it('결과에 positionSide가 포함되어 UI와 동기화', () => {
    expect(calculateEvaluate(longInputs).positionSide).toBe('long')
    expect(calculateEvaluate(shortInputs).positionSide).toBe('short')
    expect(
      formatTolerancePercent(
        calculateEvaluate(longInputs).toleranceRate,
        calculateEvaluate(longInputs).positionSide,
      ),
    ).toBe('-19.72')
    expect(
      formatTolerancePercent(
        calculateEvaluate(shortInputs).toleranceRate,
        calculateEvaluate(shortInputs).positionSide,
      ),
    ).toBe('+11.91')
  })
})

describe('숏 주문 시뮬 — 청산가가 현재가 위에서 변동', () => {
  it('ES 숏 1→2계약: 청산가 하락(위험 증가)', () => {
    const result = calculateOrder({
      ...esShortBase,
      mode: 'order',
      accountEval: 50_000,
      orderContracts: 1,
    })

    expect(result.beforeLiquidation).toBeCloseTo(52_885, 0)
    expect(result.afterLiquidation).toBeCloseTo(28_846, 0)
    expect(result.liquidationDelta).toBeCloseTo(-24_038, 0)
    expect(result.beforeLiquidation! > esShortBase.currentPrice!).toBe(true)
    expect(result.afterLiquidation! > esShortBase.currentPrice!).toBe(true)
  })

  it('ES 숏 2→1계약(환매): 청산가 상승(여유 증가)', () => {
    const result = calculateOrder({
      ...esShortBase,
      mode: 'order',
      contracts: 2,
      orderContracts: -1,
    })

    expect(result.beforeLiquidation).toBeCloseTo(16_827, 0)
    expect(result.afterLiquidation).toBeCloseTo(28_846, 0)
    expect(result.liquidationDelta).toBeCloseTo(12_019, 0)
  })

  it('숏 탭 전환 시 주문 전 가용증거금·청산이 평가 결과와 일치', () => {
    const base = {
      mode: 'order' as const,
      accountEval: 66_769,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 1,
      contractAmount: 303_500,
      contractMultiplier: 1,
      currentPrice: 320_500,
      evalSnapshotSide: 'long' as const,
      orderContracts: 1,
    }

    const evaluate = calculateEvaluate({ ...base, mode: 'evaluate', positionSide: 'short' })
    const order = calculateOrder({ ...base, positionSide: 'short' })

    expect(order.positionSide).toBe('short')
    expect(order.beforeLiquidation).toBe(evaluate.liquidationPrice)
    expect(order.beforeTolerance).toBe(evaluate.toleranceRate)
    expect(order.beforeMargins?.availableMargin).toBe(evaluate.margins?.availableMargin)
    expect(formatTolerancePercent(order.beforeTolerance, 'short')).toMatch(/^\+/)
    expect(order.beforeLiquidation!).toBeGreaterThan(base.currentPrice)
  })

  it('숏 환매 시 afterTolerance는 + 부호 유지', () => {
    const result = calculateOrder({
      ...esShortBase,
      mode: 'order',
      contracts: 2,
      orderContracts: -1,
    })

    expect(formatTolerancePercent(result.afterTolerance, 'short')).toMatch(/^\+/)
  })
})
