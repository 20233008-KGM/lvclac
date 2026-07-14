import { exceedsSafePrecision, roundTo, trimTrailingZeros } from './format.js'

/**
 * 정수부 최대 자릿수. 1000조(10^15)는 16자리이며,
 * JS의 안전 정수 한계(Number.MAX_SAFE_INTEGER ≈ 9×10^15)도 16자리라
 * 이를 넘기면 정밀도가 깨진다. 따라서 16자리에서 입력을 막는다.
 */
export const MAX_INTEGER_DIGITS = 16

/** 포맷된/원시 문자열에서 정수부 숫자 자릿수 */
export function countIntegerDigits(
  text: string,
  allowDecimal = false,
  allowNegative = false,
): number {
  const stripped = text.replace(/,/g, '')
  if (stripped === '' || stripped === '-') return 0
  const negative = allowNegative && stripped.startsWith('-')
  const unsigned = negative ? stripped.slice(1) : stripped
  const intPart = allowDecimal ? unsigned.split('.')[0] ?? '' : unsigned.replace(/\D/g, '')
  return intPart.replace(/\D/g, '').length
}

/** 정수부가 16자리 상한에 도달했는지 */
export function isAtIntegerDigitLimit(
  formatted: string,
  allowDecimal = false,
  allowNegative = false,
): boolean {
  return countIntegerDigits(formatted, allowDecimal, allowNegative) >= MAX_INTEGER_DIGITS
}

/** 포맷 과정에서 정수부가 잘렸는지 (17자리 이상 입력 시도) */
export function wasIntegerDigitTruncated(
  raw: string,
  formatted: string,
  allowDecimal = false,
  allowNegative = false,
): boolean {
  const rawDigits = countIntegerDigits(raw, allowDecimal, allowNegative)
  const formattedDigits = countIntegerDigits(formatted, allowDecimal, allowNegative)
  return rawDigits > formattedDigits || rawDigits > MAX_INTEGER_DIGITS
}

/**
 * 숫자 문자열에 천 단위 콤마를 넣는다.
 * Number() 변환을 거치지 않아 16자리(안전 정수 초과 구간)에서도
 * 자릿수가 반올림으로 뭉개지지 않는다. 선행 0은 제거(마지막 자리는 유지).
 */
function groupThousands(digits: string): string {
  if (digits === '') return ''
  const trimmed = digits.replace(/^0+(?=\d)/, '')
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function sanitizeDecimalDigits(raw: string): string {
  let s = raw.replace(/,/g, '').replace(/[^\d.]/g, '')
  const dotIndex = s.indexOf('.')
  if (dotIndex !== -1) {
    s = s.slice(0, dotIndex + 1) + s.slice(dotIndex + 1).replace(/\./g, '')
  }
  return s
}

/** 입력 중 천 단위 콤마 포맷 */
export function formatRawNumericInput(
  raw: string,
  allowDecimal = false,
  allowNegative = false,
): string {
  const stripped = raw.replace(/,/g, '')
  const negative = allowNegative && stripped.startsWith('-')
  const unsigned = negative ? stripped.slice(1) : stripped

  if (!allowDecimal) {
    const digits = unsigned.replace(/\D/g, '').slice(0, MAX_INTEGER_DIGITS)
    if (digits === '') return negative ? '-' : ''
    const formatted = groupThousands(digits)
    return negative ? `-${formatted}` : formatted
  }

  const s = sanitizeDecimalDigits(unsigned)
  const hasTrailingDot = s.endsWith('.')
  const [rawIntPart = '', decPart = ''] = s.split('.')
  const intPart = rawIntPart.slice(0, MAX_INTEGER_DIGITS)

  const formattedInt = groupThousands(intPart)

  if (hasTrailingDot || s.includes('.')) {
    if (hasTrailingDot && decPart === '') return `${formattedInt}.`
    return `${formattedInt}.${decPart}`
  }

  return negative ? `-${formattedInt}` : formattedInt
}

/** 비율 입력용 — 콤마 없이 소수만 (예: 0.247) */
export function formatRawRateInput(raw: string): string {
  return sanitizeDecimalDigits(raw)
}

export function parseFormattedInput(text: string): number | '' {
  const cleaned = text.replace(/,/g, '').trim()
  if (cleaned === '' || cleaned === '.') return ''
  const value = Number(cleaned)
  return Number.isNaN(value) ? '' : value
}

export function formatNumberForInput(
  value: number | undefined | null,
  allowDecimal = false,
  allowNegative = false,
): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  const decimals = allowDecimal ? 2 : 0
  const rounded = roundTo(value, decimals)
  const raw = decimals > 0 ? String(rounded) : String(Math.round(rounded))
  return formatRawNumericInput(raw, allowDecimal, allowNegative)
}

export function formatRateForInput(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  const rounded = roundTo(value, 3)
  const raw = trimTrailingZeros(rounded.toFixed(3))
  return formatRawRateInput(raw)
}

/** 16자리 상한 초과 입력 시도 또는 safe integer 초과 값일 때 필드 힌트 표시 */
export function shouldShowDigitLimitHint(
  isRate: boolean,
  truncatedAttempt: boolean,
  value: number | undefined,
): boolean {
  if (isRate) return false
  if (truncatedAttempt) return true
  return exceedsSafePrecision(value)
}

/** 16자리 정수 상한 도달 시 입력 테두리 강조 (힌트와 분리) */
export function shouldShowDigitLimitBorder(
  isRate: boolean,
  text: string,
  allowDecimal = false,
  allowNegative = false,
): boolean {
  if (isRate) return false
  return isAtIntegerDigitLimit(text, allowDecimal, allowNegative)
}

/** 포커스 해제 시 저장값 정규화 */
export function normalizeInputValue(
  value: number,
  options: { isRate?: boolean; allowDecimal?: boolean },
): number {
  if (options.isRate) return roundTo(value, 3)
  if (options.allowDecimal) return roundTo(value, 2)
  return Math.round(value)
}

/** 예전 퍼센트(5 = 5%) 저장값 → 소수(0.05)로 변환 */
export function normalizeStoredRate(
  rate: number | undefined,
  fallback?: number,
): number | undefined {
  if (rate === undefined || Number.isNaN(rate)) return fallback
  if (rate > 1) return rate / 100
  return rate
}
