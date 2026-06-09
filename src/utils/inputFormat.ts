import { roundTo, trimTrailingZeros } from './format'

function sanitizeDecimalDigits(raw: string): string {
  let s = raw.replace(/,/g, '').replace(/[^\d.]/g, '')
  const dotIndex = s.indexOf('.')
  if (dotIndex !== -1) {
    s = s.slice(0, dotIndex + 1) + s.slice(dotIndex + 1).replace(/\./g, '')
  }
  return s
}

/** 입력 중 천 단위 콤마 포맷 */
export function formatRawNumericInput(raw: string, allowDecimal = false): string {
  const stripped = raw.replace(/,/g, '')

  if (!allowDecimal) {
    const digits = stripped.replace(/\D/g, '')
    if (digits === '') return ''
    return Number(digits).toLocaleString('ko-KR')
  }

  const s = sanitizeDecimalDigits(stripped)
  const hasTrailingDot = s.endsWith('.')
  const [intPart = '', decPart = ''] = s.split('.')

  const formattedInt =
    intPart === '' ? (hasTrailingDot ? '' : '') : Number(intPart).toLocaleString('ko-KR')

  if (hasTrailingDot || s.includes('.')) {
    if (hasTrailingDot && decPart === '') return `${formattedInt}.`
    return `${formattedInt}.${decPart}`
  }

  return formattedInt
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

export function formatNumberForInput(value: number | undefined | null, allowDecimal = false): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  const decimals = allowDecimal ? 2 : 0
  const rounded = roundTo(value, decimals)
  const raw = decimals > 0 ? String(rounded) : String(Math.round(rounded))
  return formatRawNumericInput(raw, allowDecimal)
}

export function formatRateForInput(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return ''
  const rounded = roundTo(value, 3)
  const raw = trimTrailingZeros(rounded.toFixed(3))
  return formatRawRateInput(raw)
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
