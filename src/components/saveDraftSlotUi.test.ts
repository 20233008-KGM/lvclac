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

  it('uses stored and active classes independently for save slot states', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('draft-save-slot--stored')
    expect(text).toContain('draft-save-slot--active')
    expect(text).toContain('hasCloudDraft')
    expect(text).toContain('hasLocalDraft')
    expect(text).toContain('saveEnabled && storageMode === mode')
  })

  it('exposes cloud draft presence from the calculator context', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('hasCloudDraft: boolean')
    expect(text).toContain('const [hasCloudDraft, setHasCloudDraft]')
    expect(text).toContain('hasCloudDraft,')
  })

  it('keeps compact slot dimensions while enlarging the pictogram inside', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot {')
    expect(css).toContain('width: 40px;')
    expect(css).toContain('height: 30px;')
    expect(css).toContain('.draft-save-slot svg {')
    expect(css).toContain('width: 26px;')
    expect(css).toContain('height: 26px;')
    expect(css).toContain('.draft-save-slot--active.draft-save-slot--stored')
  })
})
