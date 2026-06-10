import type { LiquidationParams } from './common'

/**
 * SHORT 청산가
 *
 * Equity(P) = E0 - (P-C0)×Q
 * Maintenance(P) = P×Q×R = M(C0)×P/C0
 *
 * E0 - (P-C0)×Q = M(C0)×P/C0
 * → P = (E0 + C0×Q) / (Q + M(C0)/C0)
 * → P = (E0 + C0×Q) / (Q×(1+R))  when M(C0)=C0×Q×R
 */
export function calcShortLiquidationPrice(params: LiquidationParams): number | null {
  const { equity, currentPrice, totalQuantity: Q, maintenanceAtCurrent: M0 } = params

  if (Q <= 0 || currentPrice <= 0) return null

  const denominator = Q + M0 / currentPrice
  if (denominator <= 0) return null

  const price = (equity + currentPrice * Q) / denominator

  return Number.isFinite(price) ? price : null
}
