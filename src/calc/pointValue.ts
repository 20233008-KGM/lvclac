import type { CalculatorInputs } from '../types'

type PointValueInputs = Pick<
  CalculatorInputs,
  'contractAmount' | 'contractMultiplier' | 'currentPrice'
>

function effectiveMultiplier(multiplier: number | undefined): number {
  return multiplier ?? 1
}

export function hasContractSpec(inputs: PointValueInputs): boolean {
  return inputs.contractAmount != null
}

/** 약정금액 × 계약승수 ÷ 현재가 */
export function resolvePointValue(inputs: PointValueInputs): number | null {
  return getPointValueFromNotional(
    inputs.contractAmount,
    inputs.contractMultiplier,
    inputs.currentPrice,
  )
}

export function getPointValueFromNotional(
  contractAmount: number | undefined,
  contractMultiplier: number | undefined,
  currentPrice: number | undefined,
): number | null {
  const multiplier = effectiveMultiplier(contractMultiplier)
  if (contractAmount == null || currentPrice == null || multiplier === 0 || currentPrice === 0) {
    return null
  }
  return (contractAmount * multiplier) / currentPrice
}

/** @deprecated resolvePointValue 사용 권장 */
export function getPointValue(
  contractAmount: number | undefined,
  contractMultiplier: number | undefined,
  currentPrice: number | undefined,
): number | null {
  return getPointValueFromNotional(contractAmount, contractMultiplier, currentPrice)
}
