import type { LiquidationParams } from './common.js'

/**
 * SHORT 청산가
 *
 * Equity(P) = E0 - (P-C0)×Q
 *
 * 비례 유지증거금: Maintenance(P) = M(C0)×P/C0
 *   E0 - (P-C0)×Q = M(C0)×P/C0
 *   → P = (E0 + C0×Q) / (Q + M(C0)/C0)
 *   → P = (E0 + C0×Q) / (Q×(1+R))  when M(C0)=C0×Q×R
 *
 * 고정 유지증거금(해외 계약당): Maintenance(P) = Mfix 상수
 *   E0 - (P-C0)×Q = Mfix
 *   → P = C0 + (E0 - Mfix) / Q
 */
export function calcShortLiquidationPrice(params: LiquidationParams): number | null {
  const {
    equity,
    currentPrice,
    totalQuantity: Q,
    maintenanceAtCurrent: M0,
    maintenanceFixed,
  } = params

  if (Q <= 0 || currentPrice <= 0) return null

  if (maintenanceFixed) {
    const price = currentPrice + (equity - M0) / Q
    return Number.isFinite(price) ? price : null
  }

  const denominator = Q + M0 / currentPrice
  if (denominator <= 0) return null

  const price = (equity + currentPrice * Q) / denominator

  return Number.isFinite(price) ? price : null
}
