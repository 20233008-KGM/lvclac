/** 지정 소수 자릿수로 반올림 */
export function roundTo(value: number, decimals: number): number {
  if (decimals <= 0) return Math.round(value)
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function trimTrailingZeros(fixed: string): string {
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
