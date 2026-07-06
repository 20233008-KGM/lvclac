import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('draft save slot UI', () => {
  it('renders local and cloud storage choices as icon-only save slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('draft-save-slots')
    expect(text).toContain('draft-save-slot--local')
    expect(text).toContain('draft-save-slot--cloud')
    expect(text).toContain('draft-save-slot__fill')
    expect(text).toContain('draft-save-slot__sr-label')
    expect(text).not.toContain('draft-save-mode__btn')
  })

  it('offers an explicit no-save slot alongside the storage slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('draft-save-slot--off')
    expect(text).toContain('noSaveMode')
    expect(text).toContain("['off', 'local', 'cloud']")
    expect(text).toContain("['off', 'local']")
    expect(text).toContain('const active = !saveEnabled')
  })

  it('styles the no-save slot and shares slot stroke rules with the off pictogram', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot--off')
    expect(css).toContain('.draft-save-slot circle')
  })

  it('asks to delete stored data when clicking the already-active save slot', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain("setModal('delete-confirm')")
    expect(text).toContain('setPendingDeleteMode(mode)')
    expect(text).toContain('deleteSavedData')
    expect(text).toContain('deleteConfirmTitle')
  })

  it('keeps the no-save slot non-destructive by pausing instead of deleting', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const ctx = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('pauseSaving()')
    expect(ctx).toContain('const pauseSaving = useCallback')
    expect(ctx).toContain('const deleteSavedData = useCallback')
  })

  it('uses stored and active classes independently for save slot states', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('draft-save-slot--stored')
    expect(text).toContain('draft-save-slot--active')
    expect(text).toContain('hasCloudDraft')
    expect(text).toContain('hasLocalDraft')
    expect(text).toContain('saveEnabled && storageMode === mode')
  })

  it('activates stored slots without reopening the enable notice', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('if (storedForMode(mode)) {')
    expect(text).toContain('setStorageMode(mode)')
    expect(text).toContain('return')
    expect(text).toContain('if (!storedForMode(mode) && !readSkipEnableModal(mode))')
  })

  it('positions the save tooltip from the right edge of the slot group', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const tooltipText = source('src/hooks/useFloatingTooltip.tsx')

    expect(text).toContain("horizontalAlign: 'right'")
    expect(tooltipText).toContain("horizontalAlign?: FloatingTooltipHorizontalAlign")
    expect(tooltipText).toContain("horizontalAlign === 'right'")
  })

  it('exposes cloud draft presence from the calculator context', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('hasCloudDraft: boolean')
    expect(text).toContain('const [hasCloudDraft, setHasCloudDraft]')
    expect(text).toContain('hasCloudDraft,')
  })

  it('clears visible inputs instead of copying values when switching to an empty storage mode', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('replaceInputsFromStorage(draft ?? defaultInputs)')
    expect(text).toContain('replaceInputsFromStorage(defaultInputs)')
    expect(text).toContain('suppressNextPersistRef.current = true')
  })

  it('keeps compact slot dimensions while enlarging the pictogram inside', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot {')
    expect(css).toContain('width: 34px;')
    expect(css).toContain('height: 24px;')
    expect(css).toContain('padding: 1px;')
    expect(css).toContain('.draft-save-slot svg {')
    expect(css).toContain('width: 20px;')
    expect(css).toContain('height: 20px;')
    expect(css).toContain('.draft-save-slot--active.draft-save-slot--stored')
  })
})
