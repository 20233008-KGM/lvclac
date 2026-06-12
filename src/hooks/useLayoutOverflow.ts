import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { DESKTOP_MIN, MIN_FIT_SCALE } from '../utils/gridLayoutUtils'
import { clearAutoExpandSuppress } from './layoutScanPrefs'
import type { ExpandResult, OverflowMeasure } from './useGridResize'

const FIT_SCALE_EPSILON = 0.005
const LAYOUT_SETTLE_MS = 180
const EXPAND_DEBOUNCE_MS = 48

function measureOverflow(container: HTMLElement): OverflowMeasure {
  let inputOverflow = 0
  let resultOverflow = 0

  container
    .querySelectorAll<HTMLInputElement>(
      '.number-stepper__input input, .input-commit-row__input, .field > input, .field input',
    )
    .forEach((el) => {
      const over = el.scrollWidth - el.clientWidth
      if (over > 0) inputOverflow = Math.max(inputOverflow, over)
    })

  container.querySelectorAll('.fit-text').forEach((outer) => {
    const inner = outer.querySelector('.fit-text__clip, .fit-text__inner')
    if (!inner) return
    const over = inner.scrollWidth - outer.clientWidth
    if (over > 0) resultOverflow = Math.max(resultOverflow, over)
  })

  return {
    inputOverflow,
    resultOverflow,
    hasOverflow: inputOverflow > 0 || resultOverflow > 0,
  }
}

/** scale 보정 width 영향 없이 자연 콘텐츠 폭 기준 (calc-scale-root 내 calc-grid만 측정) */
function measureFitScale(scaleRoot: HTMLElement, viewportWidth: number): number {
  const grid = scaleRoot.querySelector('.calc-grid')
  const contentWidth =
    grid instanceof HTMLElement && grid.scrollWidth > 0
      ? grid.scrollWidth
      : scaleRoot.scrollWidth
  if (contentWidth <= 0 || viewportWidth <= 0) return 1
  const scale = Math.max(MIN_FIT_SCALE, Math.min(1, viewportWidth / contentWidth))
  return Math.round(scale * 1000) / 1000
}

function scheduleScanAfterPaint(onScan: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(onScan)
    })
  })
}

interface UseLayoutOverflowOptions {
  containerRef: RefObject<HTMLElement | null>
  fitRootRef: RefObject<HTMLElement | null>
  layoutMode: 'auto' | 'manual'
  expandToFit: (measure: OverflowMeasure) => ExpandResult
  /** 첫 자동 확장(split·gap) 시 리사이저 안내 애니메이션 */
  onAutoExpand?: () => void
  refreshGeometry?: () => void
  /** inputs 변경 시 재측정 트리거 */
  measureKey?: string
  /** 리사이저 초기화 등 레이아웃 리셋 시 재측정 트리거 */
  layoutVersion?: number
}

export function useLayoutOverflow({
  containerRef,
  fitRootRef,
  layoutMode,
  expandToFit,
  onAutoExpand,
  refreshGeometry,
  measureKey,
  layoutVersion = 0,
}: UseLayoutOverflowOptions) {
  const [fitScale, setFitScale] = useState(1)
  const fitScaleRef = useRef(1)
  const onAutoExpandRef = useRef(onAutoExpand)
  onAutoExpandRef.current = onAutoExpand

  const suppressResizeUntilRef = useRef(0)
  const prevMeasureKeyRef = useRef<string | undefined>(undefined)
  const expandToFitRef = useRef(expandToFit)
  const refreshGeometryRef = useRef(refreshGeometry)
  expandToFitRef.current = expandToFit
  refreshGeometryRef.current = refreshGeometry

  const applyFitScale = (next: number) => {
    if (Math.abs(next - fitScaleRef.current) < FIT_SCALE_EPSILON) return
    fitScaleRef.current = next
    setFitScale(next)
  }

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    let roRaf = 0

    const tryExpand = (): ExpandResult | null => {
      const measure = measureOverflow(container)
      if (!measure.hasOverflow) return null
      return expandToFitRef.current(measure)
    }

    const runDesktopExpand = (fromResize: boolean) => {
      if (fromResize && performance.now() < suppressResizeUntilRef.current) return

      applyFitScale(1)

      const result = tryExpand()
      if (!result) return

      if (result.changed) {
        suppressResizeUntilRef.current = performance.now() + LAYOUT_SETTLE_MS
        return
      }

      const refresh = refreshGeometryRef.current
      if (refresh) {
        refresh()
        requestAnimationFrame(() => {
          const retry = tryExpand()
          if (retry?.changed) {
            suppressResizeUntilRef.current = performance.now() + LAYOUT_SETTLE_MS
          }
        })
      }
    }

    const run = (fromResize: boolean) => {
      const vw = document.documentElement.clientWidth
      const isDesktop = vw >= DESKTOP_MIN

      if (layoutMode === 'manual') {
        applyFitScale(1)
        return
      }

      if (!isDesktop) {
        const fitRoot = fitRootRef.current
        if (!fitRoot) {
          applyFitScale(1)
          return
        }
        applyFitScale(measureFitScale(fitRoot, container.clientWidth))
        return
      }

      // 데스크톱 자동 확장·스캔은 measureKey(사용자 입력) 경로만 — RO가 먼저 확장하면 스캔이 누락됨
      if (fromResize) return

      runDesktopExpand(false)
    }

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(roRaf)
      roRaf = requestAnimationFrame(() => run(true))
    })
    ro.observe(container)

    const fitRoot = fitRootRef.current
    if (fitRoot && document.documentElement.clientWidth < DESKTOP_MIN) {
      ro.observe(fitRoot)
    }

    if (layoutMode === 'auto' && document.documentElement.clientWidth >= DESKTOP_MIN) {
      scheduleScanAfterPaint(() => runDesktopExpand(false))
    }

    return () => {
      cancelAnimationFrame(roRaf)
      ro.disconnect()
    }
  }, [containerRef, fitRootRef, layoutMode, layoutVersion])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isUserInput =
      prevMeasureKeyRef.current !== undefined && prevMeasureKeyRef.current !== measureKey
    if (isUserInput) clearAutoExpandSuppress()
    prevMeasureKeyRef.current = measureKey

    const timer = window.setTimeout(() => {
      const vw = document.documentElement.clientWidth
      if (layoutMode === 'manual' || vw < DESKTOP_MIN) return

      const tryExpand = (): ExpandResult | null => {
        const measure = measureOverflow(container)
        if (!measure.hasOverflow) return null
        return expandToFitRef.current(measure)
      }

      const finishExpand = (scan: boolean) => {
        suppressResizeUntilRef.current = performance.now() + LAYOUT_SETTLE_MS
        if (scan && onAutoExpandRef.current) {
          scheduleScanAfterPaint(() => onAutoExpandRef.current?.())
        }
      }

      const result = tryExpand()
      if (!result) return

      if (result.changed) {
        finishExpand(isUserInput)
        return
      }

      const refresh = refreshGeometryRef.current
      if (refresh) {
        refresh()
        requestAnimationFrame(() => {
          const retry = tryExpand()
          if (retry?.changed) finishExpand(isUserInput)
        })
      }
    }, EXPAND_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [containerRef, layoutMode, measureKey, layoutVersion])

  return { fitScale }
}
