import type { CalculatorInputs, PositionSide } from '../types.js'
import { isWonAccountIndexFieldMismatch } from './indexNotional.js'
import { resolvePointValue } from './pointValue.js'

/**
 * 약정금액·현재가가 같은 지수 스케일(예: 303500 vs 320500)로 보일 때
 * 약정금액을 기준 지수 수준으로 해석해 MTM 보정에 사용한다.
 */
export function isIndexScaleReferencePair(
  contractAmount: number,
  currentPrice: number,
): boolean {
  if (contractAmount <= 0 || currentPrice <= 0) return false
  const ratio = contractAmount / currentPrice
  return ratio >= 0.2 && ratio <= 5
}

/**
 * 계좌 평가금액에 포함된 미결제손익을 포지션 방향 전환에 맞게 보정.
 *
 * HTS에서 롱 기준 평가금액을 넣은 뒤 숏 탭만 바꾸면 손익 방향이 반대인데
 * 입력 숫자는 그대로라 청산가 계산이 왜곡될 수 있다.
 */
export function resolveEffectiveAccountEval(
  inputs: CalculatorInputs,
  evalSnapshotSide: PositionSide,
): number {
  const accountEval = inputs.accountEval!
  const { positionSide, contractAmount, currentPrice, contracts } = inputs

  if (evalSnapshotSide === positionSide) return accountEval
  if (
    contractAmount == null ||
    currentPrice == null ||
    contracts == null ||
    contracts <= 0
  ) {
    return accountEval
  }
  if (!isIndexScaleReferencePair(contractAmount, currentPrice)) return accountEval
  // 지수×1000 + 원화 계좌 혼용 시 MTM 추정 신뢰 불가 — 명목 환산(indexNotional)만 적용
  if (isWonAccountIndexFieldMismatch(inputs)) return accountEval

  const pointValue = resolvePointValue(inputs)
  if (pointValue == null || pointValue <= 0) return accountEval

  const positionPnl = (currentPrice - contractAmount) * pointValue * contracts

  if (evalSnapshotSide === 'long' && positionSide === 'short') {
    return accountEval - 2 * positionPnl
  }
  if (evalSnapshotSide === 'short' && positionSide === 'long') {
    return accountEval + 2 * positionPnl
  }
  return accountEval
}

/** 청산 계산에 쓰는 보정 평가금액 */
export function effectiveAccountEval(inputs: CalculatorInputs): number {
  const snapshotSide = inputs.evalSnapshotSide ?? inputs.positionSide
  return resolveEffectiveAccountEval(inputs, snapshotSide)
}
