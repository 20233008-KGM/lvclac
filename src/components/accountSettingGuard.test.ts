import { describe, expect, it, beforeEach } from 'vitest'
import { sampleInputs } from '../types'
import {
  isAccountSetupComplete,
  readSkipAccountSettingGuard,
  setSkipAccountSettingGuard,
} from './accountSettingGuard'

describe('accountSettingGuard', () => {
  it('reports a fully filled account setup as complete', () => {
    expect(isAccountSetupComplete(sampleInputs)).toBe(true)
  })

  it('reports an empty setup as incomplete', () => {
    expect(isAccountSetupComplete({ mode: 'evaluate', positionSide: 'long' })).toBe(false)
  })

  it('requires the margin fields for the active margin mode', () => {
    const withoutRates = {
      ...sampleInputs,
      maintenanceMarginRate: undefined,
      entrustedMarginRate: undefined,
    }
    expect(isAccountSetupComplete(withoutRates)).toBe(false)
    expect(
      isAccountSetupComplete({
        ...withoutRates,
        marginInputMode: 'total',
        maintenanceMargin: 100,
        entrustedMargin: 200,
      }),
    ).toBe(true)
  })
})

/** vitest는 이 프로젝트에서 node 환경으로 돌아 전역 localStorage가 없으므로 최소 메모리 구현으로 대체한다. */
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

describe('account setting guard skip flag', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    })
  })

  it('defaults to not skipping when nothing is stored', () => {
    expect(readSkipAccountSettingGuard()).toBe(false)
  })

  it('persists and clears the skip flag', () => {
    setSkipAccountSettingGuard(true)
    expect(readSkipAccountSettingGuard()).toBe(true)

    setSkipAccountSettingGuard(false)
    expect(readSkipAccountSettingGuard()).toBe(false)
  })

  it('falls back to false when localStorage access throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })

    expect(readSkipAccountSettingGuard()).toBe(false)
    expect(() => setSkipAccountSettingGuard(true)).not.toThrow()
  })
})
