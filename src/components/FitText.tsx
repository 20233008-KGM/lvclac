import { useRef, type ReactNode } from 'react'
import { useLayout } from '../context/LayoutContext'
import { useOverflowEllipsis } from '../hooks/useOverflowEllipsis'

export function FitTextGroup({ children }: { children: ReactNode }) {
  return <>{children}</>
}

interface FitTextProps {
  children: ReactNode
  className?: string
  title?: string
}

export function FitText({ children, className, title }: FitTextProps) {
  const { layoutMode, fitScale } = useLayout()
  const clipRef = useRef<HTMLSpanElement>(null)
  const overflowing = useOverflowEllipsis(clipRef, true, [children, layoutMode, fitScale])

  const resolvedTitle =
    title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined)

  return (
    <span
      className={`fit-text fit-text--ellipsis${overflowing ? ' is-overflowing' : ''}${className ? ` ${className}` : ''}`}
      title={overflowing ? resolvedTitle : title}
    >
      <span ref={clipRef} className="fit-text__clip">
        {children}
      </span>
      {overflowing && (
        <span className="fit-text__indicator" aria-hidden="true">
          …
        </span>
      )}
    </span>
  )
}
