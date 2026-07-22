import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/NumberSetDeleteConfirmModal.tsx'), 'utf8')
const styles = readFileSync(resolve('src/styles/pages.css'), 'utf8')

describe('NumberSetDeleteConfirmModal', () => {
  it('is an accessible modal and restores focus to the trigger', () => {
    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-modal="true"')
    expect(source).toContain('aria-labelledby="number-set-delete-title"')
    expect(source).toContain('aria-describedby="number-set-delete-body number-set-delete-warning"')
    expect(source).toContain('useModalFocusRestore()')
  })

  it('shows record counts only for a successfully loaded cloud summary', () => {
    expect(source).toContain("mode === 'cloud' && summaryState.status === 'loading'")
    expect(source).toContain("mode === 'cloud' && summaryState.status === 'error'")
    expect(source).toContain('cloudReady &&')
    expect(source).toContain('cloudReady.orderHistoryCount')
    expect(source).toContain('cloudReady.accountSnapshotCount')
    expect(source).toContain('cloudReady.memoCount')
    expect(source).toContain("mode === 'cloud' ? copy.cloudBody : copy.localBody")
  })

  it('blocks confirmation until cloud counts load and offers retry on failure', () => {
    expect(source).toContain("mode === 'cloud' && !cloudReady")
    expect(source).toContain('disabled={confirmDisabled}')
    expect(source).toContain('onClick={onRetry}')
    expect(source).toContain('role="alert"')
  })

  it('prevents dismiss while deleting and prevents duplicate confirmation', () => {
    expect(source).toMatch(/if \(!busy\) onClose\(\)/)
    expect(source).toMatch(/if \(!busy && event\.target === event\.currentTarget\) onClose\(\)/)
    expect(source).toContain('const confirmDisabled = busy')
    expect(source).toContain('disabled={busy} onClick={onClose}')
  })

  it('traps keyboard focus and supports Escape', () => {
    expect(source).toContain("event.key === 'Escape'")
    expect(source).toContain("event.key !== 'Tab'")
    expect(source).toContain('activeDialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)')
  })

  it('uses a stacked action layout on narrow screens', () => {
    expect(styles).toMatch(/@media \(max-width: 480px\)[\s\S]*\.number-set-delete-modal \.bulk-delete-confirm-actions/)
    expect(styles).toContain('flex-direction: column-reverse')
  })
})
