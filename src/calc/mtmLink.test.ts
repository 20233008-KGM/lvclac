import { describe, expect, it } from 'vitest'
import { applyInputPatch, applyPriceMove, applyTickMove, calcPnlDelta } from './mtmLink'
import type { CalculatorInputs } from '../types'

const base: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  accountEval: 10_000_000,
  currentPrice: 350,
  contracts: 2,
  contractMultiplier: 1,
  singleInstrument: true,
  tickSize: 5,
}

describe('calcPnlDelta', () => {
  it('롱 — 가격 +10, Q=2 → +20', () => {
    expect(calcPnlDelta(base, 10)).toBe(20)
  })

  it('숏 — 가격 +10, Q=2 → -20', () => {
    expect(calcPnlDelta({ ...base, positionSide: 'short' }, 10)).toBe(-20)
  })
})

describe('applyPriceMove', () => {
  it('롤링 — 350→345, equity -10', () => {
    const moved = applyPriceMove(base, 345)
    expect(moved?.accountEval).toBe(9_999_990)
    expect(moved?.currentPrice).toBe(345)
    expect(moved?.scenarioPrice).toBeUndefined()
  })

  it('두 번째 이동은 갱신된 현재가 기준', () => {
    const afterFirst = { ...base, accountEval: 9_999_990, currentPrice: 345 }
    const moved = applyPriceMove(afterFirst, 340)
    expect(moved?.accountEval).toBe(9_999_980)
    expect(moved?.currentPrice).toBe(340)
  })
})

describe('applyTickMove', () => {
  it('틱 +1 → equity +10, currentPrice +5', () => {
    const moved = applyTickMove(base, 1)
    expect(moved?.accountEval).toBe(10_000_010)
    expect(moved?.currentPrice).toBe(355)
  })
})

describe('applyInputPatch', () => {
  it('시나리오 blur 확정', () => {
    const next = applyInputPatch(base, { commitScenarioPrice: 345 })
    expect(next.accountEval).toBe(9_999_990)
    expect(next.currentPrice).toBe(345)
    expect(next.scenarioPrice).toBeUndefined()
  })

  it('현재가 blur 확정', () => {
    const next = applyInputPatch(base, { commitCurrentPrice: 360 })
    expect(next.accountEval).toBe(10_000_020)
    expect(next.currentPrice).toBe(360)
  })

  it('tickCurrentPrice 스테퍼', () => {
    const next = applyInputPatch(base, { tickCurrentPrice: 1 })
    expect(next.accountEval).toBe(10_000_010)
    expect(next.currentPrice).toBe(355)
  })

  it('시나리오 draft 저장 — equity 불변', () => {
    const next = applyInputPatch(base, { scenarioPrice: 360 })
    expect(next.scenarioPrice).toBe(360)
    expect(next.accountEval).toBe(10_000_000)
    expect(next.currentPrice).toBe(350)
  })

  it('단일종목 OFF → tick/scenario 초기화', () => {
    const prev = { ...base, scenarioPrice: 360, tickSize: 5 }
    const next = applyInputPatch(prev, { singleInstrument: false })
    expect(next.singleInstrument).toBe(false)
    expect(next.scenarioPrice).toBeUndefined()
    expect(next.tickSize).toBeUndefined()
  })

  it('단일종목 ON 시 currentPrice 직접 패치 무시', () => {
    const next = applyInputPatch(base, { currentPrice: 400 })
    expect(next.currentPrice).toBe(350)
  })

  it('단일종목 OFF 시 currentPrice 직접 패치 허용', () => {
    const prev = { ...base, singleInstrument: false }
    const next = applyInputPatch(prev, { currentPrice: 400 })
    expect(next.currentPrice).toBe(400)
  })
})
