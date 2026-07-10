import type { CalculatorInputs } from '../types'

type EntryReturnInputs = Pick<
  CalculatorInputs,
  'positionSide' | 'contractAmount' | 'currentPrice'
>

type TickPnlInputs = Pick<
  CalculatorInputs,
  'contracts' | 'tickSize' | 'contractMultiplier'
>

type PositionUnrealizedPnlInputs = Pick<
  CalculatorInputs,
  'positionSide' | 'contracts' | 'contractAmount' | 'currentPrice' | 'contractMultiplier'
>

export function calcEntryPriceReturnRate(inputs: EntryReturnInputs): number | null {
  const { contractAmount, currentPrice, positionSide } = inputs
  if (
    contractAmount == null ||
    currentPrice == null ||
    !Number.isFinite(contractAmount) ||
    !Number.isFinite(currentPrice) ||
    contractAmount <= 0
  ) {
    return null
  }

  const priceMove =
    positionSide === 'long'
      ? currentPrice - contractAmount
      : contractAmount - currentPrice
  return (priceMove / contractAmount) * 100
}

export function calcPositionTickPnl(inputs: TickPnlInputs): number | null {
  const { contracts, tickSize } = inputs
  const multiplier = inputs.contractMultiplier ?? 1
  if (
    contracts == null ||
    tickSize == null ||
    !Number.isFinite(contracts) ||
    !Number.isFinite(tickSize) ||
    !Number.isFinite(multiplier) ||
    tickSize <= 0 ||
    multiplier <= 0
  ) {
    return null
  }

  return Math.abs(contracts * tickSize * multiplier)
}

export function calcPositionUnrealizedPnl(
  inputs: PositionUnrealizedPnlInputs,
): number | null {
  const { contracts, contractAmount, currentPrice, positionSide } = inputs
  const multiplier = inputs.contractMultiplier ?? 1
  if (
    contracts == null ||
    contractAmount == null ||
    currentPrice == null ||
    !Number.isFinite(contracts) ||
    !Number.isFinite(contractAmount) ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(multiplier) ||
    contracts < 0 ||
    contractAmount <= 0 ||
    currentPrice <= 0 ||
    multiplier <= 0
  ) {
    return null
  }

  const priceMove =
    positionSide === 'long'
      ? currentPrice - contractAmount
      : contractAmount - currentPrice
  return priceMove * contracts * multiplier
}
