import { describe, expect, it } from 'vitest'

import { ko } from './locales/ko'

describe('tick size tooltip copy', () => {
  it('points Korean users to the order price instead of the scenario price', () => {
    expect(ko.fields.tickSize.hint).toContain('현재가·주문가격')
    expect(ko.fields.tickSize.hint).not.toContain('시나리오 가격')
  })
})
