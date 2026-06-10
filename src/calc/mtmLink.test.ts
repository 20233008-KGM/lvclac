import { describe, expect, it } from 'vitest'
import {
  applyInputPatch,
  applyPriceMove,
  applyTickMove,
  calcPnlDelta,
  isScenarioModeActive,
  resolveEvaluationInputs,
  resolveMarginEquity,
} from './mtmLink'
import { calculateEvaluate } from './leverage'
import { sampleInputs, type CalculatorInputs } from '../types'

const base: CalculatorInputs = {
  mode: 'evaluate',
  positionSide: 'long',
  accountEval: 10_000_000,
  currentPrice: 350,
  contracts: 2,
  contractMultiplier: 1,
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
  it('시나리오 확정 — 손익 반영, 현재가·시나리오 유지', () => {
    const next = applyInputPatch(base, { commitScenarioPrice: 345 })
    expect(next.accountEval).toBe(9_999_990)
    expect(next.currentPrice).toBe(350)
    expect(next.contracts).toBe(base.contracts)
    expect(next.contractMultiplier).toBe(base.contractMultiplier)
    expect(next.scenarioPrice).toBe(345)
    expect(next.scenarioAppliedPrice).toBe(345)
    expect(next.scenarioRevertSnapshot?.accountEval).toBe(10_000_000)
    expect(isScenarioModeActive(next)).toBe(true)
  })

  it('시나리오 확정 — 다른 입력 필드·결과 계산 유지', () => {
    const full = { ...sampleInputs, tickSize: 5 }
    const before = calculateEvaluate(full)
    expect(before.margins).not.toBeNull()
    expect(before.liquidationPrice).not.toBeNull()

    const next = applyInputPatch(full, { commitScenarioPrice: 345 })
    expect(next.contracts).toBe(full.contracts)
    expect(next.contractAmount).toBe(full.contractAmount)
    expect(next.maintenanceMarginRate).toBe(full.maintenanceMarginRate)
    expect(next.entrustedMarginRate).toBe(full.entrustedMarginRate)

    const after = calculateEvaluate(next)
    expect(after.margins).not.toBeNull()
    expect(after.liquidationPrice).not.toBeNull()
    expect(after.liquidationPrice).toBe(before.liquidationPrice)
    expect(after.toleranceRate).not.toBe(before.toleranceRate)
    expect(after.margins!.availableMargin).not.toBe(before.margins!.availableMargin)
    expect(after.margins!.maintenanceExcess).not.toBe(before.margins!.maintenanceExcess)
    expect(after.leverageRatio).not.toBe(before.leverageRatio)
    expect(after.maxBuyable).not.toBe(before.maxBuyable)
    expect(resolveEvaluationInputs(next).currentPrice).toBe(345)
    expect(next.currentPrice).toBe(350)
  })

  it('시나리오 연속 확정 — 이전 확정가 기준 증분', () => {
    const once = applyInputPatch(base, { commitScenarioPrice: 345 })
    const twice = applyInputPatch(once, { commitScenarioPrice: 355 })
    expect(twice.accountEval).toBe(10_000_010)
    expect(twice.currentPrice).toBe(350)
    expect(twice.scenarioPrice).toBe(355)
  })

  it('clearScenario — 스냅샷 복원, 시나리오 가격 유지', () => {
    const committed = applyInputPatch(base, { commitScenarioPrice: 345 })
    const cleared = applyInputPatch(committed, { clearScenario: true })
    expect(isScenarioModeActive(cleared)).toBe(false)
    expect(cleared.accountEval).toBe(10_000_000)
    expect(cleared.scenarioPrice).toBe(345)
  })

  it('시나리오 draft만 — 모드 미진입', () => {
    const draft = applyInputPatch(base, { scenarioPrice: 360 })
    expect(isScenarioModeActive(draft)).toBe(false)
    expect(draft.accountEval).toBe(base.accountEval)
  })

  it('시나리오 모드 — currentPrice 변경 차단', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const blocked = applyInputPatch(preview, { currentPrice: 400 })
    expect(blocked.currentPrice).toBe(350)
    expect(blocked.accountEval).toBe(preview.accountEval)
  })

  it('시나리오 모드 — scenarioPrice onChange로 손익 증분', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const adjusted = applyInputPatch(preview, { scenarioPrice: 355 })
    expect(adjusted.accountEval).toBe(10_000_010)
    expect(adjusted.currentPrice).toBe(350)
    expect(adjusted.scenarioPrice).toBe(355)
    expect(isScenarioModeActive(adjusted)).toBe(true)
  })

  it('손익 반영 — 현재가 롤링·모드 종료', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const rolled = applyInputPatch(preview, { applyScenarioToMark: 345 })
    expect(rolled.accountEval).toBe(9_999_990)
    expect(rolled.currentPrice).toBe(345)
    expect(isScenarioModeActive(rolled)).toBe(false)
  })

  it('시나리오 모드 중 재확정 — 증분 손익 후 현재가 반영', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const rolled = applyInputPatch(preview, { applyScenarioToMark: 355 })
    expect(rolled.accountEval).toBe(10_000_010)
    expect(rolled.currentPrice).toBe(355)
    expect(isScenarioModeActive(rolled)).toBe(false)
  })

  it('currentPrice 직접 패치', () => {
    const next = applyInputPatch(base, { currentPrice: 400 })
    expect(next.currentPrice).toBe(400)
    expect(next.accountEval).toBe(10_000_000)
    expect(resolveMarginEquity(next)).toBe(10_000_000)
  })
})
