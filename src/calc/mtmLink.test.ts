import { describe, expect, it } from 'vitest'
import {
  applyInputPatch,
  applyPriceMove,
  applyTickMove,
  calcPnlDelta,
  isOrderScenarioModeActive,
  isPreviewModeActive,
  isScenarioModeActive,
  resolveEvaluationInputs,
  resolveMarginEquity,
} from './mtmLink'
import { calculateEvaluate, calculateOrder, captureOrderScenarioBaseline } from './leverage'
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
    const full = {
      ...sampleInputs,
      tickSize: 5,
      contractAmount: 320_500,
      currentPrice: 320_500,
      contracts: 58,
      contractMultiplier: 10,
      maintenanceMarginRate: 0.247,
      entrustedMarginRate: 0.35,
      accountEval: 73_511_744,
    }
    const before = calculateEvaluate(full)
    expect(before.margins).not.toBeNull()
    expect(before.liquidationPrice).not.toBeNull()

    const next = applyInputPatch(full, { commitScenarioPrice: 320_000 })
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
    expect(after.margins!.perContractMaintenance).toBe(before.margins!.perContractMaintenance)
    expect(after.margins!.perContractEntrusted).toBe(before.margins!.perContractEntrusted)
    expect(after.margins!.contractNotional).toBe(before.margins!.contractNotional)
    expect(after.margins!.maintenanceMargin).toBe(before.margins!.maintenanceMargin)
    expect(after.margins!.entrustedMargin).toBe(before.margins!.entrustedMargin)
    expect(resolveEvaluationInputs(next).currentPrice).toBe(320_000)
    expect(resolveEvaluationInputs(next).accountEval).toBeLessThan(full.accountEval!)
    expect(next.currentPrice).toBe(320_500)
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

  it('clearScenario — 스냅샷 복원, 시나리오 가격 입력값 유지', () => {
    const committed = applyInputPatch(base, { commitScenarioPrice: 345 })
    const adjusted = applyInputPatch(committed, { scenarioPrice: 355 })
    const cleared = applyInputPatch(adjusted, { clearScenario: true })
    expect(isScenarioModeActive(cleared)).toBe(false)
    expect(cleared.accountEval).toBe(10_000_000)
    expect(cleared.currentPrice).toBe(350)
    expect(cleared.scenarioPrice).toBe(355)
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

  it('손익 반영 — Ctrl+Z로 시나리오 미리보기 복원', () => {
    const preview = applyInputPatch(base, { commitScenarioPrice: 345 })
    const rolled = applyInputPatch(preview, { applyScenarioToMark: 345 })
    expect(rolled.scenarioApplyUndoSnapshot?.accountEval).toBe(10_000_000)
    expect(rolled.scenarioApplyUndoSnapshot?.currentPrice).toBe(350)
    expect(rolled.scenarioApplyUndoSnapshot?.scenarioPrice).toBe(345)

    const undone = applyInputPatch(rolled, { undoScenarioApply: true })
    expect(undone.accountEval).toBe(10_000_000)
    expect(undone.currentPrice).toBe(350)
    expect(undone.scenarioPrice).toBe(345)
    expect(isScenarioModeActive(undone)).toBe(true)
    expect(undone.scenarioApplyUndoSnapshot).toBeUndefined()
    expect(resolveEvaluationInputs(undone).currentPrice).toBe(345)
    expect(resolveEvaluationInputs(undone).accountEval).toBe(9_999_990)
  })

  it('currentPrice 직접 패치', () => {
    const next = applyInputPatch(base, { currentPrice: 400 })
    expect(next.currentPrice).toBe(400)
    expect(next.accountEval).toBe(10_000_000)
    expect(resolveMarginEquity(next)).toBe(10_000_000)
  })
})

const orderBase: CalculatorInputs = {
  ...sampleInputs,
  tickSize: 5,
  contractAmount: 320_500,
  currentPrice: 320_500,
  contracts: 58,
  contractMultiplier: 10,
  maintenanceMarginRate: 0.247,
  entrustedMarginRate: 0.35,
  accountEval: 73_511_744,
  orderContracts: 1,
  orderPrice: 320_000,
}

describe('주문 시나리오', () => {
  it('진입 — stored contracts/accountEval 유지, evaluate만 post-order', () => {
    const before = calculateEvaluate(orderBase)
    expect(before.liquidationPrice).not.toBeNull()
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const next = applyInputPatch(orderBase, { commitOrderScenario: baseline })

    expect(isOrderScenarioModeActive(next)).toBe(true)
    expect(next.contracts).toBe(orderBase.contracts)
    expect(next.accountEval).toBe(orderBase.accountEval)
    expect(resolveEvaluationInputs(next).contracts).toBe(59)
    const after = calculateEvaluate(next)
    expect(after.liquidationPrice).not.toBeNull()
    expect(after.margins?.maintenanceExcess).not.toBe(before.margins?.maintenanceExcess)
  })

  it('진입 시 baseline = 진입 직전 after 지표', () => {
    const draft = calculateOrder(orderBase)
    const baseline = captureOrderScenarioBaseline(draft)
    const preview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    const inMode = calculateOrder(preview)

    expect(inMode.beforeLiquidation).toBe(draft.afterLiquidation)
    expect(inMode.beforeMargins?.maintenanceExcess).toBe(
      draft.afterMargins?.maintenanceExcess ?? null,
    )
  })

  it('모드 중 orderContracts 변경 — after만 갱신, before 고정', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const preview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    const beforeAdjust = calculateOrder(preview)
    expect(beforeAdjust.afterMargins).not.toBeNull()
    const adjusted = applyInputPatch(preview, { orderContracts: 2 })
    const afterAdjust = calculateOrder(adjusted)

    expect(afterAdjust.beforeLiquidation).toBe(beforeAdjust.beforeLiquidation)
    expect(afterAdjust.afterMargins?.maintenanceExcess).not.toBe(
      beforeAdjust.afterMargins?.maintenanceExcess,
    )
  })

  it('Esc — 진입 전 복원, 주문 필드 유지', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const preview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    const cleared = applyInputPatch(preview, { clearOrderScenario: true })

    expect(isOrderScenarioModeActive(cleared)).toBe(false)
    expect(cleared.accountEval).toBe(orderBase.accountEval)
    expect(cleared.contracts).toBe(orderBase.contracts)
    expect(cleared.orderContracts).toBe(1)
    expect(cleared.orderPrice).toBe(320_000)
  })

  it('Enter 2 — contracts/equity 반영, 모드 종료', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const preview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })

    expect(isOrderScenarioModeActive(applied)).toBe(false)
    expect(applied.contracts).toBe(59)
    expect(applied.accountEval).toBeGreaterThan(orderBase.accountEval!)
    expect(applied.orderContracts).toBeUndefined()
    expect(applied.orderPrice).toBeUndefined()
  })

  it('Ctrl+Z — 확정 취소 후 미리보기 복귀', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const preview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    const applied = applyInputPatch(preview, { applyOrderScenario: true })
    const undone = applyInputPatch(applied, { undoOrderApply: true })

    expect(isOrderScenarioModeActive(undone)).toBe(true)
    expect(undone.contracts).toBe(orderBase.contracts)
    expect(undone.orderContracts).toBe(1)
    expect(undone.orderApplyUndoSnapshot).toBeUndefined()
  })

  it('가격 시나리오와 상호 배타', () => {
    const pricePreview = applyInputPatch(orderBase, { commitScenarioPrice: 345 })
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const blocked = applyInputPatch(pricePreview, { commitOrderScenario: baseline })

    expect(isOrderScenarioModeActive(blocked)).toBe(false)
    expect(isScenarioModeActive(blocked)).toBe(true)
  })

  it('isPreviewModeActive — 가격·주문 시나리오', () => {
    const baseline = captureOrderScenarioBaseline(calculateOrder(orderBase))
    const orderPreview = applyInputPatch(orderBase, { commitOrderScenario: baseline })
    expect(isPreviewModeActive(orderPreview)).toBe(true)
  })
})
