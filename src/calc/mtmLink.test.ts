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
  it('시나리오 모드 진입 — 손익·현재가 유지', () => {
    const next = applyInputPatch(base, { commitScenarioPrice: 345 })
    expect(next.accountEval).toBe(10_000_000)
    expect(next.currentPrice).toBe(350)
    expect(next.contracts).toBe(base.contracts)
    expect(next.contractMultiplier).toBe(base.contractMultiplier)
    expect(next.scenarioPrice).toBe(345)
    expect(next.scenarioAppliedPrice).toBeUndefined()
    expect(next.scenarioRevertSnapshot?.accountEval).toBe(10_000_000)
    expect(isScenarioModeActive(next)).toBe(true)
  })

  it('시나리오 모드 진입 — 결과만 시나리오 가격 기준 미리보기', () => {
    const full = { ...sampleInputs, tickSize: 5 }
    const before = calculateEvaluate(full)
    expect(before.margins).not.toBeNull()
    expect(before.liquidationPrice).not.toBeNull()

    const next = applyInputPatch(full, { commitScenarioPrice: 320 })
    expect(next.contracts).toBe(full.contracts)
    expect(next.contractAmount).toBe(full.contractAmount)
    expect(next.maintenanceMarginRate).toBe(full.maintenanceMarginRate)
    expect(next.entrustedMarginRate).toBe(full.entrustedMarginRate)

    const after = calculateEvaluate(next)
    expect(after.margins).not.toBeNull()
    expect(after.liquidationPrice).not.toBeNull()
    expect(after.toleranceRate).not.toBe(before.toleranceRate)
    expect(after.toleranceDelta).not.toBe(before.toleranceDelta)
    expect(after.margins!.availableMargin).not.toBe(before.margins!.availableMargin)
    expect(after.margins!.maintenanceExcess).not.toBe(before.margins!.maintenanceExcess)
    expect(after.leverageRatio).not.toBe(before.leverageRatio)
    expect(after.maxBuyable).not.toBe(before.maxBuyable)
    expect(after.margins!.perContractMaintenance).toBe(before.margins!.perContractMaintenance)
    expect(after.margins!.perContractEntrusted).toBe(before.margins!.perContractEntrusted)
    expect(after.margins!.contractNotional).toBe(before.margins!.contractNotional)
    expect(after.margins!.maintenanceMargin).toBe(before.margins!.maintenanceMargin)
    expect(after.margins!.entrustedMargin).toBe(before.margins!.entrustedMargin)
    expect(resolveEvaluationInputs(next).currentPrice).toBe(320)
    expect(resolveEvaluationInputs(next).accountEval).toBe(9_999_940)
    expect(next.currentPrice).toBe(350)
    expect(resolveMarginEquity(next)).toBe(full.accountEval)
  })

  it('시나리오 모드 — 가격 조정 시 미리보기만 갱신', () => {
    const once = applyInputPatch(base, { commitScenarioPrice: 345 })
    const twice = applyInputPatch(once, { scenarioPrice: 355 })
    expect(twice.accountEval).toBe(10_000_000)
    expect(twice.currentPrice).toBe(350)
    expect(twice.scenarioPrice).toBe(355)
    expect(resolveEvaluationInputs(once).currentPrice).toBe(345)
    expect(resolveEvaluationInputs(twice).currentPrice).toBe(355)
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

  it('시나리오 모드 — scenarioPrice onChange는 미리보기만 갱신', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const adjusted = applyInputPatch(preview, { scenarioPrice: 355 })
    expect(adjusted.accountEval).toBe(10_000_000)
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

  it('시나리오 모드 — 반영 시 현재가 기준 손익 적용', () => {
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
