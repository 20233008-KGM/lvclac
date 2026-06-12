/** px당 1틱 — 값이 작을수록 드래그가 빠름 */
export const DEFAULT_SCRUB_PX_PER_TICK = 6
export const PRICE_SCRUB_PX_PER_TICK = 6
export const CONTRACTS_SCRUB_PX_PER_TICK = 7

export function consumeScrubPx(
  accumPx: number,
  deltaPx: number,
  pxPerTick: number,
): { nextAccumPx: number; tickDelta: number } {
  if (deltaPx === 0 || pxPerTick <= 0) {
    return { nextAccumPx: accumPx, tickDelta: 0 }
  }

  const combined = accumPx + deltaPx
  const tickDelta = Math.trunc(combined / pxPerTick)
  const nextAccumPx = combined - tickDelta * pxPerTick
  return { nextAccumPx, tickDelta }
}

/** tickDelta × step — 항상 틱 배수만큼만 이동 */
export function applyScrubTicks(
  current: number,
  tickDelta: number,
  step: number,
  minValue?: number,
): number {
  if (tickDelta === 0) return current

  let next = current + tickDelta * step
  if (step > 0) next = snapToStep(next, step)
  if (minValue != null) next = Math.max(minValue, next)
  if (step > 0 && minValue != null) next = snapToStep(next, step)
  return next
}

/** @deprecated applyScrubTicks 와 동일 */
export function applyScrubLinearTicks(
  current: number,
  tickDelta: number,
  step: number,
  minValue?: number,
): number {
  return applyScrubTicks(current, tickDelta, step, minValue)
}

export function snapToStep(value: number, step: number): number {
  if (step <= 0) return Math.round(value)
  return Math.round(value / step) * step
}

export function isAlignedToStep(value: number, step: number): boolean {
  if (step <= 0) return Number.isInteger(value)
  return Math.abs(value - snapToStep(value, step)) < 1e-9
}
