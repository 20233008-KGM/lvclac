import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import type { LayoutMode } from '../context/LayoutContext'
import {
  canShowAutoWidenScan,
  markAutoWidenScanShown,
  markLayoutReset,
  markResizerManual,
  shouldSuppressAutoExpand,
} from './layoutScanPrefs'
import {
  clamp,
  computeExpandLayout,
  DESKTOP_MIN,
  GRID_HANDLE_WIDTH,
  hasCustomGaps,
  isLayoutCustom,
  measureMinCalculatorMid,
  MIN_CALC_MID_FALLBACK,
  MIN_EDGE_X,
  sideVars,
  type Geometry,
  type GridLayout,
} from '../utils/gridLayoutUtils'

export type GridResizeHandle = 'left' | 'center' | 'right'

export interface OverflowMeasure {
  inputOverflow: number
  resultOverflow: number
  hasOverflow: boolean
}

export interface ExpandResult {
  changed: boolean
  widened: boolean
}

const STORAGE_KEY = 'calc-grid-layout-v3'

/** calc-grid--scan CSS 애니메이션 길이와 맞춤 */
const GRID_SCAN_MS = 2800
/** 리셋 버튼: 스캔 동기(2.8s) + 밝기 유지(2.2s) + 페이드(2.2s) */
const RESET_BTN_HOLD_MS = 2200
const RESET_BTN_FADE_MS = 2200
const RESET_BTN_GLOW_MS = GRID_SCAN_MS + RESET_BTN_HOLD_MS + RESET_BTN_FADE_MS

const DEFAULT_LAYOUT: GridLayout = { leftX: null, rightX: null, split: 0.5, manual: false }

function viewportWidth(): number {
  return typeof document === 'undefined' ? 0 : document.documentElement.clientWidth
}

function loadLayout(): GridLayout {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_LAYOUT
    const parsed = JSON.parse(raw) as Partial<GridLayout>
    const split = Number.isFinite(parsed.split) ? clamp(parsed.split as number, 0.1, 0.9) : 0.5
    const num = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : null
    return {
      leftX: num(parsed.leftX),
      rightX: num(parsed.rightX),
      split,
      manual: parsed.manual === true,
    }
  } catch {
    return DEFAULT_LAYOUT
  }
}

/** 기본 상태(커스텀 미적용)에서 계산기·사이드 광고의 실제 위치를 측정 */
function measureGeometry(container: HTMLElement | null): Geometry | null {
  if (!container || viewportWidth() < DESKTOP_MIN) return null
  const adL = document.querySelector('.ad-column-left')
  const adR = document.querySelector('.ad-column-right')
  if (!adL || !adR) return null
  const W = viewportWidth()
  const c = container.getBoundingClientRect()
  const l = adL.getBoundingClientRect()
  const r = adR.getBoundingClientRect()
  if (l.width === 0 || r.width === 0) return null
  return {
    adW: l.width,
    outerL: Math.max(0, l.left),
    innerL: Math.max(0, c.left - l.right),
    outerR: Math.max(0, W - r.right),
    innerR: Math.max(0, r.left - c.right),
    leftX0: Math.max(0, c.left),
    rightX0: Math.max(0, W - c.right),
  }
}

function setAdColumnA11y(hidden: { left: boolean; right: boolean }) {
  const adL = document.querySelector('.ad-column-left')
  const adR = document.querySelector('.ad-column-right')
  for (const [el, isHidden] of [
    [adL, hidden.left],
    [adR, hidden.right],
  ] as const) {
    if (!el) continue
    if (isHidden) el.setAttribute('aria-hidden', 'true')
    else el.removeAttribute('aria-hidden')
  }
}

export function useGridResize(persist: boolean) {
  const containerRef = useRef<HTMLElement | null>(null)
  const geometryRef = useRef<Geometry | null>(null)
  const layoutRef = useRef<GridLayout>(DEFAULT_LAYOUT)
  const [layout, setLayout] = useState<GridLayout>(() => (persist ? loadLayout() : DEFAULT_LAYOUT))
  const [geoVersion, setGeoVersion] = useState(0)
  const [activeHandle, setActiveHandle] = useState<GridResizeHandle | null>(null)
  const [gridScanning, setGridScanning] = useState(false)
  const [scanGeneration, setScanGeneration] = useState(0)
  const [resetBtnGlowing, setResetBtnGlowing] = useState(false)
  const [resetBtnGlowGeneration, setResetBtnGlowGeneration] = useState(0)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const dragRef = useRef<GridResizeHandle | null>(null)

  layoutRef.current = layout

  const hasGaps = hasCustomGaps(layout)
  const isCustom = isLayoutCustom(layout)
  const layoutMode: LayoutMode = layout.manual ? 'manual' : 'auto'

  const refreshGeometry = useCallback(() => {
    geometryRef.current = measureGeometry(containerRef.current)
    setGeoVersion((v) => v + 1)
  }, [])

  useLayoutEffect(() => {
    if ((hasCustomGaps(layout) || layout.manual) && !geometryRef.current) {
      geometryRef.current = measureGeometry(containerRef.current)
      setGeoVersion((v) => v + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearRoot = useCallback(() => {
    const root = document.documentElement
    for (const prop of [
      '--calc-outer-left',
      '--calc-inner-left',
      '--calc-outer-right',
      '--calc-inner-right',
      '--calc-ad-w-left',
      '--calc-ad-w-right',
    ]) {
      root.style.removeProperty(prop)
    }
    delete root.dataset.calcResize
    delete root.dataset.calcAdLeftHidden
    delete root.dataset.calcAdRightHidden
    setAdColumnA11y({ left: false, right: false })
  }, [])

  useLayoutEffect(() => {
    const geo = geometryRef.current
    if (!hasGaps || !geo) {
      clearRoot()
      return
    }
    const W = viewportWidth()
    const container = containerRef.current
    const minMid = container ? measureMinCalculatorMid(container) : MIN_CALC_MID_FALLBACK
    const leftRaw = layout.leftX ?? geo.leftX0
    const rightRaw = layout.rightX ?? geo.rightX0
    const maxLeftX = W - rightRaw - minMid
    const maxRightX = W - leftRaw - minMid
    const leftX = clamp(leftRaw, MIN_EDGE_X, maxLeftX)
    const rightX = clamp(rightRaw, MIN_EDGE_X, maxRightX)
    const edgeOpts = layout.manual ? { edgeFloor: 0 as const } : undefined
    const left = sideVars(leftX, geo.adW, geo.outerL, edgeOpts)
    const right = sideVars(rightX, geo.adW, geo.outerR, edgeOpts)
    const root = document.documentElement
    root.style.setProperty('--calc-ad-w-left', `${left.adW}px`)
    root.style.setProperty('--calc-ad-w-right', `${right.adW}px`)
    root.style.setProperty('--calc-outer-left', `${left.outer}px`)
    root.style.setProperty('--calc-inner-left', `${left.inner}px`)
    root.style.setProperty('--calc-outer-right', `${right.outer}px`)
    root.style.setProperty('--calc-inner-right', `${right.inner}px`)
    root.dataset.calcResize = 'custom'
    if (left.hidden) root.dataset.calcAdLeftHidden = ''
    else delete root.dataset.calcAdLeftHidden
    if (right.hidden) root.dataset.calcAdRightHidden = ''
    else delete root.dataset.calcAdRightHidden
    setAdColumnA11y({ left: left.hidden, right: right.hidden })
  }, [hasGaps, layout.leftX, layout.rightX, layout.manual, geoVersion, clearRoot])

  useEffect(() => clearRoot, [clearRoot])

  useEffect(() => {
    try {
      if (persist) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 무시 */
    }
  }, [persist, layout])

  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetGlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerResizerScan = useCallback(() => {
    if (viewportWidth() < DESKTOP_MIN) return
    if (!canShowAutoWidenScan(layoutRef.current.manual)) return

    markAutoWidenScanShown()

    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current)
    if (resetGlowTimerRef.current) window.clearTimeout(resetGlowTimerRef.current)
    setGridScanning(false)
    setResetBtnGlowing(false)

    requestAnimationFrame(() => {
      setScanGeneration((g) => g + 1)
      setResetBtnGlowGeneration((g) => g + 1)
      setGridScanning(true)
      setResetBtnGlowing(true)

      scanTimerRef.current = window.setTimeout(() => {
        setGridScanning(false)
        scanTimerRef.current = null
      }, GRID_SCAN_MS)

      resetGlowTimerRef.current = window.setTimeout(() => {
        setResetBtnGlowing(false)
        resetGlowTimerRef.current = null
      }, RESET_BTN_GLOW_MS)
    })
  }, [])

  const expandToFit = useCallback((measure: OverflowMeasure): ExpandResult => {
    if (
      shouldSuppressAutoExpand() ||
      layoutRef.current.manual ||
      viewportWidth() < DESKTOP_MIN
    ) {
      return { changed: false, widened: false }
    }

    if (!geometryRef.current) {
      geometryRef.current = measureGeometry(containerRef.current)
      if (geometryRef.current) setGeoVersion((v) => v + 1)
    }

    const geo = geometryRef.current
    if (!geo) return { changed: false, widened: false }

    const container = containerRef.current
    const midWidth = container
      ? Math.max(0, container.clientWidth - GRID_HANDLE_WIDTH * 3)
      : 0
    const step = computeExpandLayout(
      layoutRef.current,
      geo,
      measure.inputOverflow,
      measure.resultOverflow,
      midWidth,
    )
    if (!step.changed) return { changed: false, widened: false }

    layoutRef.current = step.layout
    setLayout(step.layout)
    return { changed: true, widened: step.widened }
  }, [])

  const applyDrag = useCallback((handle: GridResizeHandle, clientX: number) => {
    const geo = geometryRef.current
    if (!geo) return
    const W = viewportWidth()
    const container = containerRef.current
    const minMid = container ? measureMinCalculatorMid(container) : MIN_CALC_MID_FALLBACK

    setLayout((prev) => {
      const leftX = prev.leftX ?? geo.leftX0
      const rightX = prev.rightX ?? geo.rightX0
      const manual = true

      if (handle === 'left') {
        const maxLeftX = W - rightX - minMid
        return { ...prev, manual, leftX: clamp(clientX, MIN_EDGE_X, maxLeftX), rightX }
      }
      if (handle === 'right') {
        const maxRightX = W - leftX - minMid
        return { ...prev, manual, leftX, rightX: clamp(W - clientX, MIN_EDGE_X, maxRightX) }
      }
      const mid = W - leftX - rightX
      if (mid <= 0) return { ...prev, manual }
      const minSplit = clamp(240 / mid, 0.1, 0.5)
      const split = clamp((clientX - leftX) / mid, minSplit, 1 - minSplit)
      return { ...prev, manual, split }
    })
  }, [])

  const onPointerMove = useRef<(e: globalThis.PointerEvent) => void>(() => {})
  const onPointerUp = useRef<() => void>(() => {})

  const endDrag = useCallback(() => {
    dragRef.current = null
    setActiveHandle(null)
    document.body.style.removeProperty('cursor')
    document.body.style.removeProperty('user-select')
    window.removeEventListener('pointermove', onPointerMove.current)
    window.removeEventListener('pointerup', onPointerUp.current)
  }, [])

  onPointerMove.current = (e: globalThis.PointerEvent) => {
    if (!dragRef.current) return
    applyDrag(dragRef.current, e.clientX)
  }
  onPointerUp.current = () => endDrag()

  useEffect(() => endDrag, [endDrag])

  const startDrag = useCallback(
    (handle: GridResizeHandle) => (e: PointerEvent) => {
      if (!geometryRef.current) {
        geometryRef.current = measureGeometry(containerRef.current)
        if (!geometryRef.current) return
        setGeoVersion((v) => v + 1)
      }
      e.preventDefault()
      markResizerManual()
      dragRef.current = handle
      setActiveHandle(handle)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('pointermove', onPointerMove.current)
      window.addEventListener('pointerup', onPointerUp.current)
    },
    [],
  )

  const reset = useCallback(() => {
    markLayoutReset()
    geometryRef.current = null
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current)
    if (resetGlowTimerRef.current) window.clearTimeout(resetGlowTimerRef.current)
    scanTimerRef.current = null
    resetGlowTimerRef.current = null
    setGridScanning(false)
    setResetBtnGlowing(false)
    setLayout({ ...DEFAULT_LAYOUT })
    setLayoutVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    const onResize = () => {
      geometryRef.current = measureGeometry(containerRef.current)
      setGeoVersion((v) => v + 1)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const gridStyle = {
    '--calc-left-col': `${layout.split}fr`,
    '--calc-right-col': `${1 - layout.split}fr`,
    '--calc-handle-w': '10px',
  } as CSSProperties

  const getHandleProps = useCallback(
    (handle: GridResizeHandle) => ({
      role: 'separator' as const,
      'aria-orientation': 'vertical' as const,
      tabIndex: -1,
      className: [
        'calc-grid__resizer',
        `calc-grid__resizer--${handle}`,
        activeHandle === handle ? 'calc-grid__resizer--active' : '',
      ]
        .filter(Boolean)
        .join(' '),
      onPointerDown: startDrag(handle),
    }),
    [activeHandle, startDrag],
  )

  return {
    containerRef,
    gridStyle,
    gridScanning,
    scanGeneration,
    resetBtnGlowing,
    resetBtnGlowGeneration,
    getHandleProps,
    isCustom,
    layoutMode,
    layoutVersion,
    reset,
    refreshGeometry,
    expandToFit,
    triggerResizerScan,
  }
}
