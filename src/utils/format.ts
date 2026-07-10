/**
 * IEEE 754 배정밀도(double)가 정수를 정확히 표현하는 한계.
 * 이 값(2^53 - 1)을 넘으면 끝자리 정수 정확도가 떨어진다.
 */
export const SAFE_PRECISION_MAX = Number.MAX_SAFE_INTEGER

/** 값이 안전 정수 한계를 넘어 정밀도 손실 위험이 있는지 */
export function exceedsSafePrecision(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && Math.abs(value) > SAFE_PRECISION_MAX
}

/** 입력/결과 객체들을 순회해 정밀도 손실 위험 값이 하나라도 있는지 검사 */
export function hasPrecisionRisk(...sources: unknown[]): boolean {
  const stack = [...sources]
  while (stack.length > 0) {
    const cur = stack.pop()
    if (cur == null) continue
    if (typeof cur === 'number') {
      if (exceedsSafePrecision(cur)) return true
      continue
    }
    if (typeof cur === 'object') {
      for (const v of Object.values(cur as Record<string, unknown>)) stack.push(v)
    }
  }
  return false
}

/** 지정 소수 자릿수로 반올림 */
export function roundTo(value: number, decimals: number): number {
  if (decimals <= 0) return Math.round(value)
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function trimTrailingZeros(fixed: string): string {
  return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
}

/** 금액·계약수 등 — 기본 정수 */
export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || Number.isNaN(value)) return '-'
  const rounded = roundTo(value, decimals)
  return rounded.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

/** 비율(%) — 소수 둘째 자리까지, 불필요한 0 제거 */
export function formatPercent(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return '-'
  const rounded = roundTo(value, decimals)
  return `${trimTrailingZeros(rounded.toFixed(decimals))}%`
}

/** 비율 숫자만 (단위 없음) */
export function formatPercentValue(value: number | null, decimals = 2): string {
  if (value === null || Number.isNaN(value)) return '-'
  const rounded = roundTo(value, decimals)
  return trimTrailingZeros(rounded.toFixed(decimals))
}

/** 계약 수 표시 — NaN·무한대는 '-' */
export function formatContractsCount(
  value: number | null | undefined,
  unit: string,
): string {
  if (value == null || !Number.isFinite(value)) return '-'
  return `${formatNumber(value)}\u00a0${unit}`
}

/** 레버리지 배수 — 예: 10배 / 10x */
export function formatLeverage(value: number | null | undefined, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '-'
  return `${formatLeverageValue(value)}${unit}`
}

/** 레버리지 배수 숫자만 (단위 없음) */
export function formatLeverageValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '-'
  const rounded = roundTo(value, 2)
  return trimTrailingZeros(rounded.toFixed(2))
}

/** 청산 여유(%) — 롱: -, 숏: + (이미 청산 위험이면 계산값 부호 유지) */
export function formatTolerancePercent(
  value: number | null,
  side: 'long' | 'short',
  decimals = 2,
): string {
  if (value === null || Number.isNaN(value)) return '-'
  if (value <= 0) return formatPercentValue(value, decimals)
  const formatted = formatPercentValue(value, decimals)
  return side === 'long' ? `-${formatted}` : `+${formatted}`
}

/** 청산까지 가격 변동폭 — 롱: 하락(-), 숏: 상승(+) */
export function formatToleranceDelta(
  value: number | null,
  side: 'long' | 'short',
  decimals = 0,
): string {
  if (value === null || Number.isNaN(value)) return '-'
  const magnitude = Math.abs(value)
  if (magnitude === 0) return '0'
  const formatted = formatNumber(magnitude, decimals)
  return side === 'long' ? `-${formatted}` : `+${formatted}`
}

/** 저장 시각 — ISO 문자열을 로컬 절대시간으로 표시 */
export function formatSavedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

/** 저장 시각 압축 표시 — MM.DD HH:mm(24시간제) */
export function formatSavedAtCompact(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return `${day} ${time}`
}
