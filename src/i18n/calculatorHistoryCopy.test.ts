import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('calculator history copy', () => {
  it('provides Korean labels for the undo and redo history menu', () => {
    expect(ko.calculatorHistory.buttonLabel).toBe('실행 기록')
    expect(ko.calculatorHistory.undoSection).toBe('실행 취소')
    expect(ko.calculatorHistory.redoSection).toBe('다시 실행')
    expect(ko.calculatorHistory.empty).toContain('기록이 없습니다')
    expect(ko.calculatorHistory.changedValues).toContain('{count}')
    expect(ko.calculatorHistory.diff.markUpdate).toBe('현재가 갱신')
    expect(ko.calculatorHistory.diff.accountEval).toContain('{before}')
    expect(ko.calculatorHistory.diff.currentPrice).toContain('{after}')
  })

  it('provides English labels for the undo and redo history menu', () => {
    expect(en.calculatorHistory.buttonLabel).toBe('Undo/redo history')
    expect(en.calculatorHistory.undoSection).toBe('Undo')
    expect(en.calculatorHistory.redoSection).toBe('Redo')
    expect(en.calculatorHistory.empty).toContain('No history')
    expect(en.calculatorHistory.changedValues).toContain('{count}')
    expect(en.calculatorHistory.diff.markUpdate).toBe('Mark updated')
    expect(en.calculatorHistory.diff.contracts).toContain('{after}')
    expect(en.calculatorHistory.diff.multiple).toContain('{count}')
  })
})
