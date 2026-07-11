import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface RecordsContextMenuItem {
  key: string
  label: string
  danger?: boolean
  onSelect: () => void
}

/**
 * 장부 카드에서 우클릭 시 뜨는 컨텍스트 메뉴. 카드 컨테이너의 overflow:hidden에
 * 잘리지 않도록 document.body 포털로 띄우고, 커서 위치(fixed)에서 화면 밖으로
 * 넘치면 안쪽으로 클램프한다. 바깥 클릭·Esc·스크롤·리사이즈 시 닫힌다.
 */
export function RecordsContextMenu({
  x,
  y,
  items,
  ariaLabel,
  onClose,
}: {
  x: number
  y: number
  items: RecordsContextMenuItem[]
  ariaLabel: string
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const margin = 8
    let left = x
    let top = y
    if (left + width + margin > window.innerWidth) {
      left = Math.max(margin, window.innerWidth - width - margin)
    }
    if (top + height + margin > window.innerHeight) {
      top = Math.max(margin, window.innerHeight - height - margin)
    }
    setPosition({ left, top })
  }, [x, y])

  useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')
    first?.focus()
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose()
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const el = menuRef.current
        if (!el) return
        const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
        if (buttons.length === 0) return
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const delta = event.key === 'ArrowDown' ? 1 : -1
        const next = (current + delta + buttons.length) % buttons.length
        buttons[next]?.focus()
      }
    }
    window.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('contextmenu', handlePointerDown, true)
    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('contextmenu', handlePointerDown, true)
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  const menu = (
    <div
      ref={menuRef}
      className="records-context-menu"
      role="menu"
      aria-label={ariaLabel}
      style={{ left: position.left, top: position.top }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="menuitem"
          className={`records-context-menu-item${item.danger ? ' records-context-menu-item--danger' : ''}`}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )

  return createPortal(menu, document.body)
}
