import { describe, expect, it } from 'vitest'
import { calcPositionNotional } from './margins'
import { calculateEvaluate } from './leverage'
import {
  calcIndexNotionalWon,
  isWonAccountIndexFieldMismatch,
} from './indexNotional'

const indexMismatchInputs = {
  mode: 'evaluate' as const,
  accountEval: 66_769,
  maintenanceMarginRate: 0.05,
  entrustedMarginRate: 0.1,
  contracts: 1,
  contractAmount: 303_500,
  contractMultiplier: 10,
  currentPrice: 320_500,
  positionSide: 'long' as const,
}

describe('isWonAccountIndexFieldMismatch', () => {
  it('지수×1000 약정·현재가 + 원화 계좌 → 혼용 감지', () => {
    expect(isWonAccountIndexFieldMismatch(indexMismatchInputs)).toBe(true)
  })

  it('원화 약정(ES) + 달러 계좌 → 미감지', () => {
    expect(
      isWonAccountIndexFieldMismatch({
        ...indexMismatchInputs,
        accountEval: 25_000,
        contractAmount: 250_000,
        contractMultiplier: 1,
        currentPrice: 5_000,
      }),
    ).toBe(false)
  })

  it('KOSPI 대형 계좌(원) + 지수×1000 약정 → 미감지', () => {
    expect(
      isWonAccountIndexFieldMismatch({
        ...indexMismatchInputs,
        accountEval: 73_511_744,
        contractAmount: 320_500,
        contracts: 58,
      }),
    ).toBe(false)
  })
})

describe('calcIndexNotionalWon', () => {
  it('현재가 지수×1000 기준 원화 명목', () => {
    expect(calcIndexNotionalWon(320_500, 1, 1)).toBe(16_025_000)
    expect(calcIndexNotionalWon(320_500, 1, 10)).toBe(160_250_000)
  })
})

describe('지수 혼용 입력 — 위탁증거금 과대 수정', () => {
  it('승수 10 × 지수 약정 — 기존 303,500원 위탁 오류 대신 원화 명목 기준 산출', () => {
    const notional = calcPositionNotional(indexMismatchInputs, 1)
    expect(notional).toBe(160_250_000)

    const result = calculateEvaluate(indexMismatchInputs)
    expect(result.margins?.entrustedMargin).toBe(16_025_000)
    // 잘못된 경로였을 값: 303_500 × 10 × 10% = 303_500
    expect(result.margins?.entrustedMargin).not.toBe(303_500)
  })

  it('미니 1계약(승수 1)도 원화 명목으로 환산', () => {
    const inputs = { ...indexMismatchInputs, contractMultiplier: 1 }
    const result = calculateEvaluate(inputs)
    expect(result.margins?.contractNotional).toBe(16_025_000)
    expect(result.margins?.entrustedMargin).toBe(1_602_500)
  })

})
