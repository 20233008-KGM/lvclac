import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve('src/components/MemoEditorWindow.tsx'), 'utf8')
const slotSource = readFileSync(resolve('src/components/SaveDraftToggle.tsx'), 'utf8')
const css = readFileSync(resolve('src/App.css'), 'utf8')
const pageCss = readFileSync(resolve('src/styles/pages.css'), 'utf8')

describe('MemoEditorWindow production contract', () => {
  it('uses an SVG close mark instead of a font glyph', () => {
    expect(source).toContain('M5 5l10 10M15 5L5 15')
    expect(source).not.toContain("textContent = '×'")
  })

  it('autosaves after typing and preserves an error state for retry', () => {
    expect(source).toContain('window.setTimeout(() =>')
    expect(source).toContain('}, 400)')
    expect(source).toContain("setSaveState('error')")
  })

  it('shares the autosave contract with the records-page workspace editor', () => {
    expect(source).toContain('export const MemoWorkspaceEditor = forwardRef')
    expect(source).toContain('useMemoAutosave(initialMemo, onSave)')
    expect(source).toContain('useImperativeHandle(ref, () => ({ save })')
    expect(pageCss).toContain('.records-memo-editor__textarea')
    expect(pageCss).toContain('.records-memo-editor__preview')
    expect(pageCss).toContain('.records-memo-workspace__toggle')
  })

  it('supports desktop header dragging and a fixed mobile sheet', () => {
    expect(source).toContain('onPointerDown={startDrag}')
    expect(source).toContain("window.matchMedia('(max-width: 720px)').matches")
    expect(css).toContain('.memo-editor-window__head')
    expect(css).toContain('.memo-editor-window{inset:12px')
  })

  it('uses a solid default memo background with a persisted opacity control', () => {
    expect(source).toContain("const MEMO_EDITOR_OPACITY_DEFAULT = 100")
    expect(source).toContain("MEMO_EDITOR_OPACITY_STORAGE_KEY")
    expect(source).toContain('type="range"')
    expect(source).toContain('memoBackgroundOpacity')
    expect(css).toContain('var(--memo-editor-opacity,100%)')
    expect(css).toContain('background:var(--color-bg-elevated)')
    expect(css).toContain(
      'background:color-mix(in srgb,var(--color-surface) var(--memo-editor-opacity,100%),transparent)',
    )
    expect(css).not.toContain('background:var(--panel-bg)')
  })

  it('offers number-set memos only on cloud slots', () => {
    expect(slotSource).toContain("mode === 'cloud' && (")
    expect(slotSource).toContain('cloudNumberSets.find((set) => set.id === memoSetId)')
    expect(slotSource).toContain("setNumberSetMemo('cloud', numberSet.id, memo)")
  })
})
