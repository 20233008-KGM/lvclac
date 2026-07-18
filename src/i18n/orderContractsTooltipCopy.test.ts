import { describe, expect, it } from 'vitest'

import { en } from './locales/en'
import { ko } from './locales/ko'

describe('order contracts tooltip copy', () => {
  it('explains the signed order direction for long and short positions in Korean', () => {
    expect(ko.fields.orderContracts.hint).toContain(
      '양수(+)는 현재 포지션을 늘리고, 음수(−)는 줄입니다.',
    )
    expect(ko.fields.orderContracts.hint).toContain('롱: + 매수 / − 매도')
    expect(ko.fields.orderContracts.hint).toContain('숏: + 매도 / − 매수(환매)')
  })

  it('explains the signed order direction for long and short positions in English', () => {
    expect(en.fields.orderContracts.hint).toContain(
      'Positive (+) expands the current position; negative (−) reduces it.',
    )
    expect(en.fields.orderContracts.hint).toContain('Long: + buy / − sell')
    expect(en.fields.orderContracts.hint).toContain('Short: + sell / − buy to cover')
  })
})
