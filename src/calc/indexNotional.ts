import type { CalculatorInputs } from '../types.js'
import { isIndexScaleReferencePair } from './accountEval.js'

/** HTS 지수×1000 표기 (예: 320500 → 320.5pt) */
export const INDEX_FIELD_DIVISOR = 1000

/** KOSPI200 미니 1지수포인트당 원화 손익 — 계약승수는 계약 배율로 반영 */
export const BASE_INDEX_POINT_WON = 50_000

/**
 * 약정금액·현재가는 지수×1000인데 계좌 평가금액만 원(₩)인 혼용 입력.
 * 이때 `약정금액 × 승수`를 원화 명목으로 쓰면 위탁증거금이 과대 산출된다.
 */
export function isWonAccountIndexFieldMismatch(inputs: CalculatorInputs): boolean {
  const { contractAmount, currentPrice, accountEval, contractMultiplier } = inputs
  if (contractAmount == null || currentPrice == null || accountEval == null) return false
  if (!isIndexScaleReferencePair(contractAmount, currentPrice)) return false

  const multiplier = contractMultiplier ?? 1
  return accountEval < contractAmount * multiplier * 0.3
}

export function resolveIndexPointValueWon(multiplier: number | undefined): number {
  return BASE_INDEX_POINT_WON * (multiplier ?? 1)
}

/** 원화 약정가치 = N × (현재가 지수) × (1pt당 원화) */
export function calcIndexNotionalWon(
  currentPrice: number,
  contracts: number,
  multiplier: number | undefined,
): number {
  const indexLevel = currentPrice / INDEX_FIELD_DIVISOR
  return contracts * indexLevel * resolveIndexPointValueWon(multiplier)
}

/** 롱 기준 미결제손익(원) — 약정(기준) 지수 대비 현재 지수 차이 */
export function calcIndexPnlWon(
  contractAmount: number,
  currentPrice: number,
  contracts: number,
  multiplier: number | undefined,
): number {
  const indexGap = (currentPrice - contractAmount) / INDEX_FIELD_DIVISOR
  return indexGap * resolveIndexPointValueWon(multiplier) * contracts
}
