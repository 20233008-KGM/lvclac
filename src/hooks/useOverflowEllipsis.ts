import { useLayoutEffect, useState, type RefObject } from 'react'

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
      setOverflowing(el.scrollWidth > el.clientWidth + 1)
    }

    check()
    const ro = new ResizeObserver(() => requestAnimationFrame(check))
    ro.observe(el)
    const parent = el.parentElement
    if (parent) ro.observe(parent)

    return () => ro.disconnect()
  }, [ref, enabled, ...deps])

  return overflowing
}
