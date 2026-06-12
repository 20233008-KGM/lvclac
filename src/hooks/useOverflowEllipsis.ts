import { useLayoutEffect, useState, type RefObject } from 'react'

const OVERFLOW_EPSILON = 1

/** transform: scale 등 레이아웃·시각 폭 비율 */
function getLayoutScale(el: HTMLElement): number {
  const rect = el.getBoundingClientRect()
  if (el.clientWidth > 0) return rect.width / el.clientWidth
  if (el.clientHeight > 0) return rect.height / el.clientHeight
  return 1
}

function findClipRoot(el: HTMLElement): HTMLElement | null {
  return el.closest('.calc-viewport')
}

/** scrollWidth·뷰포트 클립·scale 축소로 잘린 경우 포함 */
export function isContentOverflowing(el: HTMLElement): boolean {
  if (el.scrollWidth > el.clientWidth + OVERFLOW_EPSILON) return true

  const scale = getLayoutScale(el)
  const visualContentW = el.scrollWidth * scale
  const elRect = el.getBoundingClientRect()

  if (visualContentW > elRect.width + OVERFLOW_EPSILON) return true

  const clipRoot = findClipRoot(el)
  if (!clipRoot) return false

  const rootRect = clipRoot.getBoundingClientRect()
  const visibleW =
    Math.min(elRect.right, rootRect.right) - Math.max(elRect.left, rootRect.left)

  if (visibleW < elRect.width - OVERFLOW_EPSILON && visualContentW > visibleW + OVERFLOW_EPSILON) {
    return true
  }

  if (
    (elRect.right > rootRect.right + OVERFLOW_EPSILON ||
      elRect.left < rootRect.left - OVERFLOW_EPSILON) &&
    visualContentW > Math.max(visibleW, 0) + OVERFLOW_EPSILON
  ) {
    return true
  }

  return false
}

/** scrollWidth > clientWidth — 잘린 텍스트에 … 표시용 */
export function useOverflowEllipsis(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  deps: unknown[] = [],
) {
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    if (!enabled) {
      setOverflowing(false)
      return
    }

    const el = ref.current
    if (!el) return

    const check = () => {
      setOverflowing(isContentOverflowing(el))
    }

    check()
    const ro = new ResizeObserver(() => requestAnimationFrame(check))
    ro.observe(el)
    const parent = el.parentElement
    if (parent) ro.observe(parent)
    const clipRoot = findClipRoot(el)
    if (clipRoot && clipRoot !== parent) ro.observe(clipRoot)

    return () => ro.disconnect()
  }, [ref, enabled, ...deps])

  return overflowing
}
