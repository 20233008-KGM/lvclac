import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sampleInputs } from '../types'
import {
  DEFAULT_LOCAL_NUMBER_SET_ID,
  loadLocalNumberSets,
} from '../storage/localNumberSets'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

describe('maintenance/public upgrade contracts', () => {
  it('keeps the public draft keys and migrates saved values into the default local number set', () => {
    const calculatorContext = readFileSync(resolve('src/context/CalculatorContext.tsx'), 'utf8')
    expect(calculatorContext).toContain("const DRAFT_KEY = 'leverage_calculator_draft'")
    expect(calculatorContext).toContain("const DRAFT_SAVED_AT_KEY = 'leverage_calculator_draft_saved_at'")
    expect(calculatorContext).toContain("const SAVE_ENABLED_KEY = 'leverage_save_enabled'")

    const storage = new MemoryStorage()
    storage.setItem('leverage_save_enabled', '1')
    storage.setItem('leverage_calculator_draft', JSON.stringify(sampleInputs))
    const result = loadLocalNumberSets(storage, sampleInputs, '2026-08-27T00:00:00.000Z')

    expect(result.migrated).toBe(true)
    expect(result.sets[0]).toMatchObject({
      id: DEFAULT_LOCAL_NUMBER_SET_ID,
      inputs: sampleInputs,
    })
    expect(storage.getItem('leverage_save_enabled')).toBe('1')
    expect(storage.getItem('leverage_calculator_draft')).toBe(JSON.stringify(sampleInputs))
  })

  it('does not invent a saved local set for the public save-disabled choice', () => {
    const storage = new MemoryStorage()
    storage.setItem('leverage_save_enabled', '0')

    expect(loadLocalNumberSets(storage, null, null)).toEqual({ sets: [], migrated: false })
    expect(storage.getItem('leverage_save_enabled')).toBe('0')
  })

  it('loads GA only from an allowed consent decision and never schedules it at bootstrap', () => {
    const main = readFileSync(resolve('src/main.tsx'), 'utf8')
    const consent = readFileSync(resolve('src/context/GoogleConsentContext.tsx'), 'utf8')

    expect(main).not.toContain('scheduleAnalyticsInit')
    expect(main).not.toContain('initAnalytics()')
    expect(consent).toContain('if (next.analyticsAllowed) initAnalytics()')
    expect(consent).toContain('initializeGoogleConsentDefaults()')
  })
})
