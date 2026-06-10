import type { PositionSide } from '../types'

/** 평가 결과 — 롱: 추가 매수 한도, 숏: 추가 매도 한도 */
export function maxAddableLabel(
  side: PositionSide,
  labels: Record<string, string>,
): string {
  return side === 'long'
    ? (labels.maxBuyableLong ?? 'Addl. buy limit')
    : (labels.maxBuyableShort ?? 'Addl. sell limit')
}
