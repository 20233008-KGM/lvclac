import { describe, expect, it } from 'vitest'
import { calculateEvaluate, calculateOrder } from './leverage'
import {
  buildLiquidationParams,
  calcLiquidationPriceFromParams,
  calcLongLiquidationPrice,
  calcShortLiquidationPrice,
} from './liquidation'
import {
  isMaintenanceFixed,
  maintenanceMarginMode,
  resolveEntrustedMargin,
  resolveMaintenanceMargin,
  validateMarginRates,
} from './margins'
import { perContractMarginSampleInputs } from '../types'
import type { CalculatorInputs } from '../types'

/** 해외선물 계약당 고정 증거금 — 청산식 분기가 핵심 (가격 1포인트당 손익 = 계약수×승수) */
const fixedLong: CalculatorInputs = {
  mode: 'evaluate',
  marginInputMode: 'perContract',
  accountEval: 10_000,
  maintenanceMarginPerContract: 20,
  entrustedMarginPerContract: 50,
  contracts: 100,
  contractMultiplier: 1,
  currentPrice: 100,
  positionSide: 'long',
}

describe('perContract 모드 — 증거금 해석', () => {
  it('총 증거금 = 계약당 × 계약수', () => {
    const maint = resolveMaintenanceMargin(perContractMarginSampleInputs, 2)
    const ent = resolveEntrustedMargin(perContractMarginSampleInputs, 2)
    expect(maint.amount).toBe(2_000)
    expect(ent.amount).toBe(12_000)
  })

  it('계약수가 바뀌면 비례가 아니라 계약당 × 새 계약수', () => {
    expect(resolveMaintenanceMargin(perContractMarginSampleInputs, 5).amount).toBe(5_000)
  })

  it('유지증거금이 고정으로 표시된다', () => {
    expect(maintenanceMarginMode(perContractMarginSampleInputs)).toBe('perContract')
    expect(isMaintenanceFixed(perContractMarginSampleInputs)).toBe(true)
  })

  it('유지 계약당 > 개시 계약당이면 경고', () => {
    expect(
      validateMarginRates({
        ...perContractMarginSampleInputs,
        maintenanceMarginPerContract: 7_000,
        entrustedMarginPerContract: 6_000,
      }),
    ).toBe('maintenance_rate_exceeds_entrusted')
  })
})

describe('perContract 모드 — 고정 유지증거금 청산식', () => {
  it('롱: P = C0 + (Mfix − E0) / Q', () => {
    const params = buildLiquidationParams(fixedLong, 100)!
    expect(params.maintenanceFixed).toBe(true)
    expect(params.maintenanceAtCurrent).toBe(2_000)
    expect(calcLongLiquidationPrice(params)).toBeCloseTo(20, 6)
  })

  it('숏: P = C0 + (E0 − Mfix) / Q', () => {
    const params = buildLiquidationParams({ ...fixedLong, positionSide: 'short' }, 100)!
    expect(calcShortLiquidationPrice(params)).toBeCloseTo(180, 6)
  })

  it('고정 유지증거금은 가격에 비례하지 않는다 (비례식과 다른 결과)', () => {
    const params = buildLiquidationParams(fixedLong, 100)!
    const fixedPrice = calcLongLiquidationPrice(params)!
    const proportional = calcLongLiquidationPrice({ ...params, maintenanceFixed: false })!
    expect(fixedPrice).not.toBeCloseTo(proportional, 2)
  })

  it('약정금액 없이 현재가+계약수+계약당 증거금만으로 청산가 산출', () => {
    const result = calculateEvaluate(fixedLong)
    expect(result.liquidationPrice).toBeCloseTo(20, 6)
    expect(result.margins?.maintenanceMargin).toBe(2_000)
    expect(result.margins?.entrustedMargin).toBe(5_000)
    expect(result.margins?.perContractMaintenance).toBeCloseTo(20, 6)
    expect(result.margins?.perContractEntrusted).toBeCloseTo(50, 6)
  })

  it('숏 — 약정금액 없이 현재가 위 청산가', () => {
    const result = calculateEvaluate({ ...fixedLong, positionSide: 'short' })
    expect(result.liquidationPrice).toBeCloseTo(180, 6)
  })

  it('계약당 증거금 기준 추가 매수 한도', () => {
    const result = calculateEvaluate(fixedLong)
    // (E0 − 개시) / 계약당 개시 = (10000 − 5000) / 50 = 100
    expect(result.maxBuyable).toBe(100)
  })
})

describe('total 모드 — 명시 지정도 구버전 추론과 동일', () => {
  it('총액 직접입력은 계약수에 비례 조정', () => {
    const base: CalculatorInputs = {
      mode: 'evaluate',
      marginInputMode: 'total',
      accountEval: 50_000,
      maintenanceMargin: 2_000,
      entrustedMargin: 12_000,
      contracts: 2,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
    }
    expect(resolveMaintenanceMargin(base, 4).amount).toBe(4_000)
    expect(buildLiquidationParams(base, 2)!.maintenanceFixed).toBe(false)
  })

  it('총액 모드 유지증거금은 가격에 비례 — 청산가(문서 정답값)', () => {
    const totalLong: CalculatorInputs = {
      mode: 'evaluate',
      marginInputMode: 'total',
      accountEval: 3_600,
      maintenanceMargin: 2_000,
      entrustedMargin: 3_000,
      contracts: 2,
      contractMultiplier: 1,
      currentPrice: 5_000,
      positionSide: 'long',
    }
    expect(calculateEvaluate(totalLong).liquidationPrice).toBeCloseTo(4_000, 6)
    expect(
      calculateEvaluate({ ...totalLong, positionSide: 'short' }).liquidationPrice,
    ).toBeCloseTo(5_666.6667, 3)
  })
})

describe('주문 div — 계약당 고정 모드 주문 시뮬', () => {
  it('주문 후 유지증거금은 새 계약수 × 계약당', () => {
    const result = calculateOrder({ ...fixedLong, mode: 'order', orderContracts: 10 })
    // 보유 100 + 주문 10 = 110 계약 → 유지 110 × 20 = 2,200
    expect(result.afterMargins?.maintenanceMargin).toBe(2_200)
  })
})
