import { describe, expect, it } from 'vitest'
import { welcomeIntroductionExample } from './welcomeIntroductionExample'
import { dismissWelcomeIntroduction, shouldShowWelcomeIntroduction, WELCOME_INTRO_SEEN_KEY } from './welcomeIntroductionLogic'

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value) },
    removeItem: (key: string) => { values.delete(key) },
  }
}

describe('short welcome introduction', () => {
  it('shows only on a new calculator home visit in either language', () => {
    for (const path of ['/', '/en', '/en/']) {
      expect(shouldShowWelcomeIntroduction(path, '', storage(), storage())).toBe(true)
    }
    for (const path of ['/guide', '/en/guide', '/about']) {
      expect(shouldShowWelcomeIntroduction(path, '?welcome=1', storage(), storage())).toBe(false)
    }
  })

  it('respects dismissal and existing users, with an explicit replay URL', () => {
    for (const saved of [
      { [WELCOME_INTRO_SEEN_KEY]: '1' },
      { 'leverage-welcome-completed-v1': '1' },
      { 'leverage-disclaimer-skip-v3': '1' },
      { 'leverage-public-save-consent-v1': 'off' },
    ]) {
      const local = storage(saved)
      expect(shouldShowWelcomeIntroduction('/', '', local, storage())).toBe(false)
      expect(shouldShowWelcomeIntroduction('/', '?lang=ko&welcome=1', local, storage())).toBe(true)
    }
    expect(shouldShowWelcomeIntroduction('/', '', storage(), storage({ 'leverage-disclaimer-ack-v3': '1' }))).toBe(false)
  })

  it('dismisses without changing saved inputs, legal acknowledgments or privacy choices', () => {
    const local = storage({ 'leverage_calculator_draft': 'existing values', 'liqguard-privacy-preferences-v2': 'existing preferences' })
    dismissWelcomeIntroduction(local)
    expect(Object.fromEntries(local.values)).toEqual({
      'leverage_calculator_draft': 'existing values',
      'liqguard-privacy-preferences-v2': 'existing preferences',
      [WELCOME_INTRO_SEEN_KEY]: '1',
    })
  })

  it('tolerates blocked storage', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(shouldShowWelcomeIntroduction('/', '', blocked, blocked)).toBe(true)
    expect(() => dismissWelcomeIntroduction(blocked)).not.toThrow()
  })

  it('matches ten MES contracts before and after adding one contract', () => {
    // Before: $60,000 equity - $15,000 maintenance = $45,000 / $50 per point.
    // After: $60,000 - $16,500 = $43,500 / $55 per point.
    expect(welcomeIntroductionExample.before).toEqual({ liquidationPrice: 5_100, toleranceRate: 15 })
    expect(welcomeIntroductionExample.after.liquidationPrice).toBeCloseTo(5_209.09090909, 8)
    expect(welcomeIntroductionExample.after.toleranceRate).toBeCloseTo(13.18181818, 8)
  })
})
