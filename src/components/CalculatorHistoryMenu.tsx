import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from 'react'
import type { CalculatorHistoryMove } from '../context/calculatorHistory'
import type { Messages } from '../i18n/types'
import {
  describeCalculatorHistoryMove,
  type CalculatorHistoryDescription,
} from './calculatorHistoryDescription'

interface CalculatorHistoryMenuProps {
  messages: Messages
  undoHistory: CalculatorHistoryMove[]
  redoHistory: CalculatorHistoryMove[]
  jumpHistory: (direction: CalculatorHistoryMove['direction'], steps: number) => void
}

function HistoryIcon() {
  return (
    <svg
      className="calculator-history-btn__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function isFocusLeavingHistory(root: HTMLElement, event: FocusEvent<HTMLElement>) {
  const next = event.relatedTarget
  return !(next instanceof Node && root.contains(next))
}

function supportsHover(): boolean {
  return window.matchMedia?.('(hover: hover)').matches ?? false
}

export function CalculatorHistoryMenu({
  messages,
  undoHistory,
  redoHistory,
  jumpHistory,
}: CalculatorHistoryMenuProps) {
  const copy = messages.calculatorHistory
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const describeMoves = (moves: CalculatorHistoryMove[]) =>
    moves.flatMap((move) => {
      const description = describeCalculatorHistoryMove(move, messages)
      return description ? [{ move, description }] : []
    })
  const undoItems = describeMoves(undoHistory)
  const redoItems = describeMoves(redoHistory)
  const hasHistory = undoItems.length > 0 || redoItems.length > 0

  useEffect(() => {
    if (!menuOpen) return

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function handleButtonClick() {
    if (supportsHover()) {
      setMenuOpen(true)
      return
    }
    setMenuOpen((open) => !open)
  }

  function renderMoves(
    sectionLabel: string,
    items: { move: CalculatorHistoryMove; description: CalculatorHistoryDescription }[],
  ) {
    if (items.length === 0) return null
    return (
      <div className="calculator-history-menu__section">
        <div className="calculator-history-menu__section-title">{sectionLabel}</div>
        {items.map(({ move, description }) => (
            <button
              key={`${move.direction}-${move.steps}`}
              type="button"
              role="menuitem"
              className={`calculator-history-menu__item calculator-history-menu__item--${description.kind}`}
              title={description.fullDescription}
              aria-label={description.fullDescription}
              onClick={() => {
                jumpHistory(move.direction, move.steps)
                setMenuOpen(false)
              }}
            >
              {description.kind === 'fields' ? (
                description.diffs.map((diff) => (
                  <span className="calculator-history-menu__change" key={diff.key}>
                    <span className="calculator-history-menu__item-label">{diff.label}</span>
                    <span className="calculator-history-menu__item-detail">
                      {diff.before} → {diff.after}
                    </span>
                  </span>
                ))
              ) : (
                <span className="calculator-history-menu__item-summary">
                  {description.summary}
                </span>
              )}
            </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="calculator-history"
      ref={rootRef}
      onMouseEnter={() => {
        if (supportsHover()) setMenuOpen(true)
      }}
      onMouseLeave={() => {
        if (supportsHover()) setMenuOpen(false)
      }}
      onFocus={() => setMenuOpen(true)}
      onBlur={(event) => {
        if (isFocusLeavingHistory(event.currentTarget, event)) setMenuOpen(false)
      }}
    >
      <button
        type="button"
        className={`calculator-history-btn${menuOpen ? ' calculator-history-btn--active' : ''}`}
        aria-label={copy.buttonLabel}
        title={copy.buttonLabel}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={handleButtonClick}
        onContextMenu={(event) => {
          event.preventDefault()
          setMenuOpen(true)
        }}
      >
        <HistoryIcon />
      </button>
      {menuOpen && (
        <div className="calculator-history-menu" role="menu" aria-label={copy.menuTitle}>
          <div className="calculator-history-menu__title">{copy.menuTitle}</div>
          {hasHistory ? (
            <>
              {renderMoves(copy.undoSection, undoItems)}
              {renderMoves(copy.redoSection, redoItems)}
            </>
          ) : (
            <p className="calculator-history-menu__empty">{copy.empty}</p>
          )}
        </div>
      )}
    </div>
  )
}
