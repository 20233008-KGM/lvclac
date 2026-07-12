import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import { buildAfterOrderInputs, calculateOrder } from './leverage'

/**
 * 총액(total) 모드에서 주문 시뮬 시 개시·유지 증거금이 주문 후 약정금액에
 * 맞춰 역산되는지 검증. (역산 = 주문 전/후 명목가치 비율로 재계산)
 */
describe('총액 모드 주문 시뮬 증거금 역산', () => {
  const base: CalculatorInputs = {
    mode: 'order',
    marginInputMode: 'total',
    accountEval: 1_000_000,
    maintenanceMargin: 4_000, // 2계약 기준 총 유지증거금
    entrustedMargin: 12_000, // 2계약 기준 총 개시증거금
    contracts: 2,
    contractAmount: 5_000, // 진입가 5000
    contractAmountRole: 'entryPrice',
    contractMultiplier: 1,
    currentPrice: 5_000,
    positionSide: 'long',
    orderContracts: 2,
    orderPrice: 5_000,
  }

  it('주문가=진입가: 2계약→4계약이면 총 증거금도 정확히 2배', () => {
    const r = calculateOrder(base)
    expect(r.beforeMargins?.entrustedMargin).toBe(12_000)
    expect(r.beforeMargins?.maintenanceMargin).toBe(4_000)
    expect(r.afterMargins?.entrustedMargin).toBe(24_000)
    expect(r.afterMargins?.maintenanceMargin).toBe(8_000)
  })

  it('주문가≠진입가: 평균단가 변화까지 명목 비례로 반영', () => {
    // 2계약@5000 + 2계약@6000 → 평균 5500, 명목 5500×4=22000 (before 5000×2=10000)
    // 비율 2.2 → 개시 12000×2.2=26400, 유지 4000×2.2=8800
    const r = calculateOrder({ ...base, orderPrice: 6_000 })
    expect(r.afterContractAmount).toBe(5_500)
    expect(r.afterMargins?.entrustedMargin).toBeCloseTo(26_400, 6)
    expect(r.afterMargins?.maintenanceMargin).toBeCloseTo(8_800, 6)
  })

  it('부분 청산(계약수 감소)도 비례로 축소', () => {
    // 2계약 → -1계약 = 1계약, 명목 5000×1=5000 (before 10000) 비율 0.5
    const r = calculateOrder({ ...base, orderContracts: -1 })
    expect(r.afterMargins?.entrustedMargin).toBeCloseTo(6_000, 6)
    expect(r.afterMargins?.maintenanceMargin).toBeCloseTo(2_000, 6)
  })

  it('buildAfterOrderInputs가 total 증거금 필드를 직접 역산', () => {
    const after = buildAfterOrderInputs(base, 4, 2)
    expect(after.entrustedMargin).toBe(24_000)
    expect(after.maintenanceMargin).toBe(8_000)
    expect(after.contracts).toBe(4)
  })
})

describe('총액 모드 — 계약당 고정(fixed) 성격 선택 시', () => {
  const base: CalculatorInputs = {
    mode: 'order',
    marginInputMode: 'total',
    totalMarginKind: 'fixed',
    accountEval: 1_000_000,
    maintenanceMargin: 4_000,
    entrustedMargin: 12_000,
    contracts: 2,
    contractAmount: 5_000,
    contractAmountRole: 'entryPrice',
    contractMultiplier: 1,
    currentPrice: 5_000,
    positionSide: 'long',
    orderContracts: 2,
    orderPrice: 6_000, // 진입가와 다름 — 비례/고정이 갈리는 조건
  }

  it('주문가가 진입가와 달라도 계약수 비례만 (명목 변화 무시)', () => {
    // fixed: 2계약→4계약 = 2배. 개시 24000, 유지 8000 (proportional이면 26400/8800)
    const r = calculateOrder(base)
    expect(r.afterMargins?.entrustedMargin).toBe(24_000)
    expect(r.afterMargins?.maintenanceMargin).toBe(8_000)
  })

  it('proportional(기본)과 값이 갈림을 확인', () => {
    const proportional = calculateOrder({ ...base, totalMarginKind: 'proportional' })
    expect(proportional.afterMargins?.entrustedMargin).toBeCloseTo(26_400, 6)
    // fixed는 24000 → 두 방식이 실제로 다름
    const fixed = calculateOrder(base)
    expect(fixed.afterMargins?.entrustedMargin).toBe(24_000)
  })
})

describe('다른 증거금 모드 회귀 — 주문 시뮬 정상 유지', () => {
  const common: CalculatorInputs = {
    mode: 'order',
    accountEval: 1_000_000,
    contracts: 2,
    contractAmount: 5_000,
    contractAmountRole: 'entryPrice',
    contractMultiplier: 1,
    currentPrice: 5_000,
    positionSide: 'long',
    orderContracts: 2,
    orderPrice: 5_000,
  }

  it('rate(비율) 모드: 명목 비례로 정상 스케일', () => {
    const r = calculateOrder({
      ...common,
      marginInputMode: 'rate',
      maintenanceMarginRate: 0.4,
      entrustedMarginRate: 1.2,
    })
    expect(r.beforeMargins?.entrustedMargin).toBe(12_000)
    expect(r.afterMargins?.entrustedMargin).toBe(24_000)
  })

  it('perContract(계약당 고정) 모드: 계약수 비례로 정상 스케일', () => {
    const r = calculateOrder({
      ...common,
      marginInputMode: 'perContract',
      maintenanceMarginPerContract: 2_000,
      entrustedMarginPerContract: 6_000,
    })
    expect(r.beforeMargins?.entrustedMargin).toBe(12_000)
    expect(r.afterMargins?.entrustedMargin).toBe(24_000)
  })
})
