import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/CalculatorHistoryMenu.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')

describe('calculator history menu', () => {
  it('describes each move from its adjacent committed before and after states', () => {
    expect(source).toContain('visibleHistoryDiffs(move.before, move.after, messages)')
    expect(source).not.toContain('currentInputs')
  })

  it('renders compact two-line rows with aligned final values', () => {
    expect(source).toContain('calculator-history-menu__item-head')
    expect(source).toContain('calculator-history-menu__item-label')
    expect(source).toContain('calculator-history-menu__item-value')
    expect(source).toContain('calculator-history-menu__item-detail')
    expect(css).toContain('font-variant-numeric: tabular-nums')
    expect(css).toContain('width: min(22rem, calc(100vw - 16px))')
  })

  it('keeps hover and focus access while adding touch-friendly button access', () => {
    expect(source).toContain('onMouseEnter')
    expect(source).toContain('onMouseLeave')
    expect(source).toContain('onFocus')
    expect(source).toContain('onBlur')
    expect(source).toContain('onClick={handleButtonClick}')
    expect(source).toContain("window.matchMedia?.('(hover: hover)').matches")
  })

  it('exposes full truncated descriptions through title and aria-label', () => {
    expect(source).toContain('title={fullDescription}')
    expect(source).toContain('aria-label={fullDescription}')
  })
})
