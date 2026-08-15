import { describe, expect, it } from 'vitest'
import { ADS_ENABLED, isAdSenseConfigured, isAdSlotEnabled } from './ads'

describe('temporary advertising pause', () => {
  it('keeps every slot and AdSense request disabled', () => {
    expect(ADS_ENABLED).toBe(false)
    expect(isAdSlotEnabled('top-banner', 'banner')).toBe(false)
    expect(isAdSlotEnabled('left-sidebar-top', 'sidebar')).toBe(false)
    expect(isAdSenseConfigured('top-banner')).toBe(false)
  })
})
