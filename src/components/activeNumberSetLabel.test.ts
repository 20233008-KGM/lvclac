import { describe, expect, it } from 'vitest'
import { isUserNamedNumberSetTitle } from './activeNumberSetTitle'

describe('active number set label', () => {
  it('shows user-assigned names', () => {
    expect(isUserNamedNumberSetTitle('코스피200 단타 계좌')).toBe(true)
    expect(isUserNamedNumberSetTitle('  야간선물  ')).toBe(true)
  })

  it('keeps automatically generated names out of the input panel header', () => {
    expect(isUserNamedNumberSetTitle('기본 세트')).toBe(false)
    expect(isUserNamedNumberSetTitle('숫자세트 2')).toBe(false)
    expect(isUserNamedNumberSetTitle('   ')).toBe(false)
  })
})
