import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface FitTextGroupValue {
  report: (id: string, scale: number) => void
  unregister: (id: string) => void
  scale: number
}

const FitTextGroupContext = createContext<FitTextGroupValue | null>(null)

/**
 * 묶인 자식 FitText들이 "공통 축소율"(가장 많이 줄여야 하는 값 기준)을 함께 적용하도록 한다.
 * → 안 넘치면 전부 100%(균일), 넘치면 다 같이 줄어 항상 같은 글자 크기를 유지.
 */
export function FitTextGroup({ children }: { children: ReactNode }) {
  const [scales, setScales] = useState<Map<string, number>>(() => new Map())

  const report = useCallback((id: string, scale: number) => {
    setScales((prev) => {
      if (prev.get(id) === scale) return prev
      const next = new Map(prev)
      next.set(id, scale)
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setScales((prev) => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const groupScale = useMemo(() => {
    let min = 1
    for (const s of scales.values()) min = Math.min(min, s)
    return min
  }, [scales])

  const value = useMemo<FitTextGroupValue>(
    () => ({ report, unregister, scale: groupScale }),
    [report, unregister, groupScale],
  )

  return <FitTextGroupContext.Provider value={value}>{children}</FitTextGroupContext.Provider>
}

interface FitTextProps {
  children: ReactNode
  /** 폰트 최소 축소 배율 (기본 0.5 = 절반까지) */
  min?: number
  className?: string
}

/**
 * 자식 텍스트를 항상 한 줄로 유지하면서, 담긴 영역보다 넓어지면 폰트 크기를 비례 축소한다.
 * FitTextGroup 안에 있으면 그룹 공통 축소율을, 아니면 자기 축소율을 적용한다.
 */
export function FitText({ children, min = 0.5, className }: FitTextProps) {
  const outerRef = useRef<HTMLSpanElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const id = useId()
  const group = useContext(FitTextGroupContext)
  const report = group?.report
  const unregister = group?.unregister
  const [localScale, setLocalScale] = useState(1)

  // 자연 너비 기준 필요한 축소율 측정 → 그룹에 보고(그룹 없으면 로컬 적용)
  useLayoutEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return

    const measure = () => {
      inner.style.fontSize = '1em'
      const available = outer.clientWidth
      const needed = inner.scrollWidth
      if (available === 0 || needed === 0) return
      const ratio = available / needed
      const scale = Math.max(min, Math.min(1, ratio))
      if (report) report(id, scale)
      else setLocalScale(scale)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(outer)
    return () => {
      ro.disconnect()
      if (unregister) unregister(id)
    }
  }, [children, min, id, report, unregister])

  const appliedScale = group ? group.scale : localScale

  useLayoutEffect(() => {
    const inner = innerRef.current
    if (inner) inner.style.fontSize = `${appliedScale}em`
  }, [appliedScale])

  return (
    <span ref={outerRef} className={`fit-text${className ? ` ${className}` : ''}`}>
      <span ref={innerRef} className="fit-text__inner">
        {children}
      </span>
    </span>
  )
}
