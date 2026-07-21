import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('entry price tooltip copy', () => {
  it('uses instrument units instead of country-based Korean terms', () => {
    const hint = ko.fields.contractAmount.hint

    expect(hint).toContain('현재 보유한 포지션의 평균 진입 가격')
    expect(hint).toContain('거래 화면에 표시되는 단위')
    expect(hint).toContain('종목선물은 주당 가격')
    expect(hint).toContain('지수선물은 지수 포인트')
    expect(hint).not.toContain('원화 가격')
    expect(hint).not.toContain('해외선물')
    expect(hint).not.toContain('주식선물')
  })

  it('uses globally neutral English terminology', () => {
    const hint = en.fields.contractAmount.hint

    expect(hint).toContain('average entry price of the current position')
    expect(hint).toContain('units shown on your trading platform')
    expect(hint).toContain('price per share for single-stock futures')
    expect(hint).toContain('index points for index futures')
    expect(hint).not.toContain('cash price')
    expect(hint).not.toContain('overseas futures')
    expect(hint).not.toContain('product screen')
  })
})
