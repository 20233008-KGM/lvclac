import type { CalculatorInputs } from '../types'
import { isOrderScenarioModeActive, resolveOrderPreviewInputs } from '../calc/mtmLink'

export function resolveInputPanelDisplayInputs(inputs: CalculatorInputs): CalculatorInputs {
  return isOrderScenarioModeActive(inputs) ? resolveOrderPreviewInputs(inputs) : inputs
}
