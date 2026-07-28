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

/**
 * UI·시뮬에 표시할 수 있는 청산가만 반환한다.
 *
 * 현재가가 이미 청산가를 지난 경우에도 청산가는 위험 판단의 기준점이므로
 * 그대로 보존한다. 양수가 아닌 값과 비유한 값만 표시 불가로 처리한다.
 */
export function sanitizeLiquidationPrice(
  price: number | null,
): number | null {
  if (price == null || !Number.isFinite(price) || price <= 0) return null
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

  return sanitizeLiquidationPrice(raw)
}

export function calcLiquidationPriceForInputs(
  inputs: CalculatorInputs,
  contracts: number,
): number | null {
  const params = buildLiquidationParams(inputs, contracts)
  if (!params) return null
  return calcLiquidationPriceFromParams(params, inputs.positionSide)
}
