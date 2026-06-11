import { describe, expect, it } from 'vitest'
import {
  resolvePointerUp,
  SCRUB_ACTIVATION_PX,
  shouldEnterScrub,
} from './numberStepperPointer'

describe('shouldEnterScrub', () => {
  it('Pending + 7px → false', () => {
    expect(shouldEnterScrub('pending', 100, 100 - 7)).toBe(false)
    expect(shouldEnterScrub('pending', 100, 100 + 7)).toBe(false)
  })

  it('Pending + 10px → true', () => {
    expect(shouldEnterScrub('pending', 100, 100 - SCRUB_ACTIVATION_PX - 2)).toBe(true)
  })

  it('HoldRepeat + 20px → false', () => {
    expect(shouldEnterScrub('holdRepeat', 100, 100 - 20)).toBe(false)
  })

  it('Scrub + move → false', () => {
    expect(shouldEnterScrub('scrub', 100, 100 - 20)).toBe(false)
  })
})

describe('resolvePointerUp', () => {
  it('Pending → tap', () => {
    expect(resolvePointerUp('pending')).toBe('tap')
  })

  it('Scrub → scrubEnd', () => {
    expect(resolvePointerUp('scrub')).toBe('scrubEnd')
  })

  it('HoldRepeat → holdEnd', () => {
    expect(resolvePointerUp('holdRepeat')).toBe('holdEnd')
  })
})
