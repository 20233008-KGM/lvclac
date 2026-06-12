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
  const textRef = useRef<HTMLSpanElement>(null)
  const overflowing = useOverflowEllipsis(textRef, true, [children, layoutMode, fitScale])

  const resolvedTitle =
    title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined)

  return (
    <span
      ref={textRef}
      className={`fit-text fit-text--ellipsis${overflowing ? ' is-overflowing' : ''}${className ? ` ${className}` : ''}`}
      title={overflowing ? resolvedTitle : title}
    >
      {children}
    </span>
  )
}
