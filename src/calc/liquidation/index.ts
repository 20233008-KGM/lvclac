import type { CalculatorInputs, PositionSide } from '../../types'
import { buildLiquidationParams, type LiquidationParams } from './common'
import { calcLongLiquidationPrice } from './long'
import { calcShortLiquidationPrice } from './short'

export type { LiquidationParams } from './common'
export {
  buildLiquidationParams,
  calcTotalQuantity,
  calcToleranceDelta,
  calcToleranceRate,
  longEquityAtPrice,
  maintenanceAtPrice,
  resolveMaintenanceAtCurrent,
  shortEquityAtPrice,
} from './common'
export { calcLongLiquidationPrice, isLongLiquidationValid } from './long'
export { calcShortLiquidationPrice } from './short'

export function calcLiquidationPriceFromParams(
  params: LiquidationParams,
  side: PositionSide,
): number | null {
  return side === 'long'
    ? calcLongLiquidationPrice(params)
    : calcShortLiquidationPrice(params)
}

export function calcLiquidationPriceForInputs(
  inputs: CalculatorInputs,
  contracts: number,
): number | null {
  const params = buildLiquidationParams(inputs, contracts)
  if (!params) return null
  return calcLiquidationPriceFromParams(params, inputs.positionSide)
}
