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
  const { layoutMode } = useLayout()
  const clipRef = useRef<HTMLSpanElement>(null)
  const overflowing = useOverflowEllipsis(clipRef, layoutMode === 'manual', [children])

  if (layoutMode === 'manual') {
    const resolvedTitle =
      title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined)

    return (
      <span
        className={`fit-text fit-text--ellipsis${overflowing ? ' is-overflowing' : ''}${className ? ` ${className}` : ''}`}
        title={resolvedTitle}
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

  return (
    <span
      className={`fit-text fit-text--auto${className ? ` ${className}` : ''}`}
      title={title}
    >
      <span className="fit-text__inner">{children}</span>
    </span>
  )
}
