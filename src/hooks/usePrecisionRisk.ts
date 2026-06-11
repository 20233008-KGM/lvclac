import { useMemo } from 'react'
import { calculateEvaluate, calculateOrder } from '../calc/leverage'
import type { CalculatorInputs } from '../types'
import { hasPrecisionRisk } from '../utils/format'

/** 계산 결과에 safe integer 초과 값이 있는지 검사 (입력값은 제외) */
export function usePrecisionRisk(inputs: CalculatorInputs): boolean {
  const { positionSide, orderContracts, orderPrice } = inputs

  const evaluateResult = useMemo(
    () => calculateEvaluate(inputs),
    [inputs, positionSide],
  )

  const orderResult = useMemo(
    () => calculateOrder(inputs),
    [inputs, positionSide, orderContracts, orderPrice],
  )

  return useMemo(
    () => hasPrecisionRisk(evaluateResult, orderResult),
    [evaluateResult, orderResult],
  )
}
