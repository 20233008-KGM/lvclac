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

/** 청산 여유(%) — 롱: -, 숏: + */
export function formatTolerancePercent(
  value: number | null,
  side: 'long' | 'short',
  decimals = 2,
): string {
  if (value === null || Number.isNaN(value)) return '-'
  const magnitude = Math.abs(value)
  if (magnitude === 0) return '0'
  const formatted = formatPercentValue(magnitude, decimals)
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
