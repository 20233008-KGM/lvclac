import { describe, expect, it } from 'vitest'
import { resolveEffectiveAccountEval, isIndexScaleReferencePair } from './accountEval'
import { calculateEvaluate } from './leverage'
import { formatTolerancePercent } from '../utils/format'

describe('isIndexScaleReferencePair', () => {
  it('303500 vs 320500 — 지수 스케일 쌍', () => {
    expect(isIndexScaleReferencePair(303_500, 320_500)).toBe(true)
  })

  it('원 단위 명목 vs 지수 — 보정 제외', () => {
    expect(isIndexScaleReferencePair(16_025_000, 320_500)).toBe(false)
  })
})

describe('resolveEffectiveAccountEval — 탭만 전환', () => {
  it('지수×1000 + 원화 계좌 혼용 시 MTM 보정 생략', () => {
    const inputs = {
      mode: 'evaluate' as const,
      accountEval: 66_769,
      contracts: 1,
      contractAmount: 303_500,
      contractMultiplier: 1,
      currentPrice: 320_500,
      positionSide: 'short' as const,
      evalSnapshotSide: 'long' as const,
    }
    expect(resolveEffectiveAccountEval(inputs, 'long')).toBe(66_769)
  })

  it('원화 약정(ES) 혼용이 아니면 탭 전환 MTM 보정', () => {
    const inputs = {
      mode: 'evaluate' as const,
      accountEval: 50_000,
      contracts: 1,
      contractAmount: 4_900,
      contractMultiplier: 1,
      currentPrice: 5_000,
    }
    const longEval = resolveEffectiveAccountEval(
      { ...inputs, positionSide: 'long', evalSnapshotSide: 'long' },
      'long',
    )
    const shortEval = resolveEffectiveAccountEval(
      { ...inputs, positionSide: 'short', evalSnapshotSide: 'long' },
      'long',
    )
    expect(longEval).toBe(50_000)
    expect(shortEval).toBeLessThan(longEval)
  })
})

describe('추가 매수/매도 한도 — 롱·숏 탭 전환', () => {
  const base = {
    mode: 'evaluate' as const,
    accountEval: 66_769,
    maintenanceMarginRate: 0.05,
    entrustedMarginRate: 0.1,
    contracts: 1,
    contractAmount: 303_500,
    contractMultiplier: 1,
    currentPrice: 320_500,
    evalSnapshotSide: 'long' as const,
  }

  it('롱 입력 후 숏 탭: 가용증거금은 입력 평가금액 기준으로 동일', () => {
    const long = calculateEvaluate({ ...base, positionSide: 'long' })
    const short = calculateEvaluate({ ...base, positionSide: 'short' })

    expect(long.margins?.availableMargin).toBe(short.margins?.availableMargin)
    expect(long.margins?.availableMargin).toBe(66_769 - 1_602_500)
  })

  it('숏 탭 전환 시 청산가는 현재가 위에 위치', () => {
    const short = calculateEvaluate({ ...base, positionSide: 'short' })
    expect(short.liquidationPrice!).toBeGreaterThan(base.currentPrice)
    expect(formatTolerancePercent(short.toleranceRate, 'short')).toMatch(/^\+/)
  })
})
