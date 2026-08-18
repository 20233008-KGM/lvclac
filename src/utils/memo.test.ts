import { describe, expect, it } from 'vitest'
import { MEMO_MAX_LENGTH, normalizeMemo } from './memo'

describe('normalizeMemo', () => {
  it('keeps a full 20,000-character memo without truncation', () => {
    const memo = '가'.repeat(MEMO_MAX_LENGTH)

    expect(normalizeMemo(memo)).toBe(memo)
  })

  it('truncates only text beyond the shared maximum and clears blank memos', () => {
    expect(normalizeMemo('가'.repeat(MEMO_MAX_LENGTH + 1))).toHaveLength(MEMO_MAX_LENGTH)
    expect(normalizeMemo('   ')).toBeNull()
  })
})
