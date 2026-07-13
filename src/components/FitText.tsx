import { useEffect, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import { useLayout } from '../context/LayoutContext'
import { useOverflowEllipsis } from '../hooks/useOverflowEllipsis'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'

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
  const { anchorRef, open, anchorHandlers, show, hide, renderTooltip } = useFloatingTooltip({
    placement: 'top',
    horizontalAlign: 'center',
  })
  const textRef = anchorRef as RefObject<HTMLSpanElement | null>
  const overflowing = useOverflowEllipsis(textRef, true, [children, layoutMode, fitScale])

  const resolvedTitle =
    title ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined)

  // 잘려서 값을 못 볼 때, 탭/클릭으로 전체 숫자를 팝오버로 보여준다.
  // 모바일은 hover(=title 툴팁)가 없어서 잘린 숫자를 볼 방법이 없기 때문.
  const canReveal = overflowing && resolvedTitle != null

  useEffect(() => {
    if (!canReveal || !open) return

    function handlePointerDown(event: PointerEvent) {
      const anchor = anchorRef.current
      if (anchor && event.target instanceof Node && anchor.contains(event.target)) return
      hide()
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') hide()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [canReveal, open, hide, anchorRef])

  function toggle() {
    if (open) hide()
    else show()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <span
      ref={anchorRef}
      className={`fit-text fit-text--ellipsis${overflowing ? ' is-overflowing' : ''}${canReveal ? ' fit-text--revealable' : ''}${className ? ` ${className}` : ''}`}
      title={canReveal ? undefined : title}
      {...(canReveal ? anchorHandlers : {})}
      role={canReveal ? 'button' : undefined}
      tabIndex={canReveal ? 0 : undefined}
      aria-label={canReveal ? resolvedTitle : undefined}
      onClick={canReveal ? toggle : undefined}
      onKeyDown={canReveal ? handleKeyDown : undefined}
    >
      {children}
      {canReveal && renderTooltip('fit-text-reveal-tooltip', resolvedTitle)}
    </span>
  )
}
