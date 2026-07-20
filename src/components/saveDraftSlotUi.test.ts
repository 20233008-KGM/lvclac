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
    expect(text).toContain("const slots: SaveSlot[] = ['off', 'local', 'cloud']")
    expect(text).not.toContain("cloudAvailable ? ['off', 'local', 'cloud']")
    expect(text).toContain('const active = !saveEnabled')
  })

  it('keeps the cloud slot visible for signed-out users and opens login before changing save state', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const ko = source('src/i18n/locales/ko.ts')
    const en = source('src/i18n/locales/en.ts')

    expect(text).toMatch(
      /const mode = slot\s+if \(mode === 'cloud' && !user\) \{\s+setAuthModalOpen\(true\)\s+return\s+\}/,
    )
    expect(text).toContain(': t.draftSave.cloudLoginRequired')
    expect(ko).toContain("cloudLoginRequired: '클라우드 · 로그인 필요'")
    expect(en).toContain("cloudLoginRequired: 'Cloud · Login required'")
  })

  it('does not expose cloud drag-copy as a drop action before login', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain("(user != null || (source !== 'cloud' && target !== 'cloud'))")
  })

  it('styles the no-save slot and shares slot stroke rules with the off pictogram', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot--off')
    expect(css).toContain('.draft-save-slot circle')
  })

  it('asks to delete stored data when clicking the already-active save slot', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const ctx = source('src/context/CalculatorContext.tsx')

    expect(text).not.toContain("setModal('delete-confirm')")
    expect(text).not.toContain('setPendingDeleteMode(mode)')
    expect(ctx).toContain('deleteNumberSetById')
    expect(text).not.toContain('deleteConfirmTitle')
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

  it('supports drag-copying saved values between local and cloud slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const ctx = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('handleSlotDragStart')
    expect(text).toContain('handleSlotDragOver')
    expect(text).toContain('handleSlotDrop')
    expect(text).toContain('draggable={canDragMode(mode)}')
    expect(text).toContain('copyDraftBetweenStorageModes(sourceMode, targetMode)')
    expect(ctx).toContain(
      'copyDraftBetweenStorageModes: (source: SaveStorageMode, target: SaveStorageMode) => Promise<string | null>',
    )
    expect(ctx).toContain("if (source === 'local' && target === 'cloud')")
    expect(ctx).toContain("if (source === 'cloud' && target === 'local')")
    expect(ctx).toContain('saveNumberSet(activeUserId, localDraft, cloudSetIdRef.current)')
    expect(ctx).toContain('saveDraft(result.data.inputs)')
  })

  it('describes slot drag-copy behavior in the save tooltip copy', () => {
    const types = source('src/i18n/types.ts')
    const ko = source('src/i18n/locales/ko.ts')
    const en = source('src/i18n/locales/en.ts')
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(types).toContain('copyHint: string')
    expect(types).toContain('helpHint: string')
    expect(types).toContain('helpHintLabel: string')
    expect(ko).toContain('저장값이 있는 슬롯을 다른 슬롯으로 드래그하면 값만 복사합니다')
    expect(en).toContain('Drag a filled slot onto another to copy values only')
    expect(text).toContain('t.draftSave.helpHint')
    expect(text).toContain('t.draftSave.helpHintLabel')
  })

  it('styles save slots while they are drag sources or drop targets', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot--dragging')
    expect(css).toContain('.draft-save-slot--drop-target')
    expect(css).toContain('cursor: copy;')
  })

  it('positions the save tooltip from the right edge of the slot group', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const tooltipText = source('src/hooks/useFloatingTooltip.tsx')
    const css = source('src/App.css')

    expect(text).toContain("horizontalAlign: 'right'")
    expect(text).toContain('field-label-tooltip-trigger')
    expect(text).toContain('draft-save-slots__help')
    expect(text).toContain('positionAnchorRef: slotsRowRef')
    expect(text).toContain('ref={slotsRowRef}')
    expect(tooltipText).toContain('positionAnchorRef?: RefObject<HTMLElement | null>')
    expect(tooltipText).toContain('rightAlignedLeft')
    expect(css).toContain('.floating-tooltip-layer.draft-save-tooltip {')
    expect(css).toContain('visibility: visible;')
    expect(css).toContain('.draft-save-tooltip:not(.floating-tooltip-layer)')
  })

  it('does not render the legacy migrate-to-cloud link button', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).not.toContain('draft-save-migrate')
    expect(text).not.toContain('migrateLocalDraftToCloud')
    expect(text).not.toContain('migrateLocalToCloud')
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

  it('shows a compact checkmark timestamp inline with the save slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toMatch(/import \{[^}]*formatSavedAtCompact[^}]*\} from '\.\.\/utils\/format'/)
    expect(text).toContain('formatSavedAtCompact(savedAt)')
    expect(text).toContain('<div className="draft-save-row">')
    expect(text).not.toContain('draft-save-status--icon-only')
    expect(text).not.toContain('statusSavedLocal')
    expect(text).not.toContain('statusSavedCloud')
  })

  it('only shows the saved checkmark once persisted and reserves its slot to avoid jitter', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    // 저장 완료(미커밋 변경 없음)일 때만 체크 표시
    expect(text).toContain("const showSavedCheck = syncStatus === 'saved' && Boolean(savedAt)")
    // 체크 자리를 항상 확보하는 고정폭 슬롯
    expect(text).toContain('className="draft-save-status__check"')
    expect(text).toContain("showSavedCheck ? '✓' : ''")
  })

  it('reserves a fixed-width checkmark slot in css so the timestamp does not shift', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-status__check')
    expect(css).toContain('width: 0.85em;')
  })

  it('marks the draft dirty immediately on edit so the checkmark disappears until saved', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toMatch(/setSyncStatus\('saving'\)\r?\n\s+const timer = window\.setTimeout\(\(\) => \{/)
  })

  it('keeps the saved status in the same muted tone as other draft-save status text', () => {
    const css = source('src/App.css')

    expect(css).not.toContain('.draft-save-status--saved {')
    expect(css).toContain('.draft-save-status,')
    expect(css).toContain('.draft-save-notice {')
    expect(css).toContain('color: var(--color-text-dim);')
  })

  it('formats the compact saved-at timestamp as zero-padded MMDDHHmm', () => {
    const text = source('src/utils/format.ts')

    expect(text).toContain('export function formatSavedAtCompact')
    expect(text).toContain("String(n).padStart(2, '0')")
    expect(text).not.toContain('export function formatSavedAtShort')
  })

  it('puts the save toggle back at the bottom of the margin section, not the input panel header', () => {
    const inputPanel = source('src/components/InputPanel.tsx')

    expect(inputPanel).toContain('<div className="field-section-footer">')
    expect(inputPanel).not.toContain('input-panel__save-row')
  })

  it('does not bump the local saved-at timestamp when persisting unchanged draft content', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('function isSameAsStoredDraft')
    expect(text).toContain('if (isSameAsStoredDraft(value)) {')
  })

  it('reports an error status instead of a false "saved" status when local draft save fails', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('if (!savedAt) {')
    expect(text).toContain("setSyncError('local_draft_save_failed')")
    expect(text).toContain("return 'local_draft_save_failed'")
  })

  it('tracks local and cloud draft saved-at timestamps in the calculator context', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('localDraftSavedAt: string | null')
    expect(text).toContain('cloudDraftSavedAt: string | null')
    expect(text).toContain('const [localDraftSavedAt, setLocalDraftSavedAt]')
    expect(text).toContain('const [cloudDraftSavedAt, setCloudDraftSavedAt]')
    expect(text).toContain('function readDraftSavedAt')
    expect(text).toContain("localStorage.setItem(DRAFT_SAVED_AT_KEY, savedAt)")
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

  it('renders an icon-only number-set picker next to the storage slots', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const css = source('src/App.css')

    expect(text).toContain('draft-number-set-picker')
    expect(text).toContain('aria-label={t.draftSave.numberSetPickerLabel}')
    expect(text).toContain('aria-haspopup="menu"')
    expect(text).toContain('aria-expanded={numberSetMenuOpen}')
    expect(text).toContain('role="menu"')
    expect(text).toContain('draft-number-set-menu')
    expect(text).toContain('NumberSetStackIcon')
    expect(css).toContain('.draft-number-set-picker {')
    expect(css).toContain('.draft-number-set-menu {')
  })

  it('keeps number-set names inside the menu instead of the closed save row', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain('.map((numberSet) => numberSet)')
    expect(text).toContain('numberSet.title')
    expect(text).toContain('handleNumberSetSelect(numberSet.storageMode, numberSet.id)')
    expect(text).not.toContain('draft-number-set-active-chip')
  })

  it('exposes number-set list actions from the calculator context', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('export interface CalculatorNumberSet')
    expect(text).toContain('numberSets: CalculatorNumberSet[]')
    expect(text).toContain('activeNumberSetId: string | null')
    expect(text).toContain('numberSetLimits: Record<SaveStorageMode, number>')
    expect(text).toContain('selectNumberSet: (mode: SaveStorageMode, setId: string) => Promise<string | null>')
    expect(text).toContain('createNumberSet: (mode: SaveStorageMode) => Promise<string | null>')
    expect(text).toContain('renameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => Promise<string | null>')
    expect(text).toContain('deleteNumberSetById: (mode: SaveStorageMode, setId: string) => Promise<string | null>')
  })

  it('uses multi-set cloud helpers instead of latest-only selection for lists', () => {
    const db = source('src/db/numberSets.ts')

    expect(db).toContain('export async function fetchNumberSets')
    expect(db).toContain('export async function createNumberSet')
    expect(db).toContain('export async function renameNumberSet')
    expect(db).toContain(".order('updated_at', { ascending: false })")
  })
})
