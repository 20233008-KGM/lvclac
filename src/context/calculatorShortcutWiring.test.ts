import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('calculator undo/redo shortcut wiring', () => {
  it('exposes undo and redo controls from the calculator context', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('undoInputs: () => void')
    expect(text).toContain('redoInputs: () => void')
    expect(text).toContain('canUndo: boolean')
    expect(text).toContain('canRedo: boolean')
    expect(text).toContain('undoHistory: CalculatorHistoryMove[]')
    expect(text).toContain('redoHistory: CalculatorHistoryMove[]')
    expect(text).toContain("jumpHistory: (direction: CalculatorHistoryDirection, steps: number) => void")
    expect(text).toContain('undoCalculatorHistory')
    expect(text).toContain('redoCalculatorHistory')
    expect(text).toContain('getCalculatorHistoryMoves')
    expect(text).toContain('jumpCalculatorHistory')
    expect(text).toContain('options?.historyOnly')
  })

  it('handles Ctrl+Z and Ctrl+Shift+Z once at the calculator app level', () => {
    const text = source('src/App.tsx')

    expect(text).toContain('undoInputs')
    expect(text).toContain('redoInputs')
    expect(text).toContain('e.shiftKey')
    expect(text).toContain('redoInputs()')
    expect(text).toContain('undoInputs()')
    expect(text).toContain('isTextEditingTarget(e.target)')
  })

  it('wires a header history menu with hover, focus, and context-menu access', () => {
    const app = source('src/App.tsx')
    const text = source('src/components/CalculatorHistoryMenu.tsx')

    expect(app).toContain("import { CalculatorHistoryMenu } from './components/CalculatorHistoryMenu'")
    expect(app).toContain('<CalculatorHistoryMenu')
    expect(text).toContain('export function CalculatorHistoryMenu')
    expect(text).toContain('undoHistory')
    expect(text).toContain('redoHistory')
    expect(text).toContain('jumpHistory')
    expect(text).toContain('onMouseEnter')
    expect(text).toContain('onMouseLeave')
    expect(text).toContain('onFocus')
    expect(text).toContain('onBlur')
    expect(text).toContain('onContextMenu')
    expect(text).toContain('onClick={handleButtonClick}')
    expect(text).toContain('calculator-history-menu')
    expect(text).toContain('calculator-history-btn')
  })

  it('removes component-local z shortcut listeners that block Shift+Z', () => {
    const inputPanel = source('src/components/InputPanel.tsx')
    const resultPanel = source('src/components/ResultPanel.tsx')

    expect(inputPanel).not.toContain("e.key !== 'z' || e.shiftKey")
    expect(resultPanel).not.toContain("e.key !== 'z' || e.shiftKey")
    expect(inputPanel).not.toContain("onChange({ undoMarkPrice: true })\n    }")
    expect(resultPanel).not.toContain("onChange({ undoOrderApply: true })\n    }")
  })
})
