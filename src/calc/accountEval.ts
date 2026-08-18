import type { CalculatorInputs, PositionSide } from '../types.js'
import { resolvePointValue } from './pointValue.js'

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
  // 숫자 크기만으로 약정가격의 역할을 추정하지 않는다. 명시적으로 진입가로
  // 저장된 값일 때만 방향 전환에 따른 미결제손익 보정을 적용한다.
  if (inputs.contractAmountRole !== 'entryPrice') return accountEval
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
