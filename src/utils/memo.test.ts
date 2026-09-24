import { describe, expect, it } from 'vitest'
import { canEditMemo, memoChunks, memoLength, memoPatch, normalizeMemo } from './memo'

describe('normalizeMemo', () => {
  it('never truncates existing or Pro notes beyond old limits', () => {
    const memo = '가😀'.repeat(100_000)

    expect(normalizeMemo(memo)).toBe(memo)
  })

  it('clears blank memos without changing nonblank whitespace', () => {
    expect(normalizeMemo('  가  ')).toBe('  가  ')
    expect(normalizeMemo('   ')).toBeNull()
  })

  it('counts code points consistently with the server and preserves grandfathered notes', () => {
    expect(memoLength('한😀 ')).toBe(3)
    expect(canEditMemo('', '😀'.repeat(1000), false)).toBe(true)
    expect(canEditMemo('', '😀'.repeat(1001), false)).toBe(false)
    expect(canEditMemo('가'.repeat(2000), '나'.repeat(2000), false)).toBe(true)
    expect(canEditMemo('가'.repeat(2000), '나'.repeat(2001), false)).toBe(false)
    expect(canEditMemo('', '나'.repeat(200001), true)).toBe(true)
  })

  it.each([
    ['', ''], ['', '한😀글'], ['abcd', 'abXYcd'], ['한😀글', '한🙂글'],
    ['가나다', ''], ['abcabc', 'abc'], ['abc', 'xbcx'],
  ])('reconstructs changed ranges without splitting Unicode: %s -> %s', (before, after) => {
    const patch = memoPatch(before, after)
    const characters = Array.from(before)
    expect(characters.slice(0, patch.offset).join('') + patch.insert +
      characters.slice(patch.offset + patch.deleteCount).join('')).toBe(after)
  })

  it('splits only the changed text into bounded transport chunks', () => {
    const value = '😀'.repeat(100001)
    const chunks = [...memoChunks(value)]
    expect(chunks.map(memoLength)).toEqual([50000, 50000, 1])
    expect(chunks.join('')).toBe(value)
    expect([...memoChunks('')]).toEqual([''])
    const before = '가'.repeat(200000)
    expect(memoPatch(before, before + '!')).toEqual({ offset: 200000, deleteCount: 0, insert: '!' })
  })
})
