import { describe, expect, it } from 'vitest'
import { applyInputPatch, calcLinkedEquity } from './mtmLink'
import type { CalculatorInputs } from '../types'

const base: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  accountEval: 10_000_000,
  currentPrice: 350,
  contracts: 2,
  contractMultiplier: 1,
  singleInstrument: true,
  mtmAnchorEquity: 10_000_000,
  mtmAnchorPrice: 350,
}

describe('calcLinkedEquity', () => {
  it('롱 — 현재가 +10 → 평가금액 + (10 × Q)', () => {
    expect(calcLinkedEquity(base, 360)).toBe(10_000_020)
  })

  it('숏 — 현재가 +10 → 평가금액 − (10 × Q)', () => {
    expect(calcLinkedEquity({ ...base, positionSide: 'short' }, 360)).toBe(9_999_980)
  })
})

describe('applyInputPatch', () => {
  it('연동 켜면 앵커 저장', () => {
    const prev: CalculatorInputs = {
      mode: 'evaluate',
      positionSide: 'long',
      accountEval: 5_000_000,
      currentPrice: 300,
    }
    const next = applyInputPatch(prev, { singleInstrument: true })
    expect(next.mtmAnchorEquity).toBe(5_000_000)
    expect(next.mtmAnchorPrice).toBe(300)
  })

  it('연동 중 현재가 변경 → 계좌 평가금액 갱신', () => {
    const next = applyInputPatch(base, { currentPrice: 345 })
    expect(next.accountEval).toBe(9_999_990)
    expect(next.mtmAnchorPrice).toBe(350)
    expect(next.mtmAnchorEquity).toBe(10_000_000)
  })

  it('연동 중 계좌 평가금액 직접 수정 → 앵커 갱신', () => {
    const next = applyInputPatch(base, { accountEval: 9_000_000 })
    expect(next.mtmAnchorEquity).toBe(9_000_000)
    expect(next.mtmAnchorPrice).toBe(350)
  })
})
