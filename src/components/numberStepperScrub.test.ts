import { describe, expect, it } from 'vitest'
import {
  applyScrubLinearTicks,
  applyScrubTicks,
  consumeScrubPx,
  DEFAULT_SCRUB_PX_PER_TICK,
  isAlignedToStep,
  snapToStep,
} from './numberStepperScrub'

describe('consumeScrubPx', () => {
  it('10px → 1틱', () => {
    expect(consumeScrubPx(0, 10, 10)).toEqual({ nextAccumPx: 0, tickDelta: 1 })
  })

  it('DEFAULT pxPerTick — 6px → 1틱', () => {
    expect(consumeScrubPx(0, 6, DEFAULT_SCRUB_PX_PER_TICK)).toEqual({
      nextAccumPx: 0,
      tickDelta: 1,
    })
  })

  it('40px → 4틱', () => {
    expect(consumeScrubPx(0, 40, 10)).toEqual({ nextAccumPx: 0, tickDelta: 4 })
  })

  it('7px + 5px 연속 → 1틱, 2px 잔여', () => {
    const first = consumeScrubPx(0, 7, 10)
    expect(first).toEqual({ nextAccumPx: 7, tickDelta: 0 })

    const second = consumeScrubPx(first.nextAccumPx, 5, 10)
    expect(second).toEqual({ nextAccumPx: 2, tickDelta: 1 })
  })

  it('pxPerTick 0 이하 → 변화 없음', () => {
    expect(consumeScrubPx(0, 40, 0)).toEqual({ nextAccumPx: 0, tickDelta: 0 })
  })
})

describe('applyScrubTicks', () => {
  it('350 + 4틱, step 5 → 370', () => {
    expect(applyScrubTicks(350, 4, 5)).toBe(370)
  })

  it('334500 + 2틱, step 100 → 334700', () => {
    expect(applyScrubTicks(334500, 2, 100)).toBe(334700)
  })

  it('334500 + 3틱, step 100 — 항상 100 배수', () => {
    const next = applyScrubTicks(334500, 3, 100)
    expect(next).toBe(334800)
    expect(isAlignedToStep(next, 100)).toBe(true)
  })

  it('음수 tickDelta 허용 (minValue 없음)', () => {
    expect(applyScrubTicks(3, -5, 1)).toBe(-2)
  })

  it('minValue clamp 후에도 step 정렬', () => {
    expect(applyScrubTicks(50, -5, 100, 0)).toBe(0)
  })

  it('tickDelta 0 → current 유지', () => {
    expect(applyScrubTicks(350, 0, 5)).toBe(350)
  })
})

describe('applyScrubLinearTicks', () => {
  it('350 - 2틱, step 5 → 340', () => {
    expect(applyScrubLinearTicks(350, -2, 5)).toBe(340)
  })
})

describe('scrub end-to-end', () => {
  it('350, +40px, pxPerTick=10, step=5 → 370', () => {
    const { tickDelta } = consumeScrubPx(0, 40, 10)
    expect(applyScrubLinearTicks(350, tickDelta, 5, 0)).toBe(370)
  })

  it('tickSize 100 — 연속 스크럽도 100 배수 유지', () => {
    let price = 334500
    for (const deltaPx of [6, 12, 18, 24]) {
      const { tickDelta } = consumeScrubPx(0, deltaPx, DEFAULT_SCRUB_PX_PER_TICK)
      price = applyScrubTicks(price, tickDelta, 100)
      expect(isAlignedToStep(price, 100)).toBe(true)
    }
  })
})

describe('snapToStep', () => {
  it('tickSize 5로 스냅', () => {
    expect(snapToStep(703, 5)).toBe(705)
    expect(snapToStep(702, 5)).toBe(700)
  })
})
