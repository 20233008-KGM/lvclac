import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('calculator focus-complete history wiring', () => {
  it('marks number-input blur and Enter commits explicitly', () => {
    const input = source('src/components/NumberInput.tsx')

    expect(input).toContain('historyCommit?: boolean')
    expect(input).toContain('currentChangeMeta(true)')
    expect(input).toContain('handler(normalized, currentChangeMeta(true))')
  })

  it('settles adjacent stepper clicks, holds, and scrubs into one history group', () => {
    const stepper = source('src/components/NumberStepper.tsx')

    expect(stepper).toContain('commitGestureHistoryGroup')
    expect(stepper).toContain('historyCommit: true')
    expect(stepper).toContain('historyOnly: true')
    expect(stepper).toContain('HISTORY_GESTURE_SETTLE_MS = 300')
    expect(stepper).toContain('scheduleGestureHistoryCommit()')
    expect(stepper).toContain('onPointerUp: stopStepGesture')
    expect(stepper).toContain('onPointerUp: endPointerSession')
  })

  it('keeps mobile steppers keyboard-free and cancels pending pointer sessions safely', () => {
    const stepper = source('src/components/NumberStepper.tsx')
    const input = source('src/components/NumberInput.tsx')

    expect(stepper).toContain('shouldFocusInputForPointer(e.pointerType)')
    expect(stepper).toContain('inputWasFocusedAtGestureStartRef')
    expect(stepper).toContain('inputHandleRef.current?.adoptStepperValue(next)')
    expect(stepper).toContain('onPointerCancel: cancelPointerSession')
    expect(stepper).toContain('onLostPointerCapture: cancelPointerSession')
    expect(input).toContain('isFocused: () => document.activeElement === inputElRef.current')
    expect(input).toContain('adoptStepperValue: (next) =>')
  })

  it('keeps autosave driven by global inputs instead of DOM blur', () => {
    const context = source('src/context/CalculatorContext.tsx')

    expect(context).toContain('void persistInputs(inputs)')
    expect(context).toContain(
      '[inputs, persistInputs, saveEnabled, sessionLoading]',
    )
  })

  it('forwards history commit metadata through both calculator panels', () => {
    for (const path of ['src/components/InputPanel.tsx', 'src/components/ResultPanel.tsx']) {
      const panel = source(path)
      expect(panel).toContain('historyCommit: meta.historyCommit')
      expect(panel).toContain('historyOnly: meta.historyOnly')
    }
  })

  it('keeps order preview edits transient and cancels both Escape paths cleanly', () => {
    const panel = source('src/components/ResultPanel.tsx')

    expect(panel.match(/orderInputHistoryOptions\(meta\)/g)).toHaveLength(3)
    expect(panel).toContain("{ historyTransient: 'begin' }")
    expect(panel).toContain('{ historyBefore: beforeInputs }')
    expect(panel.match(/historyTransient: 'cancel'/g)).toHaveLength(2)
  })
})
