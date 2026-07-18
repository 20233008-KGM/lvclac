import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  setAdRequestsPaused,
  setPersonalizedAdRequestsAllowed,
} from './adsense'

describe('AdSense request privacy controls', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resumes privacy-treated ads after a choice without enabling personalization', () => {
    vi.stubGlobal('window', { adsbygoogle: [] })

    setPersonalizedAdRequestsAllowed(false)
    setAdRequestsPaused(false)

    expect(window.adsbygoogle?.requestNonPersonalizedAds).toBe(1)
    expect(window.adsbygoogle?.pauseAdRequests).toBe(0)
  })

  it('allows personalized requests only after an affirmative choice', () => {
    vi.stubGlobal('window', { adsbygoogle: [] })

    setPersonalizedAdRequestsAllowed(true)
    setAdRequestsPaused(false)

    expect(window.adsbygoogle?.requestNonPersonalizedAds).toBe(0)
    expect(window.adsbygoogle?.pauseAdRequests).toBe(0)
  })
})
