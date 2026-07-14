import type { CalculatorInputs, PositionSide } from '../../types.js'
import { buildLiquidationParams, type LiquidationParams } from './common.js'
import { calcLongLiquidationPrice } from './long.js'
import { calcShortLiquidationPrice } from './short.js'

export type { LiquidationParams } from './common.js'
export {
  buildLiquidationParams,
  calcTotalQuantity,
  calcToleranceDelta,
  calcToleranceRate,
  longEquityAtPrice,
  maintenanceAtPrice,
  resolveMaintenanceAtCurrent,
  shortEquityAtPrice,
} from './common.js'
export { calcLongLiquidationPrice, isLongLiquidationValid } from './long.js'
export { calcShortLiquidationPrice } from './short.js'

/** UI·시뮬에 쓸 수 있는 청산가만 반환 — 음수·현재가 반대편은 null */
export function sanitizeLiquidationPrice(
  price: number | null,
  side: PositionSide,
  currentPrice: number,
): number | null {
  if (price == null || !Number.isFinite(price) || price <= 0) return null
  if (side === 'long' && price >= currentPrice) return null
  if (side === 'short' && price <= currentPrice) return null
  return price
}

export function calcLiquidationPriceFromParams(
  params: LiquidationParams,
  side: PositionSide,
): number | null {
  const raw =
    side === 'long'
      ? calcLongLiquidationPrice(params)
      : calcShortLiquidationPrice(params)

  return sanitizeLiquidationPrice(raw, side, params.currentPrice)
}

export function calcLiquidationPriceForInputs(
  inputs: CalculatorInputs,
  contracts: number,
): number | null {
  const params = buildLiquidationParams(inputs, contracts)
  if (!params) return null
  return calcLiquidationPriceFromParams(params, inputs.positionSide)
}
