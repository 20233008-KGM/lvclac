import { describe, expect, it } from 'vitest'
import type { CalculatorInputs } from '../types'
import { isMarginKindAskCandidate } from './marginKindAskPref'

const totalOrder: CalculatorInputs = {
  mode: 'order',
  marginInputMode: 'total',
  maintenanceMargin: 4_000,
  entrustedMargin: 12_000,
  contracts: 2,
  currentPrice: 5_000,
  positionSide: 'long',
  orderContracts: 2,
}

describe('isMarginKindAskCandidate', () => {
  it('총액 모드 + 보유 + 주문 + 성격 미확정 → 물어봐야 함', () => {
    expect(isMarginKindAskCandidate(totalOrder)).toBe(true)
  })

  it('부분 청산(음수 주문)도 대상', () => {
    expect(isMarginKindAskCandidate({ ...totalOrder, orderContracts: -1 })).toBe(true)
  })

  it('성격이 이미 확정되면 안 물어봄', () => {
    expect(
      isMarginKindAskCandidate({ ...totalOrder, totalMarginKind: 'proportional' }),
    ).toBe(false)
    expect(
      isMarginKindAskCandidate({ ...totalOrder, totalMarginKind: 'fixed' }),
    ).toBe(false)
  })

  it('비율/계약당 모드는 대상 아님 (역산 정상 작동)', () => {
    expect(
      isMarginKindAskCandidate({ ...totalOrder, marginInputMode: 'rate' }),
    ).toBe(false)
    expect(
      isMarginKindAskCandidate({ ...totalOrder, marginInputMode: 'perContract' }),
    ).toBe(false)
  })

  it('주문 수량이 없거나 0이면 안 물어봄', () => {
    expect(isMarginKindAskCandidate({ ...totalOrder, orderContracts: undefined })).toBe(false)
    expect(isMarginKindAskCandidate({ ...totalOrder, orderContracts: 0 })).toBe(false)
  })

  it('보유 포지션이 없으면 안 물어봄 (역산이 무의미)', () => {
    expect(isMarginKindAskCandidate({ ...totalOrder, contracts: 0 })).toBe(false)
    expect(isMarginKindAskCandidate({ ...totalOrder, contracts: undefined })).toBe(false)
  })

  it('총액 모드지만 증거금을 아직 안 넣었으면 안 물어봄', () => {
    expect(
      isMarginKindAskCandidate({
        ...totalOrder,
        maintenanceMargin: undefined,
        entrustedMargin: undefined,
      }),
    ).toBe(false)
  })
})
