import { describe, expect, it } from 'vitest'
import { isScrollOverflowing } from './useOverflowEllipsis'

describe('isScrollOverflowing', () => {
  it('does not turn on for subpixel slack', () => {
    expect(isScrollOverflowing(100, 100, false)).toBe(false)
    expect(isScrollOverflowing(103, 100, false)).toBe(false)
  })

  it('turns on when text clearly exceeds the box', () => {
    expect(isScrollOverflowing(105, 100, false)).toBe(true)
  })

  it('turns off when text fits again', () => {
    expect(isScrollOverflowing(100, 100, true)).toBe(false)
    expect(isScrollOverflowing(100, 101, true)).toBe(false)
  })

  it('keeps … while text is still clipped at minimum width', () => {
    expect(isScrollOverflowing(200, 40, true)).toBe(true)
    expect(isScrollOverflowing(200, 12, true)).toBe(true)
  })

  it('keeps … when widths are equal only while already overflowing', () => {
    expect(isScrollOverflowing(100, 100, true)).toBe(false)
    expect(isScrollOverflowing(101, 100, true)).toBe(true)
  })
})
