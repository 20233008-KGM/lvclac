import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('public local draft UI', () => {
  it('offers exactly one browser-local save slot', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('draft-save-slot--local')
    expect(text).toContain('usePublicCalculator')
    expect(text).not.toContain('draft-save-slot--cloud')
    expect(text).not.toContain('numberSet')
    expect(text).not.toContain('Auth')
    expect(text).not.toContain('billing')
  })

  it('pauses autosave without deleting the stored draft', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const context = source('src/context/PublicCalculatorContext.tsx')

    expect(text).toContain('pauseSaving()')
    expect(context).toContain("localStorage.setItem(SAVE_ENABLED_KEY, '0')")
    expect(context).toContain('function readInitialSaveEnabled')
    expect(context).not.toMatch(/function pauseSaving[\s\S]*clearDraft\(\)/)
  })

  it('uses a separate confirmation action to delete browser data', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('setDeleteConfirmOpen(true)')
    expect(text).toContain('deleteSavedData()')
    expect(text).toContain('createPortal(modal, document.body)')
  })

  it('migrates the active legacy local number set into the public draft key once', () => {
    const context = source('src/context/PublicCalculatorContext.tsx')

    expect(context).toContain("const DRAFT_KEY = 'leverage_calculator_draft'")
    expect(context).toContain("const PUBLIC_DRAFT_MIGRATED_KEY = 'leverage_public_draft_migrated_v1'")
    expect(context).toContain('loadLocalNumberSets(localStorage, legacyDraft, legacySavedAt)')
    expect(context).toContain('resolveActiveLocalNumberSetId(localStorage, sets)')
    expect(context).toContain("localStorage.setItem(PUBLIC_DRAFT_MIGRATED_KEY, '1')")
  })

  it('shows a compact saved-at timestamp and a fixed checkmark slot', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const css = source('src/App.css')

    expect(text).toContain('formatSavedAtCompact(localDraftSavedAt)')
    expect(text).toContain('className="draft-save-status__check"')
    expect(css).toContain('.draft-save-status__check')
    expect(css).toContain('width: 0.85em;')
  })
})
