export const DEFAULT_FINGER_PX = 44

export function scrubMultiplierFromDelta(deltaPx: number, fingerPx: number): number {
  if (deltaPx === 0 || fingerPx <= 0) return 1
  return Math.pow(2, deltaPx / fingerPx)
}

export function applyScrubMultiplier(
  value: number,
  deltaPx: number,
  fingerPx: number,
  minValue = 0,
): number {
  if (deltaPx === 0) return value
  const next = Math.round(value * scrubMultiplierFromDelta(deltaPx, fingerPx))
  return Math.max(minValue, next)
}

export function snapToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value)
  return Math.round(value / step) * step
}
