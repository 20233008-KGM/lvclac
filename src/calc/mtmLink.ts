import type { CalculatorInputs, OrderScenarioBaseline, PositionSide } from '../types'
import { buildAfterOrderInputs } from './leverage'
import { calcTotalQuantity } from './liquidation/common'

export type CalculatorInputPatch = Partial<CalculatorInputs> & {
  /** 시나리오 가격 Enter — 시나리오 모드 진입 (손익·현재가 유지) */
  commitScenarioPrice?: number
  /** 현재가 blur 확정 */
  commitCurrentPrice?: number
  /** 현재가 스테퍼 ±1틱 */
  tickCurrentPrice?: 1 | -1
  /** 시나리오 가격 삭제 및 적용 전 상태 복원 */
  clearScenario?: true
  /** 시나리오 → 현재가 롤링 + 손익 반영 + 시나리오 모드 종료 */
  applyScenarioToMark?: number
  /** 손익 반영 취소 — 시나리오 미리보기 복원 */
  undoScenarioApply?: true
  applyMarkPrice?: number
  /** 같은 제스처(드래그/꾹누르기) 중간 호출 — true면 markPriceUndoSnapshot을 새로 캡처하지 않고 유지 */
  preserveMarkPriceUndoSnapshot?: true
  undoMarkPrice?: true
  /** 주문 시나리오 Enter — baseline과 함께 미리보기 진입 */
  commitOrderScenario?: OrderScenarioBaseline
  /** 주문 시나리오 Esc — 진입 전 상태 복원 */
  clearOrderScenario?: true
  /** 주문 시나리오 Enter 2 — 계좌에 주문 반영 */
  applyOrderScenario?: true
  /** 주문 반영 취소 — 미리보기 복귀 */
  undoOrderApply?: true
}

export interface ScenarioRevertSnapshot {
  accountEval: number
  mtmPriceAnchor?: number
  evalSnapshotSide?: PositionSide
}

/** 가격 변화량에 대한 손익 — Key_Formula Q = N × M */
export function calcPnlDelta(inputs: CalculatorInputs, priceDelta: number): number {
  const contracts = inputs.contracts
  if (contracts == null || contracts <= 0) return 0
  const Q = calcTotalQuantity(inputs, contracts)
  if (Q == null) return 0
  const delta = priceDelta * Q
  return inputs.positionSide === 'long' ? delta : -delta
}

/** 기준 현재가 → newPrice 이동 후 롤링 갱신 (현재가 스테퍼용) */
export function applyPriceMove(
  prev: CalculatorInputs,
  newPrice: number,
): Partial<CalculatorInputs> | null {
  const currentPrice = prev.currentPrice
  const accountEval = prev.accountEval
  if (currentPrice == null || accountEval == null) return null

  if (newPrice === currentPrice) {
    return { currentPrice: newPrice }
  }

  const pnl = calcPnlDelta(prev, newPrice - currentPrice)
  return {
    accountEval: accountEval + pnl,
    currentPrice: newPrice,
    evalSnapshotSide: prev.positionSide,
    mtmPriceAnchor: newPrice,
  }
}

/** 시나리오 모드 진입 — 손익·현재가 유지, 결과만 시나리오 가격 기준 미리보기 */
export function enterScenarioPreview(
  prev: CalculatorInputs,
  scenarioPrice: number,
): Partial<CalculatorInputs> | null {
  const accountEval = prev.accountEval
  const currentPrice = prev.currentPrice
  if (accountEval == null || currentPrice == null) return null
  if (isOrderScenarioModeActive(prev)) return null

  return {
    scenarioPrice,
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: {
      accountEval,
      mtmPriceAnchor: prev.mtmPriceAnchor,
      evalSnapshotSide: prev.evalSnapshotSide,
    },
    evalSnapshotSide: prev.positionSide,
  }
}

/** 시나리오 가격 Enter 확정 후 — 결과·UI 시나리오 모드 */
export function isScenarioModeActive(inputs: CalculatorInputs): boolean {
  return inputs.scenarioRevertSnapshot != null
}

/** 주문 시나리오 미리보기 모드 */
export function isOrderScenarioModeActive(inputs: CalculatorInputs): boolean {
  return inputs.orderScenarioRevertSnapshot != null
}

/** 가격 또는 주문 시나리오 미리보기 */
export function isPreviewModeActive(inputs: CalculatorInputs): boolean {
  return isScenarioModeActive(inputs) || isOrderScenarioModeActive(inputs)
}

function orderInputsFromRevertSnapshot(inputs: CalculatorInputs): CalculatorInputs {
  const snap = inputs.orderScenarioRevertSnapshot
  if (!snap) return inputs
  return {
    ...inputs,
    accountEval: snap.accountEval,
    contracts: snap.contracts,
    contractAmount: snap.contractAmount,
    contractAmountRole: snap.contractAmountRole,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
  }
}

/** 주문 시나리오 미리보기용 post-order inputs — 저장 contracts/accountEval은 유지 */
export function resolveOrderPreviewInputs(inputs: CalculatorInputs): CalculatorInputs {
  if (!isOrderScenarioModeActive(inputs)) return inputs

  const orderContracts = inputs.orderContracts
  const orderPrice = inputs.orderPrice
  if (orderContracts == null || orderPrice == null) return inputs

  const base = orderInputsFromRevertSnapshot(inputs)
  const heldContracts = base.contracts ?? 0
  const newContracts = heldContracts > 0 ? heldContracts + orderContracts : orderContracts
  const afterInputs = buildAfterOrderInputs(
    { ...base, orderPrice },
    newContracts,
    orderContracts,
  )

  return {
    ...inputs,
    contracts: afterInputs.contracts,
    contractAmount: afterInputs.contractAmount,
    contractAmountRole: afterInputs.contractAmountRole,
    accountEval: afterInputs.accountEval,
    evalSnapshotSide: afterInputs.evalSnapshotSide,
  }
}

/** 주문 시나리오 진입 — revert 스냅샷 + baseline 저장 */
export function enterOrderScenarioPreview(
  prev: CalculatorInputs,
  baseline: OrderScenarioBaseline,
): Partial<CalculatorInputs> | null {
  const accountEval = prev.accountEval
  if (accountEval == null) return null
  if (isScenarioModeActive(prev)) return null

  return {
    orderScenarioRevertSnapshot: {
      accountEval,
      contracts: prev.contracts,
      contractAmount: prev.contractAmount,
      contractAmountRole: prev.contractAmountRole,
      mtmPriceAnchor: prev.mtmPriceAnchor,
      evalSnapshotSide: prev.evalSnapshotSide,
    },
    orderScenarioBeforeBaseline: baseline,
  }
}

/** 시나리오 가격을 현재가로 확정 — 손익 반영 후 시나리오 모드 종료 */
export function applyScenarioToMarkPrice(
  prev: CalculatorInputs,
  targetPrice: number,
): Partial<CalculatorInputs> | null {
  const currentPrice = prev.currentPrice
  const accountEval = prev.accountEval
  if (currentPrice == null || accountEval == null) return null

  let nextEquity = accountEval

  if (targetPrice !== currentPrice) {
    nextEquity += calcPnlDelta(prev, targetPrice - currentPrice)
  }

  return {
    accountEval: nextEquity,
    currentPrice: targetPrice,
    mtmPriceAnchor: targetPrice,
    scenarioPrice: undefined,
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: undefined,
    evalSnapshotSide: prev.positionSide,
  }
}

/** 주문 시나리오 → 계좌 반영, 모드 종료 */
export function applyOrderScenarioToAccount(
  prev: CalculatorInputs,
): Partial<CalculatorInputs> | null {
  const snap = prev.orderScenarioRevertSnapshot
  const orderContracts = prev.orderContracts
  const orderPrice = prev.orderPrice
  if (!snap || orderContracts == null || orderPrice == null) return null

  const base = orderInputsFromRevertSnapshot(prev)
  const heldContracts = base.contracts ?? 0
  const newContracts = heldContracts > 0 ? heldContracts + orderContracts : orderContracts
  const afterInputs = buildAfterOrderInputs(
    { ...base, orderPrice },
    newContracts,
    orderContracts,
  )

  return {
    contracts: afterInputs.contracts,
    contractAmount: afterInputs.contractAmount,
    contractAmountRole: afterInputs.contractAmountRole,
    accountEval: afterInputs.accountEval,
    evalSnapshotSide: afterInputs.evalSnapshotSide,
    orderContracts: undefined,
    orderPrice: undefined,
    orderScenarioRevertSnapshot: undefined,
    orderScenarioBeforeBaseline: undefined,
  }
}

export function hasScenarioApplyUndo(inputs: CalculatorInputs): boolean {
  return inputs.scenarioApplyUndoSnapshot != null
}

export function hasOrderApplyUndo(inputs: CalculatorInputs): boolean {
  return inputs.orderApplyUndoSnapshot != null
}

export function revertScenarioApply(prev: CalculatorInputs): Partial<CalculatorInputs> | null {
  const snap = prev.scenarioApplyUndoSnapshot
  if (!snap) return null

  return {
    accountEval: snap.accountEval,
    currentPrice: snap.currentPrice,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
    scenarioPrice: snap.scenarioPrice,
    scenarioRevertSnapshot: snap.scenarioRevertSnapshot,
    scenarioAppliedPrice: undefined,
    scenarioApplyUndoSnapshot: undefined,
  }
}

export function revertOrderApply(prev: CalculatorInputs): Partial<CalculatorInputs> | null {
  const snap = prev.orderApplyUndoSnapshot
  if (!snap) return null

  return {
    accountEval: snap.accountEval,
    contracts: snap.contracts,
    contractAmount: snap.contractAmount,
    contractAmountRole: snap.contractAmountRole,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
    orderContracts: snap.orderContracts,
    orderPrice: snap.orderPrice,
    orderScenarioRevertSnapshot: snap.orderScenarioRevertSnapshot,
    orderScenarioBeforeBaseline: snap.orderScenarioBeforeBaseline,
    orderApplyUndoSnapshot: undefined,
  }
}

export function revertMarkPriceApply(prev: CalculatorInputs): Partial<CalculatorInputs> | null {
  const snap = prev.markPriceUndoSnapshot
  if (!snap) return null

  return {
    accountEval: snap.accountEval,
    currentPrice: snap.currentPrice,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
    markPriceUndoSnapshot: undefined,
  }
}

export function revertScenarioState(prev: CalculatorInputs): Partial<CalculatorInputs> {
  const snap = prev.scenarioRevertSnapshot
  if (!snap) {
    return {
      scenarioPrice: undefined,
      scenarioAppliedPrice: undefined,
      scenarioRevertSnapshot: undefined,
    }
  }
  // Esc — 계좌·현재가 스냅샷만 복원하고 시나리오 가격 입력값은 필드에 유지 (주문 시나리오와 동일)
  return {
    scenarioAppliedPrice: undefined,
    scenarioRevertSnapshot: undefined,
    accountEval: snap.accountEval,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
  }
}

export function revertOrderScenarioState(prev: CalculatorInputs): Partial<CalculatorInputs> {
  const snap = prev.orderScenarioRevertSnapshot
  if (!snap) {
    return {
      orderScenarioBeforeBaseline: undefined,
      orderScenarioRevertSnapshot: undefined,
    }
  }
  return {
    orderScenarioBeforeBaseline: undefined,
    orderScenarioRevertSnapshot: undefined,
    accountEval: snap.accountEval,
    contracts: snap.contracts,
    contractAmount: snap.contractAmount,
    contractAmountRole: snap.contractAmountRole,
    mtmPriceAnchor: snap.mtmPriceAnchor,
    evalSnapshotSide: snap.evalSnapshotSide,
  }
}

/** 결과 증거금·레버리지에 쓸 계좌 평가금액 */
export function resolveMarginEquity(inputs: CalculatorInputs): number {
  return inputs.accountEval ?? 0
}

/** 시나리오 모드 미리보기 평가금액 — 스냅샷 + 미실현 손익 (저장값은 유지) */
export function resolveScenarioPreviewEquity(inputs: CalculatorInputs): number | null {
  if (!isScenarioModeActive(inputs)) return null

  const scenarioMark = inputs.scenarioAppliedPrice ?? inputs.scenarioPrice
  const currentPrice = inputs.currentPrice
  const snap = inputs.scenarioRevertSnapshot
  if (scenarioMark == null || currentPrice == null || snap == null) return null

  if (scenarioMark === currentPrice) return snap.accountEval
  return snap.accountEval + calcPnlDelta(inputs, scenarioMark - currentPrice)
}

/**
 * 결과·주문 계산용 입력.
 * 시나리오 모드: 시나리오 가격·미실현 손익 반영 평가금액으로 미리보기.
 * 주문 시나리오: post-order contracts·accountEval 미리보기.
 */
export function resolveEvaluationInputs(inputs: CalculatorInputs): CalculatorInputs {
  let resolved = inputs

  if (isScenarioModeActive(resolved)) {
    const scenarioMark = resolved.scenarioAppliedPrice ?? resolved.scenarioPrice
    const currentPrice = resolved.currentPrice
    if (scenarioMark != null && currentPrice != null) {
      const previewEquity = resolveScenarioPreviewEquity(resolved)
      if (previewEquity != null) {
        if (scenarioMark !== currentPrice || previewEquity !== resolved.accountEval) {
          resolved = {
            ...resolved,
            currentPrice: scenarioMark,
            accountEval: previewEquity,
          }
        }
      }
    }
  }

  if (isOrderScenarioModeActive(resolved)) {
    resolved = resolveOrderPreviewInputs(resolved)
  }

  return resolved
}

/**
 * 유지·위탁 증거금 명목 산출용 — 시나리오 가격 모드에서는 진입 시점 입력(실제 현재가) 기준 고정.
 * 주문 시나리오 모드에서는 post-order 미리보기 기준.
 */
export function resolveMarginCalculationInputs(inputs: CalculatorInputs): CalculatorInputs {
  if (isScenarioModeActive(inputs) && !isOrderScenarioModeActive(inputs)) return inputs
  if (isOrderScenarioModeActive(inputs)) return resolveOrderPreviewInputs(inputs)
  return inputs
}

/** 현재가 ±1틱 MTM 이동 */
export function applyTickMove(
  prev: CalculatorInputs,
  direction: 1 | -1,
): Partial<CalculatorInputs> | null {
  const tickSize = prev.tickSize
  const currentPrice = prev.currentPrice
  if (tickSize == null || tickSize <= 0 || currentPrice == null) return null
  return applyPriceMove(prev, currentPrice + direction * tickSize)
}

function sanitizePatchForScenarioLock(
  prev: CalculatorInputs,
  inputPatch: Partial<CalculatorInputs>,
): Partial<CalculatorInputs> {
  if (isScenarioModeActive(prev)) {
    return 'scenarioPrice' in inputPatch ? { scenarioPrice: inputPatch.scenarioPrice } : {}
  }
  if (isOrderScenarioModeActive(prev)) {
    const allowed: Partial<CalculatorInputs> = {}
    if ('orderContracts' in inputPatch) allowed.orderContracts = inputPatch.orderContracts
    if ('orderPrice' in inputPatch) allowed.orderPrice = inputPatch.orderPrice
    return allowed
  }
  return inputPatch
}

/** 시나리오·가격·주문 입력 패치 보정 */
export function applyInputPatch(
  prev: CalculatorInputs,
  patch: CalculatorInputPatch,
): CalculatorInputs {
  const {
    commitScenarioPrice,
    commitCurrentPrice,
    tickCurrentPrice,
    clearScenario,
    applyScenarioToMark,
    undoScenarioApply,
    applyMarkPrice,
    preserveMarkPriceUndoSnapshot,
    undoMarkPrice,
    commitOrderScenario,
    clearOrderScenario,
    applyOrderScenario,
    undoOrderApply,
    ...inputPatch
  } = patch

  const previewLocked = isPreviewModeActive(prev)

  if (undoMarkPrice) {
    const undone = revertMarkPriceApply(prev)
    if (undone) return { ...prev, ...inputPatch, ...undone }
    return { ...prev, ...inputPatch }
  }

  if (undoOrderApply) {
    const undone = revertOrderApply(prev)
    if (undone) return { ...prev, ...inputPatch, ...undone }
    return { ...prev, ...inputPatch }
  }

  if (undoScenarioApply) {
    const undone = revertScenarioApply(prev)
    if (undone) return { ...prev, ...inputPatch, ...undone }
    return { ...prev, ...inputPatch }
  }

  if (applyOrderScenario) {
    const base = { ...prev, ...sanitizePatchForScenarioLock(prev, inputPatch) }
    const applied = applyOrderScenarioToAccount(base)
    if (applied) {
      const undoSnapshot =
        isOrderScenarioModeActive(base) &&
        base.accountEval != null &&
        base.orderScenarioRevertSnapshot != null &&
        base.orderScenarioBeforeBaseline != null
          ? {
              accountEval: base.accountEval,
              contracts: base.contracts,
              contractAmount: base.contractAmount,
              contractAmountRole: base.contractAmountRole,
              mtmPriceAnchor: base.mtmPriceAnchor,
              evalSnapshotSide: base.evalSnapshotSide,
              orderContracts: base.orderContracts,
              orderPrice: base.orderPrice,
              orderScenarioRevertSnapshot: base.orderScenarioRevertSnapshot,
              orderScenarioBeforeBaseline: base.orderScenarioBeforeBaseline,
            }
          : undefined
      return { ...base, ...applied, orderApplyUndoSnapshot: undoSnapshot }
    }
    return base
  }

  if (applyScenarioToMark != null) {
    const base = { ...prev, ...sanitizePatchForScenarioLock(prev, inputPatch) }
    const rolled = applyScenarioToMarkPrice(base, applyScenarioToMark)
    if (rolled) {
      const undoSnapshot =
        isScenarioModeActive(base) &&
        base.accountEval != null &&
        base.currentPrice != null &&
        base.scenarioRevertSnapshot != null
          ? {
              accountEval: base.accountEval,
              currentPrice: base.currentPrice,
              mtmPriceAnchor: base.mtmPriceAnchor,
              evalSnapshotSide: base.evalSnapshotSide,
              scenarioPrice: applyScenarioToMark,
              scenarioRevertSnapshot: base.scenarioRevertSnapshot,
            }
          : undefined
      return { ...base, ...rolled, scenarioApplyUndoSnapshot: undoSnapshot }
    }
    return base
  }

  if (applyMarkPrice != null) {
    const base = { ...prev, ...sanitizePatchForScenarioLock(prev, inputPatch) }
    const moved = applyPriceMove(base, applyMarkPrice)
    if (moved) {
      const keepExisting = preserveMarkPriceUndoSnapshot === true && base.markPriceUndoSnapshot != null
      const undoSnapshot = keepExisting
        ? base.markPriceUndoSnapshot
        : base.accountEval != null && base.currentPrice != null
          ? {
              accountEval: base.accountEval,
              currentPrice: base.currentPrice,
              mtmPriceAnchor: base.mtmPriceAnchor,
              evalSnapshotSide: base.evalSnapshotSide,
            }
          : undefined
      return { ...base, ...moved, markPriceUndoSnapshot: undoSnapshot }
    }
    return base
  }

  if (clearOrderScenario) {
    return { ...prev, ...inputPatch, ...revertOrderScenarioState(prev) }
  }

  if (clearScenario) {
    return { ...prev, ...inputPatch, ...revertScenarioState(prev) }
  }

  if (previewLocked && tickCurrentPrice != null) {
    return prev
  }

  if (previewLocked && commitCurrentPrice != null) {
    return prev
  }

  const sanitizedPatch = sanitizePatchForScenarioLock(prev, inputPatch)

  if (tickCurrentPrice != null) {
    const direction = tickCurrentPrice === 1 ? 1 : -1
    const base = { ...prev, ...sanitizedPatch }
    const moved = applyTickMove(base, direction)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (commitOrderScenario != null) {
    const base = { ...prev, ...sanitizedPatch }
    const entered = enterOrderScenarioPreview(base, commitOrderScenario)
    if (entered) return { ...base, ...entered }
    return base
  }

  if (commitScenarioPrice != null) {
    const base = { ...prev, ...sanitizedPatch }
    const entered = enterScenarioPreview(base, commitScenarioPrice)
    if (entered) return { ...base, ...entered }
    return base
  }

  if (commitCurrentPrice != null) {
    const base = { ...prev, ...sanitizedPatch }
    const moved = applyPriceMove(base, commitCurrentPrice)
    if (moved) return { ...base, ...moved }
    return base
  }

  if (sanitizedPatch.accountEval !== undefined) {
    return {
      ...prev,
      ...sanitizedPatch,
      mtmPriceAnchor: inputPatch.currentPrice ?? prev.currentPrice,
    }
  }

  return { ...prev, ...sanitizedPatch }
}
