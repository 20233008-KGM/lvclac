import { useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'

type Target = { left: number; top: number; width: number; height: number }

/** Keep the teaching calculator inert; expose help only over visible input boxes. */
export function ExampleInputPreview({ children, label, onHelp }: {
  children: ReactNode
  label: string
  onHelp: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const [targets, setTargets] = useState<Target[]>([])

  useLayoutEffect(() => {
    const container = root.current!
    const inputs = Array.from(container.querySelectorAll('input:not([type="hidden"])'))
    const measure = () => {
      const bounds = container.getBoundingClientRect()
      setTargets(inputs.map(input => {
        const box = input.getBoundingClientRect()
        return { left: box.left - bounds.left, top: box.top - bounds.top, width: box.width, height: box.height }
      }).filter(box => box.width > 0 && box.height > 0))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    inputs.forEach(input => observer.observe(input))
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [children])

  return <div ref={root} className="calc-example__interactive-preview">
    {children}
    {targets.map((target, index) => <button key={index} type="button"
      className="calc-example__help-trigger" style={target}
      aria-label={`${label} · ${index + 1}`} aria-haspopup="dialog"
      onClick={onHelp} />)}
  </div>
}
