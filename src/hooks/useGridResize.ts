import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'

export type GridResizeHandle = 'left' | 'center' | 'right'

interface GridLayout {
  /** 계산기 왼쪽 가장자리의 뷰포트 좌측 끝 기준 거리(px). null = 기본(미커스텀) */
  leftX: number | null
  /** 계산기 오른쪽 가장자리의 뷰포트 우측 끝 기준 거리(px). null = 기본 */
  rightX: number | null
  /** 입력:결과 두 컬럼 분할 비율 (0~1, 왼쪽 컬럼 몫) */
  split: number
}

/** 측정된 기본 레이아웃 기하(사이드 광고가 보이는 데스크톱 기준) */
interface Geometry {
  adW: number
  outerL: number
  innerL: number
  outerR: number
  innerR: number
  leftX0: number
  rightX0: number
}

const STORAGE_KEY = 'calc-grid-layout-v3'
/** 리사이저/풀확장이 의미 있는 최소 뷰포트 폭(사이드 광고 존재 구간) */
const DESKTOP_MIN = 1024

const DEFAULT_LAYOUT: GridLayout = { leftX: null, rightX: null, split: 0.5 }

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

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
    return { leftX: num(parsed.leftX), rightX: num(parsed.rightX), split }
  } catch {
    return DEFAULT_LAYOUT
  }
}

function hasCustomGaps(layout: GridLayout): boolean {
  return layout.leftX !== null || layout.rightX !== null
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

/** 한쪽 가장자리 거리 x → 광고 바깥 여백(outer)·계산기와 광고 사이 간격(inner) */
function sideVars(x: number, adW: number, outer0: number): { outer: number; inner: number } {
  const inner = Math.max(0, x - adW - outer0)
  const outer = clamp(x - adW, 0, outer0)
  return { outer, inner }
}

export function useGridResize(persist: boolean) {
  const containerRef = useRef<HTMLElement | null>(null)
  const geometryRef = useRef<Geometry | null>(null)
  const [layout, setLayout] = useState<GridLayout>(() => (persist ? loadLayout() : DEFAULT_LAYOUT))
  const [geoVersion, setGeoVersion] = useState(0)
  const [activeHandle, setActiveHandle] = useState<GridResizeHandle | null>(null)
  const dragRef = useRef<GridResizeHandle | null>(null)

  const hasGaps = hasCustomGaps(layout)
  const isCustom = hasGaps || layout.split !== 0.5

  const refreshGeometry = useCallback(() => {
    geometryRef.current = measureGeometry(containerRef.current)
    setGeoVersion((v) => v + 1)
  }, [])

  // 새로고침 복원: 저장된 커스텀이 있으면 기본 상태에서 기하를 측정해 적용
  useLayoutEffect(() => {
    if (hasCustomGaps(layout) && !geometryRef.current) {
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
      '--calc-ad-w',
    ]) {
      root.style.removeProperty(prop)
    }
    delete root.dataset.calcResize
  }, [])

  // 루트(html)에 push 그리드용 CSS 변수 + 데이터 속성 적용
  useEffect(() => {
    const geo = geometryRef.current
    if (!hasGaps || !geo) {
      clearRoot()
      return
    }
    const leftX = clamp(layout.leftX ?? geo.leftX0, geo.adW, geo.leftX0)
    const rightX = clamp(layout.rightX ?? geo.rightX0, geo.adW, geo.rightX0)
    const left = sideVars(leftX, geo.adW, geo.outerL)
    const right = sideVars(rightX, geo.adW, geo.outerR)
    const root = document.documentElement
    root.style.setProperty('--calc-ad-w', `${geo.adW}px`)
    root.style.setProperty('--calc-outer-left', `${left.outer}px`)
    root.style.setProperty('--calc-inner-left', `${left.inner}px`)
    root.style.setProperty('--calc-outer-right', `${right.outer}px`)
    root.style.setProperty('--calc-inner-right', `${right.inner}px`)
    root.dataset.calcResize = 'custom'
  }, [hasGaps, layout.leftX, layout.rightX, geoVersion, clearRoot])

  // 언마운트 시 정리
  useEffect(() => clearRoot, [clearRoot])

  // 저장 토글 연동
  useEffect(() => {
    try {
      if (persist) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
      else window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* 무시 */
    }
  }, [persist, layout])

  const applyDrag = useCallback((handle: GridResizeHandle, clientX: number) => {
    const geo = geometryRef.current
    if (!geo) return
    const W = viewportWidth()

    setLayout((prev) => {
      const leftX = prev.leftX ?? geo.leftX0
      const rightX = prev.rightX ?? geo.rightX0

      if (handle === 'left') {
        return { ...prev, leftX: clamp(clientX, geo.adW, geo.leftX0), rightX }
      }
      if (handle === 'right') {
        return { ...prev, leftX, rightX: clamp(W - clientX, geo.adW, geo.rightX0) }
      }
      // center: split만 변경 (가운데만 움직이면 풀확장 트리거 안 함)
      const mid = W - leftX - rightX
      if (mid <= 0) return prev
      const minSplit = clamp(240 / mid, 0.1, 0.5)
      const split = clamp((clientX - leftX) / mid, minSplit, 1 - minSplit)
      return { ...prev, split }
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
    geometryRef.current = null
    setLayout({ leftX: null, rightX: null, split: 0.5 })
  }, [])

  // 뷰포트 리사이즈 시 기본으로 복귀(기하 무효화) — 드물고, 어긋남 방지
  useEffect(() => {
    const onResize = () => {
      if (hasCustomGaps(layout) || layout.split !== 0.5) reset()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [layout, reset])

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
      className: `calc-grid__resizer calc-grid__resizer--${handle}${
        activeHandle === handle ? ' calc-grid__resizer--active' : ''
      }`,
      onPointerDown: startDrag(handle),
    }),
    [activeHandle, startDrag],
  )

  return { containerRef, gridStyle, getHandleProps, isCustom, reset, refreshGeometry }
}
