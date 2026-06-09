import type { CalculatorInputs } from '../../types'

export interface PreferencesRepository {
  getPreferences(userId: string): Promise<CalculatorInputs | null>
  savePreferences(userId: string, inputs: CalculatorInputs): Promise<void>
}
