import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
} from 'react'
import type { CalculatorHistoryMove } from '../context/calculatorHistory'
import type { Messages } from '../i18n/types'
import type { CalculatorInputs, MarginInputMode, TotalMarginKind } from '../types'
import { formatNumber } from '../utils/format'
import { formatRateForInput } from '../utils/inputFormat'

interface CalculatorHistoryMenuProps {
  messages: Messages
  undoHistory: CalculatorHistoryMove[]
  redoHistory: CalculatorHistoryMove[]
  jumpHistory: (direction: CalculatorHistoryMove['direction'], steps: number) => void
}

interface VisibleHistoryDiff {
  key: string
  label: string
  before: string
  after: string
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

function replaceHistoryTokens(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  )
}

function formatNumericValue(value: number | undefined): string {
  return value == null ? '-' : formatNumber(value)
}

function formatRateValue(value: number | undefined): string {
  return value == null ? '-' : formatRateForInput(value)
}

function formatMarginMode(value: MarginInputMode | undefined, messages: Messages): string {
  if (value === 'perContract') return messages.marginMode.perContract
  if (value === 'total') return messages.marginMode.total
  return messages.marginMode.rate
}

function formatTotalMarginKind(value: TotalMarginKind | undefined, messages: Messages): string {
  if (value === 'fixed') return messages.marginKindAsk.fixed
  if (value === 'proportional') return messages.marginKindAsk.proportional
  return '-'
}

function visibleHistoryDiffs(
  before: CalculatorInputs,
  after: CalculatorInputs,
  messages: Messages,
): VisibleHistoryDiff[] {
  const entries: Array<{
    key: string
    label: string
    before: string
    after: string
  }> = [
    {
      key: 'mode',
      label: messages.modeLabel,
      before: messages.modes[before.mode],
      after: messages.modes[after.mode],
    },
    {
      key: 'positionSide',
      label: messages.position,
      before: before.positionSide === 'long' ? messages.long : messages.short,
      after: after.positionSide === 'long' ? messages.long : messages.short,
    },
    {
      key: 'marginInputMode',
      label: messages.marginMode.label,
      before: formatMarginMode(before.marginInputMode, messages),
      after: formatMarginMode(after.marginInputMode, messages),
    },
    {
      key: 'totalMarginKind',
      label: messages.marginKindAsk.question,
      before: formatTotalMarginKind(before.totalMarginKind, messages),
      after: formatTotalMarginKind(after.totalMarginKind, messages),
    },
    {
      key: 'accountEval',
      label: messages.fields.accountEquity.label,
      before: formatNumericValue(before.accountEval),
      after: formatNumericValue(after.accountEval),
    },
    {
      key: 'maintenanceMarginRate',
      label: messages.fields.maintenanceMarginRate.label,
      before: formatRateValue(before.maintenanceMarginRate),
      after: formatRateValue(after.maintenanceMarginRate),
    },
    {
      key: 'maintenanceMargin',
      label: messages.fields.maintenanceMargin.label,
      before: formatNumericValue(before.maintenanceMargin),
      after: formatNumericValue(after.maintenanceMargin),
    },
    {
      key: 'maintenanceMarginPerContract',
      label: messages.fields.maintenanceMarginPerContract.label,
      before: formatNumericValue(before.maintenanceMarginPerContract),
      after: formatNumericValue(after.maintenanceMarginPerContract),
    },
    {
      key: 'entrustedMarginRate',
      label: messages.fields.entrustedMarginRate.label,
      before: formatRateValue(before.entrustedMarginRate),
      after: formatRateValue(after.entrustedMarginRate),
    },
    {
      key: 'entrustedMargin',
      label: messages.fields.entrustedMargin.label,
      before: formatNumericValue(before.entrustedMargin),
      after: formatNumericValue(after.entrustedMargin),
    },
    {
      key: 'entrustedMarginPerContract',
      label: messages.fields.entrustedMarginPerContract.label,
      before: formatNumericValue(before.entrustedMarginPerContract),
      after: formatNumericValue(after.entrustedMarginPerContract),
    },
    {
      key: 'contracts',
      label: messages.fields.contracts.label,
      before: formatNumericValue(before.contracts),
      after: formatNumericValue(after.contracts),
    },
    {
      key: 'contractAmount',
      label: messages.fields.contractAmount.label,
      before: formatNumericValue(before.contractAmount),
      after: formatNumericValue(after.contractAmount),
    },
    {
      key: 'currentPrice',
      label: messages.fields.currentPrice.label,
      before: formatNumericValue(before.currentPrice),
      after: formatNumericValue(after.currentPrice),
    },
    {
      key: 'contractMultiplier',
      label: messages.fields.contractMultiplier.label,
      before: formatNumericValue(before.contractMultiplier),
      after: formatNumericValue(after.contractMultiplier),
    },
    {
      key: 'tickSize',
      label: messages.fields.tickSize.label,
      before: formatNumericValue(before.tickSize),
      after: formatNumericValue(after.tickSize),
    },
    {
      key: 'orderContracts',
      label: messages.fields.orderContracts.label,
      before: formatNumericValue(before.orderContracts),
      after: formatNumericValue(after.orderContracts),
    },
    {
      key: 'orderPrice',
      label: messages.fields.orderPrice.label,
      before: formatNumericValue(before.orderPrice),
      after: formatNumericValue(after.orderPrice),
    },
  ]

  return entries.filter((entry) => entry.before !== entry.after)
}

function historyActionLabel(
  before: CalculatorInputs,
  after: CalculatorInputs,
  messages: Messages,
): string | null {
  const copy = messages.calculatorHistory.diff
  if (!before.orderScenarioRevertSnapshot && after.orderScenarioRevertSnapshot) {
    return copy.orderPreview
  }
  if (before.orderScenarioRevertSnapshot && !after.orderScenarioRevertSnapshot) {
    return copy.orderApply
  }
  if (!before.scenarioRevertSnapshot && after.scenarioRevertSnapshot) {
    return copy.scenarioPreview
  }
  if (before.scenarioRevertSnapshot && !after.scenarioRevertSnapshot) {
    return copy.scenarioApply
  }
  return null
}

function describeHistoryMove(move: CalculatorHistoryMove, messages: Messages) {
  const copy = messages.calculatorHistory
  const diffs = visibleHistoryDiffs(move.before, move.after, messages)
  const actionLabel = historyActionLabel(move.before, move.after, messages)

  if (actionLabel) {
    const value = diffs.length > 0
      ? replaceHistoryTokens(copy.changedValues, { count: diffs.length })
      : ''
    const detail = diffs.length === 1
      ? `${diffs[0].before} → ${diffs[0].after}`
      : diffs.map((diff) => diff.label).join(' · ')
    return { label: actionLabel, value, detail }
  }

  if (diffs.length === 1) {
    const [diff] = diffs
    return {
      label: diff.label,
      value: diff.after,
      detail: `${diff.before} → ${diff.after}`,
    }
  }

  if (diffs.length > 1) {
    return {
      label: replaceHistoryTokens(copy.diff.multiple, { count: diffs.length }),
      value: '',
      detail: diffs.map((diff) => diff.label).join(' · '),
    }
  }

  return {
    label: copy.diff.generic,
    value: '',
    detail: '',
  }
}

function isFocusLeavingHistory(root: HTMLElement, event: FocusEvent<HTMLElement>) {
  const next = event.relatedTarget
  return !(next instanceof Node && root.contains(next))
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
  const hasHistory = undoHistory.length > 0 || redoHistory.length > 0

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
    if (window.matchMedia?.('(hover: hover)').matches) {
      setMenuOpen(true)
      return
    }
    setMenuOpen((open) => !open)
  }

  function renderMoves(sectionLabel: string, moves: CalculatorHistoryMove[]) {
    if (moves.length === 0) return null
    return (
      <div className="calculator-history-menu__section">
        <div className="calculator-history-menu__section-title">{sectionLabel}</div>
        {moves.map((move) => {
          const description = describeHistoryMove(move, messages)
          const fullDescription = [
            description.label,
            description.value,
            description.detail,
          ].filter(Boolean).join(' · ')

          return (
            <button
              key={`${move.direction}-${move.steps}`}
              type="button"
              role="menuitem"
              className="calculator-history-menu__item"
              title={fullDescription}
              aria-label={fullDescription}
              onClick={() => {
                jumpHistory(move.direction, move.steps)
                setMenuOpen(false)
              }}
            >
              <span className="calculator-history-menu__item-head">
                <span className="calculator-history-menu__item-label">
                  {description.label}
                </span>
                {description.value && (
                  <span className="calculator-history-menu__item-value">
                    {description.value}
                  </span>
                )}
              </span>
              {description.detail && (
                <span className="calculator-history-menu__item-detail">
                  {description.detail}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="calculator-history"
      ref={rootRef}
      onMouseEnter={() => setMenuOpen(true)}
      onMouseLeave={() => setMenuOpen(false)}
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
              {renderMoves(copy.undoSection, undoHistory)}
              {renderMoves(copy.redoSection, redoHistory)}
            </>
          ) : (
            <p className="calculator-history-menu__empty">{copy.empty}</p>
          )}
        </div>
      )}
    </div>
  )
}
