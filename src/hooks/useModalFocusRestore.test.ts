import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// useModalFocusRestore reads/writes document.activeElement and calls .focus() from a
// useLayoutEffect cleanup — this project's Vitest environment has no DOM (no jsdom/
// @testing-library/react installed), so there's no renderHook harness available to
// mount the hook and simulate mount/unmount. Structural/behavioral guarantees are
// verified via source inspection instead, matching the existing convention for
// document.body-portal modals (see overlayPortalLayout.test.ts, authDialogLayout.test.ts,
// SnapshotSavedModal.test.ts).
const source = readFileSync(resolve('src/hooks/useModalFocusRestore.ts'), 'utf8')

describe('useModalFocusRestore', () => {
  it('prefers an explicit restore target ref when provided', () => {
    expect(source).toMatch(
      /explicitTargetRef !== undefined\s*\?\s*explicitTargetRef\.current/,
    )
  })

  it('falls back to capturing document.activeElement when no ref is provided', () => {
    expect(source).toContain('document.activeElement instanceof HTMLElement')
    expect(source).toContain('? document.activeElement')
    expect(source).toContain(': null')
  })

  it('restores focus on cleanup (modal close/unmount)', () => {
    expect(source).toMatch(/return \(\) => \{\s*targetRef\.current\?\.focus\(\)/)
  })

  it('calls focus() null-safely via optional chaining', () => {
    expect(source).toContain('targetRef.current?.focus()')
  })

  it('captures once at mount, not on every explicitTargetRef change', () => {
    expect(source).toMatch(/\},\s*\[\]\)/)
  })
})
