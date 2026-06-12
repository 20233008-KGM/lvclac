import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

const GAP = 8
const VIEWPORT_MARGIN = 8
const TOOLTIP_Z = 10000
const FADE_MS = 140

export type FloatingTooltipPlacement = 'top' | 'bottom'

function clampHorizontal(centerX: number, halfWidth: number) {
  const min = VIEWPORT_MARGIN + halfWidth
  const max = window.innerWidth - VIEWPORT_MARGIN - halfWidth
  return Math.max(min, Math.min(max, centerX))
}

function positionTooltip(
  anchor: DOMRect,
  tip: DOMRect,
  preferred: FloatingTooltipPlacement,
): { top: number; left: number; placement: FloatingTooltipPlacement } {
  const centerX = anchor.left + anchor.width / 2
  const halfW = tip.width / 2
  const left = clampHorizontal(centerX, halfW)

  const spaceAbove = anchor.top - VIEWPORT_MARGIN
  const spaceBelow = window.innerHeight - VIEWPORT_MARGIN - anchor.bottom
  let placement = preferred
  if (preferred === 'top' && tip.height + GAP > spaceAbove && spaceBelow > spaceAbove) {
    placement = 'bottom'
  } else if (preferred === 'bottom' && tip.height + GAP > spaceBelow && spaceAbove > spaceBelow) {
    placement = 'top'
  }

  const top =
    placement === 'top'
      ? anchor.top - GAP - tip.height
      : anchor.bottom + GAP

  return { top, left, placement }
}

function isFocusLeavingAnchor(anchor: HTMLElement, event: FocusEvent) {
  const next = event.relatedTarget
  return !(next instanceof Node && anchor.contains(next))
}

interface UseFloatingTooltipOptions {
  placement?: FloatingTooltipPlacement
  /** anchor가 아닌 자식(버튼 등)에 포커스가 있을 때 */
  focusWithin?: boolean
}

export function useFloatingTooltip({
  placement = 'top',
  focusWithin = false,
}: UseFloatingTooltipOptions = {}) {
  const anchorRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showFrameRef = useRef<number | null>(null)
  const mountedRef = useRef(false)
  const activeRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(false)
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: -9999,
    left: -9999,
    zIndex: TOOLTIP_Z,
  })
  const [resolvedPlacement, setResolvedPlacement] = useState<FloatingTooltipPlacement>(placement)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current != null) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const clearShowFrame = useCallback(() => {
    if (showFrameRef.current != null) {
      cancelAnimationFrame(showFrameRef.current)
      showFrameRef.current = null
    }
  }, [])

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const tip = tooltipRef.current
    if (!anchor || !tip) return

    const anchorRect = anchor.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    const { top, left, placement: resolved } = positionTooltip(anchorRect, tipRect, placement)

    const anchorCenterX = anchorRect.left + anchorRect.width / 2
    const arrowLeft = anchorCenterX - tipRect.left

    setResolvedPlacement(resolved)
    setStyle({
      position: 'fixed',
      top,
      left,
      zIndex: TOOLTIP_Z,
      ['--floating-tooltip-arrow-left' as string]: `${arrowLeft}px`,
    })
  }, [placement])

  useLayoutEffect(() => {
    if (!mounted) return
    updatePosition()
    const raf = requestAnimationFrame(() => updatePosition())
    const onReflow = () => updatePosition()
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onReflow) : null
    if (ro && tooltipRef.current) ro.observe(tooltipRef.current)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
      ro?.disconnect()
    }
  }, [mounted, updatePosition])

  useLayoutEffect(() => {
    return () => {
      clearHideTimer()
      clearShowFrame()
    }
  }, [clearHideTimer, clearShowFrame])

  const show = useCallback(() => {
    clearHideTimer()
    clearShowFrame()

    if (mountedRef.current) {
      if (!activeRef.current) {
        activeRef.current = true
        setActive(true)
      }
      updatePosition()
      return
    }

    mountedRef.current = true
    activeRef.current = false
    setMounted(true)
    setActive(false)
    showFrameRef.current = requestAnimationFrame(() => {
      updatePosition()
      showFrameRef.current = requestAnimationFrame(() => {
        showFrameRef.current = null
        activeRef.current = true
        setActive(true)
        updatePosition()
      })
    })
  }, [clearHideTimer, clearShowFrame, updatePosition])

  const hide = useCallback(() => {
    clearShowFrame()
    activeRef.current = false
    setActive(false)
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null
      mountedRef.current = false
      setMounted(false)
    }, FADE_MS)
  }, [clearHideTimer, clearShowFrame])

  const anchorHandlers = {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: focusWithin ? undefined : show,
    onBlur: focusWithin
      ? undefined
      : (e: FocusEvent<HTMLElement>) => {
          if (isFocusLeavingAnchor(e.currentTarget, e)) hide()
        },
  }

  const focusWithinHandlers = focusWithin
    ? {
        onFocus: show,
        onBlur: (e: FocusEvent<HTMLElement>) => {
          if (isFocusLeavingAnchor(e.currentTarget, e)) hide()
        },
      }
    : undefined

  function renderTooltip(
    className: string,
    content: ReactNode,
    options?: { id?: string; role?: string },
  ) {
    if (!mounted) return null
    return createPortal(
      <span
        ref={tooltipRef}
        id={options?.id}
        role={options?.role ?? 'tooltip'}
        className={`${className} floating-tooltip-layer${active ? ' floating-tooltip-layer--active' : ''}${resolvedPlacement === 'bottom' ? ' floating-tooltip-layer--below' : ''}`}
        style={style}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {content}
      </span>,
      document.body,
    )
  }

  return {
    anchorRef: anchorRef as RefObject<HTMLElement>,
    open: mounted,
    anchorHandlers,
    focusWithinHandlers,
    renderTooltip,
  }
}
