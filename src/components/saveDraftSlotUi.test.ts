import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('public local draft UI', () => {
  it('offers exactly off and browser-local save slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text.match(/data-save-slot=/g)).toHaveLength(2)
    expect(text).toContain('data-save-slot="off"')
    expect(text).toContain('data-save-slot="local"')
    expect(text).toContain('draft-save-slot--off')
    expect(text).toContain('draft-save-slot--local')
    expect(text).toContain('usePublicCalculator')
    expect(text).not.toContain('draft-save-slot--cloud')
    expect(text).not.toContain('numberSet')
    expect(text).not.toContain('Auth')
    expect(text).not.toContain('billing')
    expect(text).not.toContain('draft-save-label')
    expect(text).not.toContain('draft-save-delete')
  })

  it('pauses autosave without deleting the stored draft', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const context = source('src/context/PublicCalculatorContext.tsx')

    expect(text).toContain('onClick={pauseSaving}')
    expect(context).toContain("localStorage.setItem(SAVE_ENABLED_KEY, '0')")
    expect(context).toContain('function readInitialSaveEnabled')
    expect(context).not.toMatch(/function pauseSaving[\s\S]*clearDraft\(\)/)
  })

  it('clears input fields without deleting or disabling the public local draft', () => {
    const context = source('src/context/PublicCalculatorContext.tsx')
    const resetStart = context.indexOf('const resetInputs = useCallback(')
    const resetEnd = context.indexOf('const setSaveEnabled = useCallback(', resetStart)
    const resetBlock = context.slice(resetStart, resetEnd)

    expect(resetBlock).toContain('replaceCalculatorHistory(current, defaultInputs)')
    expect(resetBlock).not.toContain('clearDraft()')
    expect(resetBlock).not.toContain('setSaveEnabledState(false)')
    expect(resetBlock).not.toContain('setHasLocalDraft(false)')
  })

  it('restores a deliberately cleared draft as an existing saved draft', () => {
    const context = source('src/context/PublicCalculatorContext.tsx')
    const readStart = context.indexOf('function readLegacyDraft()')
    const readEnd = context.indexOf('function readActiveLocalSetDraft()', readStart)
    const readBlock = context.slice(readStart, readEnd)

    expect(readBlock).toContain('return parseStoredCalculatorInputs(JSON.parse(raw))')
    expect(readBlock).not.toContain('hasMeaningfulCalculatorInputs')
  })

  it('does not expose a separate delete action in the compact public slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).not.toContain('deleteSavedData')
    expect(text).not.toContain('deleteConfirmOpen')
    expect(text).not.toContain('createPortal')
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
