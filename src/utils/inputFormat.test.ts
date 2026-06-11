import { describe, expect, it } from 'vitest'
import { formatRawNumericInput } from './inputFormat'

describe('formatRawNumericInput 자릿수 상한', () => {
  it('정수부 16자리까지는 그대로 포맷', () => {
    expect(formatRawNumericInput('9999999999999999')).toBe('9,999,999,999,999,999')
  })

  it('정수부 17자리째부터는 초과분을 버린다', () => {
    expect(formatRawNumericInput('12345678901234567')).toBe('1,234,567,890,123,456')
  })

  it('소수 입력도 정수부만 16자리로 제한', () => {
    expect(formatRawNumericInput('123456789012345678.99', true)).toBe(
      '1,234,567,890,123,456.99',
    )
  })

  it('음수 부호는 자릿수에 포함되지 않는다', () => {
    expect(formatRawNumericInput('-12345678901234567', false, true)).toBe(
      '-1,234,567,890,123,456',
    )
  })
})
