import type { LiquidationParams } from './common.js'

/**
 * LONG 청산가
 *
 * Equity(P) = E0 + (P-C0)×Q
 *
 * 비례 유지증거금: Maintenance(P) = M(C0)×P/C0
 *   E0 + (P-C0)×Q = M(C0)×P/C0
 *   → P = (C0×Q - E0) / (Q - M(C0)/C0)
 *   → P = (C0×Q - E0) / (Q×(1-R))  when M(C0)=C0×Q×R
 *
 * 고정 유지증거금(해외 계약당): Maintenance(P) = Mfix 상수
 *   E0 + (P-C0)×Q = Mfix
 *   → P = C0 + (Mfix - E0) / Q
 */
export function calcLongLiquidationPrice(params: LiquidationParams): number | null {
  const {
    equity,
    currentPrice,
    totalQuantity: Q,
    maintenanceAtCurrent: M0,
    maintenanceFixed,
  } = params

  if (Q <= 0 || currentPrice <= 0) return null

  if (maintenanceFixed) {
    const price = currentPrice + (M0 - equity) / Q
    if (!Number.isFinite(price) || price <= 0) return null
    return price
  }

  const denominator = Q - M0 / currentPrice
  if (denominator <= 0) return null

  const numerator = currentPrice * Q - equity
  const price = numerator / denominator

  if (!Number.isFinite(price) || price <= 0) return null

  return price
}

/** 롱: 청산 불가 조건 (분모 ≤ 0 → 유지증거금률 ≥ 100% 수준) */
export function isLongLiquidationValid(params: LiquidationParams): boolean {
  const { equity, currentPrice, totalQuantity: Q, maintenanceAtCurrent: M0, maintenanceFixed } =
    params
  if (Q <= 0 || currentPrice <= 0) return false
  // 고정: 유지증거금이 계좌보다 작아야 현재가 아래 청산가 존재
  if (maintenanceFixed) return M0 < equity
  return Q - M0 / currentPrice > 0
}
