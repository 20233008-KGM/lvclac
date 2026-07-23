import { describe, expect, it } from 'vitest'
import {
  resolveActiveCloudNumberSet,
  shouldOpenCloudAtStartup,
} from './cloudStartupPreference'

describe('cloud startup preference', () => {
  it('opens the last cloud set on a browser with no prior save choice', () => {
    expect(shouldOpenCloudAtStartup({
      hasDevicePreference: false,
      saveEnabled: false,
      storageMode: 'local',
      hasCloudSet: true,
    })).toBe(true)
  })

  it('preserves explicit local and do-not-save choices', () => {
    expect(shouldOpenCloudAtStartup({
      hasDevicePreference: true,
      saveEnabled: true,
      storageMode: 'local',
      hasCloudSet: true,
    })).toBe(false)
    expect(shouldOpenCloudAtStartup({
      hasDevicePreference: true,
      saveEnabled: false,
      storageMode: 'cloud',
      hasCloudSet: true,
    })).toBe(false)
  })

  it('restores cloud only for an established browser that already chose cloud saving', () => {
    expect(shouldOpenCloudAtStartup({
      hasDevicePreference: true,
      saveEnabled: true,
      storageMode: 'cloud',
      hasCloudSet: true,
    })).toBe(true)
    expect(shouldOpenCloudAtStartup({
      hasDevicePreference: true,
      saveEnabled: true,
      storageMode: 'cloud',
      hasCloudSet: false,
    })).toBe(false)
  })

  it('prefers the server selection, then the browser cache, then the first set', () => {
    const sets = [{ id: 'a' }, { id: 'b' }]
    expect(resolveActiveCloudNumberSet(sets, 'b', 'a')?.id).toBe('b')
    expect(resolveActiveCloudNumberSet(sets, 'missing', 'a')?.id).toBe('a')
    expect(resolveActiveCloudNumberSet(sets, 'missing', 'missing')?.id).toBe('a')
    expect(resolveActiveCloudNumberSet([], 'a', 'a')).toBeNull()
  })
})
