import { describe, expect, it } from 'vitest'
import { sampleInputs } from '../types'
import { isAccountSetupComplete } from './accountSettingGuard'

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
