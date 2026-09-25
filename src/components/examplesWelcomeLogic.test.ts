import { describe, expect, it } from 'vitest'
import { EXAMPLES_VIEWED_KEY, hasPriorCalculatorVisit, shouldShowExamplesWelcome } from './examplesWelcomeLogic'

const storage = (values: Record<string, string> = {}) => ({ getItem: (key: string) => values[key] ?? null })

describe('examples welcome audience', () => {
  it('shows only after anonymous session detection completes', () => {
    expect(shouldShowExamplesWelcome(false, false, false)).toBe(true)
    expect(shouldShowExamplesWelcome(false, true, false)).toBe(false)
    expect(shouldShowExamplesWelcome(false, false, true)).toBe(false)
    expect(shouldShowExamplesWelcome(true, false, false)).toBe(false)
  })
  it.each([
    [EXAMPLES_VIEWED_KEY, '1'], ['leverage-welcome-completed-v1', '1'],
    ['leverage-disclaimer-skip-v3', '1'], ['leverage_save_enabled', '1'],
    ['leverage-public-save-consent-v1', 'off'], ['leverage_trader_stage', 'hasPosition'],
    ['leverage_calculator_local_number_sets_v1', '[{"id":"local-1"}]'],
    ['leverage_calculator_draft', '{"accountEval":10000}'],
  ])('recognizes existing users from %s', (key, value) => {
    expect(hasPriorCalculatorVisit(storage({ [key]: value }), storage())).toBe(true)
  })
  it('recognizes a disclaimer acknowledged in this session', () => {
    expect(hasPriorCalculatorVisit(storage(), storage({ 'leverage-disclaimer-ack-v3': '1' }))).toBe(true)
  })
  it('does not mistake fresh privacy preferences or empty/corrupt drafts for prior activity', () => {
    expect(hasPriorCalculatorVisit(storage({ 'liqguard-privacy-preferences-v2': '{}', leverage_locale: 'ko', leverage_calculator_local_number_sets_v1: '[]', leverage_calculator_draft: '{invalid' }), storage())).toBe(false)
    expect(hasPriorCalculatorVisit({ getItem: () => { throw new Error('blocked') } }, storage())).toBe(false)
  })
})
