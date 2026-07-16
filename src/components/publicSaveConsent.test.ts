import { describe, expect, it } from 'vitest'
import {
  PUBLIC_SAVE_CONSENT_KEY,
  readPublicSaveConsent,
  shouldShowPublicSaveConsent,
  writePublicSaveConsent,
} from './publicSaveConsent'

function store(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}

describe('public save consent gate', () => {
  it('shows only on the calculator home before a decision', () => {
    expect(shouldShowPublicSaveConsent('/', store())).toBe(true)
    expect(shouldShowPublicSaveConsent('/guide', store())).toBe(false)
    expect(shouldShowPublicSaveConsent('/terms', store())).toBe(false)
  })

  it('persists both off and local decisions so the modal does not return', () => {
    const offStorage = store()
    writePublicSaveConsent(offStorage, 'off')
    expect(readPublicSaveConsent(offStorage)).toBe('off')
    expect(shouldShowPublicSaveConsent('/', offStorage)).toBe(false)

    const localStorage = store()
    writePublicSaveConsent(localStorage, 'local')
    expect(readPublicSaveConsent(localStorage)).toBe('local')
    expect(shouldShowPublicSaveConsent('/', localStorage)).toBe(false)
  })

  it('keeps the app usable when storage access throws', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }

    expect(readPublicSaveConsent(blockedStorage)).toBeNull()
    expect(() => writePublicSaveConsent(blockedStorage, 'off')).not.toThrow()
    expect(shouldShowPublicSaveConsent('/', blockedStorage)).toBe(true)
  })

  it('uses a dedicated versioned localStorage key', () => {
    expect(PUBLIC_SAVE_CONSENT_KEY).toBe('leverage-public-save-consent-v1')
  })
})
