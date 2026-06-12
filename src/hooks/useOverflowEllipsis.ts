import { useLayoutEffect, useState, type RefObject } from 'react'

/** 서브픽셀·tabular-nums — … 켜기 전 여유 */
const OVERFLOW_ON_MARGIN = 4

function measureTextWidth(scrollWidth: number): number {
  return Math.ceil(scrollWidth)
}

function measureBoxWidth(clientWidth: number): number {
  return Math.floor(clientWidth)
}

/**
 * ellipsis가 그려지는 요소 자체의 scrollWidth vs clientWidth.
 * wasOverflowing이면 잘림이 남는 한 … 유지(최소 축소 시 신호).
 */
export function isScrollOverflowing(
  scrollWidth: number,
  clientWidth: number,
  wasOverflowing: boolean,
): boolean {
  const textW = measureTextWidth(scrollWidth)
  const boxW = measureBoxWidth(clientWidth)

  if (boxW <= 0) return wasOverflowing

  if (wasOverflowing) {
    return textW > boxW
  }

  return textW > boxW + OVERFLOW_ON_MARGIN
}

export function isContentOverflowing(el: HTMLElement, wasOverflowing = false): boolean {
  return isScrollOverflowing(el.scrollWidth, el.clientWidth, wasOverflowing)
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
      setOverflowing((prev) => {
        const next = isContentOverflowing(el, prev)
        return prev === next ? prev : next
      })
    }

    check()
    let raf = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(check)
      })
    })
    ro.observe(el)
    let ancestor: HTMLElement | null = el.parentElement
    let depth = 0
    while (ancestor && depth < 4) {
      ro.observe(ancestor)
      ancestor = ancestor.parentElement
      depth += 1
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [ref, enabled, ...deps])

  return overflowing
}
