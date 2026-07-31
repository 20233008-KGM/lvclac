export type PointerMode = 'pending' | 'holdRepeat' | 'scrub'

export const SCRUB_ACTIVATION_PX = 8
export const HOLD_DELAY_MS = 400
export const HOLD_INTERVAL_MS = 80

export function shouldFocusInputForPointer(pointerType: string): boolean {
  return pointerType === 'mouse'
}

export function resolveStepperBaseValue({
  value,
  inputFocused,
  inputDraft,
  enableDragScrub,
  scrubSeedValue,
}: {
  value: number | undefined
  inputFocused: boolean
  inputDraft: number | undefined
  enableDragScrub: boolean
  scrubSeedValue: number | undefined
}): number {
  if (inputFocused && inputDraft != null) return inputDraft
  if (value != null) return value
  if (enableDragScrub && scrubSeedValue != null) return scrubSeedValue
  return 0
}

export function shouldEnterScrub(mode: PointerMode, startY: number, clientY: number): boolean {
  if (mode !== 'pending') return false
  return Math.abs(clientY - startY) >= SCRUB_ACTIVATION_PX
}

export function resolvePointerUp(mode: PointerMode): 'tap' | 'scrubEnd' | 'holdEnd' {
  if (mode === 'pending') return 'tap'
  if (mode === 'scrub') return 'scrubEnd'
  return 'holdEnd'
}
