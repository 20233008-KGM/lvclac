import { describe, expect, it } from 'vitest'
import {
  resolvePointerUp,
  resolveStepperBaseValue,
  SCRUB_ACTIVATION_PX,
  shouldFocusInputForPointer,
  shouldEnterScrub,
} from './numberStepperPointer'

describe('mobile stepper focus', () => {
  it('focuses the numeric input only for a mouse pointer', () => {
    expect(shouldFocusInputForPointer('mouse')).toBe(true)
    expect(shouldFocusInputForPointer('touch')).toBe(false)
    expect(shouldFocusInputForPointer('pen')).toBe(false)
  })

  it('uses an active uncommitted draft before the stored value', () => {
    expect(resolveStepperBaseValue({
      value: 90,
      inputFocused: true,
      inputDraft: 100,
      enableDragScrub: true,
      scrubSeedValue: 80,
    })).toBe(100)
  })

  it('ignores a stale draft after the input loses focus', () => {
    expect(resolveStepperBaseValue({
      value: 110,
      inputFocused: false,
      inputDraft: 100,
      enableDragScrub: true,
      scrubSeedValue: 80,
    })).toBe(110)
  })

  it('uses the scrub seed only when no value or active numeric draft exists', () => {
    expect(resolveStepperBaseValue({
      value: undefined,
      inputFocused: false,
      inputDraft: undefined,
      enableDragScrub: true,
      scrubSeedValue: 80,
    })).toBe(80)
  })
})

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
