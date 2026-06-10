import type { LiquidationParams } from './common'

/**
 * LONG 청산가
 *
 * Equity(P) = E0 + (P-C0)×Q
 * Maintenance(P) = P×Q×R = M(C0)×P/C0
 *
 * E0 + (P-C0)×Q = M(C0)×P/C0
 * → P = (C0×Q - E0) / (Q - M(C0)/C0)
 * → P = (C0×Q - E0) / (Q×(1-R))  when M(C0)=C0×Q×R
 */
export function calcLongLiquidationPrice(params: LiquidationParams): number | null {
  const { equity, currentPrice, totalQuantity: Q, maintenanceAtCurrent: M0 } = params

  if (Q <= 0 || currentPrice <= 0) return null

  const denominator = Q - M0 / currentPrice
  if (denominator <= 0) return null

  const numerator = currentPrice * Q - equity
  const price = numerator / denominator

  if (!Number.isFinite(price) || price <= 0) return null

  return price
}

/** 롱: 청산 불가 조건 (분모 ≤ 0 → 유지증거금률 ≥ 100% 수준) */
export function isLongLiquidationValid(params: LiquidationParams): boolean {
  const { currentPrice, totalQuantity: Q, maintenanceAtCurrent: M0 } = params
  if (Q <= 0 || currentPrice <= 0) return false
  return Q - M0 / currentPrice > 0
}
