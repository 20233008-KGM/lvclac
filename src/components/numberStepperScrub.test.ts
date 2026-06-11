import { describe, expect, it } from 'vitest'
import {
  applyScrubMultiplier,
  DEFAULT_FINGER_PX,
  scrubMultiplierFromDelta,
  snapToStep,
} from './numberStepperScrub'

describe('scrubMultiplierFromDelta', () => {
  it('F px 위 → ×2', () => {
    expect(scrubMultiplierFromDelta(DEFAULT_FINGER_PX, DEFAULT_FINGER_PX)).toBe(2)
  })

  it('F px 아래 → ×0.5', () => {
    expect(scrubMultiplierFromDelta(-DEFAULT_FINGER_PX, DEFAULT_FINGER_PX)).toBe(0.5)
  })

  it('F/2 px 위 → ×√2', () => {
    expect(scrubMultiplierFromDelta(DEFAULT_FINGER_PX / 2, DEFAULT_FINGER_PX)).toBeCloseTo(
      Math.SQRT2,
    )
  })
})

describe('applyScrubMultiplier', () => {
  it('350 + F px 위 → 700', () => {
    expect(applyScrubMultiplier(350, DEFAULT_FINGER_PX, DEFAULT_FINGER_PX)).toBe(700)
  })

  it('700 + F px 아래 → 350', () => {
    expect(applyScrubMultiplier(700, -DEFAULT_FINGER_PX, DEFAULT_FINGER_PX)).toBe(350)
  })

  it('0 미만 clamp', () => {
    expect(applyScrubMultiplier(10, -DEFAULT_FINGER_PX * 6, DEFAULT_FINGER_PX)).toBe(0)
  })
})

describe('snapToStep', () => {
  it('tickSize 5로 스냅', () => {
    expect(snapToStep(703, 5)).toBe(705)
    expect(snapToStep(702, 5)).toBe(700)
  })
})
