import { describe, expect, it } from 'vitest'
import {
  countIntegerDigits,
  formatRateForInput,
  formatRawRateInput,
  formatRawNumericInput,
  normalizeInputValue,
  parseFormattedInput,
  isAtIntegerDigitLimit,
  shouldShowDigitLimitBorder,
  shouldShowDigitLimitHint,
  wasIntegerDigitTruncated,
} from './inputFormat'
import { SAFE_PRECISION_MAX } from './format'

describe('rate input precision', () => {
  it.each(['0.4995', '0.499499', '0.1234567890123456', '0.0000001', '0.00000012345', '0', '1'])('preserves %s through commit and refocus', (raw) => {
    const parsed = parseFormattedInput(formatRawRateInput(raw)) as number
    const committed = normalizeInputValue(parsed, { isRate: true, allowDecimal: true })
    expect(committed).toBe(Number(raw))
    expect(formatRateForInput(committed)).toBe(raw)
    expect(parseFormattedInput(formatRateForInput(committed))).toBe(committed)
  })

  it('expands scientific notation without changing the numeric value', () => {
    for (const value of [Number.MIN_VALUE, 1.2345e-20, 1e21, Number.MAX_VALUE]) {
      const text = formatRateForInput(value)
      expect(text).toMatch(/^\d+(\.\d+)?$/)
      expect(Number(text)).toBe(value)
    }
  })

  it('keeps empty rates empty and removes insignificant trailing zeros', () => {
    for (const value of [undefined, null, NaN, Infinity]) expect(formatRateForInput(value)).toBe('')
    expect(formatRateForInput(Number('0.499500'))).toBe('0.4995')
  })

  it('preserves existing non-rate rounding', () => {
    expect(normalizeInputValue(12.3456, { allowDecimal: true })).toBe(12.35)
    expect(normalizeInputValue(12.6, {})).toBe(13)
  })
})

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

describe('integer digit limit helpers', () => {
  it('countIntegerDigits — 콤마·부호 무시', () => {
    expect(countIntegerDigits('9,999,999,999,999,999', false, false)).toBe(16)
    expect(countIntegerDigits('-1,234', false, true)).toBe(4)
  })

  it('isAtIntegerDigitLimit — 16자리에서 true', () => {
    expect(isAtIntegerDigitLimit('9,999,999,999,999,999')).toBe(true)
    expect(isAtIntegerDigitLimit('999,999,999,999,999')).toBe(false)
  })

  it('wasIntegerDigitTruncated — 17자리 입력 시도 감지', () => {
    const raw = '12345678901234567'
    const formatted = formatRawNumericInput(raw)
    expect(wasIntegerDigitTruncated(raw, formatted)).toBe(true)
    expect(wasIntegerDigitTruncated('123', formatRawNumericInput('123'))).toBe(false)
  })
})

describe('digit limit hint helpers', () => {
  it('shouldShowDigitLimitHint — 초과 시도 또는 safe integer 초과', () => {
    expect(shouldShowDigitLimitHint(false, true, undefined)).toBe(true)
    expect(shouldShowDigitLimitHint(false, false, SAFE_PRECISION_MAX + 1)).toBe(true)
    expect(shouldShowDigitLimitHint(false, false, SAFE_PRECISION_MAX)).toBe(false)
    expect(shouldShowDigitLimitHint(true, true, SAFE_PRECISION_MAX + 1)).toBe(false)
  })

  it('shouldShowDigitLimitBorder — 16자리 도달 시 테두리만', () => {
    expect(shouldShowDigitLimitBorder(false, '9,999,999,999,999,999')).toBe(true)
    expect(shouldShowDigitLimitBorder(false, '999,999,999,999,999')).toBe(false)
    expect(shouldShowDigitLimitBorder(false, '9,999,999,999,999,999', false, false)).toBe(
      true,
    )
    expect(shouldShowDigitLimitBorder(true, '9,999,999,999,999,999')).toBe(false)
  })

  it('16자리 정확히 입력 — border만, hint 없음 (safe integer 이내)', () => {
    const safe16 = SAFE_PRECISION_MAX
    const formatted = formatRawNumericInput(String(safe16))
    const atBorder = shouldShowDigitLimitBorder(false, formatted)
    const showHint = shouldShowDigitLimitHint(false, false, safe16)
    expect(atBorder).toBe(true)
    expect(showHint).toBe(false)
  })
})
