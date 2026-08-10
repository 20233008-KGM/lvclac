import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(path), 'utf8')
}

describe('draft save slot UI', () => {
  it('shows a user-named active set in the input panel header without a redundant label', () => {
    const inputPanel = source('src/components/InputPanel.tsx')
    const activeLabel = source('src/components/ActiveNumberSetLabel.tsx')
    const styles = source('src/App.css')

    expect(inputPanel).toContain('<ActiveNumberSetLabel />')
    expect(activeLabel).toContain('activeNumberSetId')
    expect(activeLabel).toContain('active-number-set-label__storage')
    expect(activeLabel).not.toContain('현재 세트')
    expect(styles).toMatch(/\.active-number-set-label::before\s*\{[^}]*height: 9px;/s)
  })

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

  it('confirms and deletes the active number set when clicking the active save slot again', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toContain("type ModalKind = 'enable' | 'delete-confirm' | null")
    expect(text).toMatch(
      /if \(saveEnabled && storageMode === mode\) \{\s+if \(!storedForMode\(mode\)\) return\s+setPendingDeleteMode\(mode\)\s+setModal\('delete-confirm'\)/,
    )
    expect(text).toContain('void deleteSavedData(mode).then((error) => {')
    expect(text).toContain("modal === 'delete-confirm'")
    expect(text).toContain('t.draftSave.deleteConfirmTitle')
    expect(text).toContain('t.draftSave.cloudDeleteConfirmBody')
  })

  it('keeps the delete confirmation open when deleting the active slot fails', () => {
    const text = source('src/components/SaveDraftToggle.tsx')

    expect(text).toMatch(
      /if \(error\) \{\s+setNotice\(t\.draftSave\.statusError\)\s+return\s+\}\s+setPendingDeleteMode\(null\)\s+setModal\(null\)/,
    )
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

  it('keeps the first-save notice but removes the persistent reopen link', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const styles = source('src/App.css')
    const types = source('src/i18n/types.ts')

    expect(text).toContain("modal === 'enable'")
    expect(text).toContain('t.draftSave.skipModalLabel')
    expect(text).not.toContain('showGuideAgain')
    expect(text).not.toContain("'enable-info'")
    expect(styles).not.toContain('.draft-save-show-guide')
    expect(types).not.toContain('showGuideAgain: string')
  })

  it('underlines only the local browser-data loss sentence in both languages', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const styles = source('src/App.css')

    expect(text).toContain('draft-save-modal-emphasis')
    expect(text).toContain(
      'emphasis={modalIsCloud ? undefined : t.draftSave.localDataLossEmphasis}',
    )
    expect(styles).toContain('.draft-save-modal-emphasis')
    expect(styles).toContain('text-decoration-line: underline')
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
    expect(ctx).toContain('saveNumberSet(activeUserId, localDraft, localPreset, cloudSetIdRef.current)')
    expect(ctx).toContain('saveDraft(selected.inputs, selected.presetId ?? preset)')
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

  it('copies one number set onto another from the active-set picker', () => {
    const text = source('src/components/SaveDraftToggle.tsx')
    const ctx = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('NUMBER_SET_DRAG_TYPE')
    expect(text).toContain('handleNumberSetDragStart')
    expect(text).toContain('handleNumberSetDrop')
    expect(text).toContain('copyNumberSetValues(source.mode, source.setId, target.mode, target.setId)')
    expect(text).toContain('title={t.draftSave.numberSetCopyHint}')
    expect(ctx).toContain('const copyNumberSetValues = useCallback')
    expect(ctx).toContain('upsertLocalNumberSet(')
    expect(ctx).toContain('saveNumberSet(')
    expect(ctx).toContain('targetSetId,')
  })

  it('explains that number-set drag-copy keeps the target identity', () => {
    const types = source('src/i18n/types.ts')
    const ko = source('src/i18n/locales/ko.ts')
    const en = source('src/i18n/locales/en.ts')

    expect(types).toContain('numberSetCopyHint: string')
    expect(types).toContain('numberSetCopySuccess: string')
    expect(ko).toContain('대상 세트의 이름·저장 위치는 유지되고 입력값만 복사됩니다')
    expect(en).toContain("keeping the target set's name and storage location")
  })

  it('styles save slots while they are drag sources or drop targets', () => {
    const css = source('src/App.css')

    expect(css).toContain('.draft-save-slot--dragging')
    expect(css).toContain('.draft-save-slot--drop-target')
    expect(css).toContain('cursor: copy;')
  })

  it('styles number-set rows while dragging and targeting a copy', () => {
    const css = source('src/App.css')

    expect(css).toContain(".draft-number-set-menu__item[draggable='true']")
    expect(css).toContain('.draft-number-set-menu__item--dragging')
    expect(css).toContain('.draft-number-set-menu__item--drop-target')
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

    expect(text).toContain('if (selected) replaceNumberSetFromStorage(selected)')
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

  it('does not reschedule cloud autosave when only the saved slot list changes', () => {
    const text = source('src/context/CalculatorContext.tsx')
    const persistStart = text.indexOf('const persistInputs = useCallback(')
    const persistEnd = text.indexOf('const persistInputsRef = useRef(', persistStart)
    const persistBlock = text.slice(persistStart, persistEnd)
    const dependencyList = persistBlock.match(/\n\s+\[([^\]]+)\],\r?\n\s+\)\r?\n\s*$/)?.[1]

    expect(dependencyList).toBeDefined()
    expect(dependencyList).not.toMatch(/\bcloudNumberSets\b/)
    expect(persistBlock).not.toContain('cloudNumberSetsRef')
  })

  it('persists empty inputs without deleting the active local or cloud number set', () => {
    const text = source('src/context/CalculatorContext.tsx')
    const persistStart = text.indexOf('const persistInputs = useCallback(')
    const persistEnd = text.indexOf('const setSaveEnabled = useCallback(', persistStart)
    const persistBlock = text.slice(persistStart, persistEnd)

    expect(persistBlock).toContain('saveDraft(value, preset)')
    expect(persistBlock).toContain(
      'saveNumberSet(activeUserId, value, preset, previousSetId)',
    )
    expect(persistBlock).not.toContain('clearDraft(')
    expect(persistBlock).not.toContain('deleteNumberSet(')
    expect(persistBlock).not.toContain('hasMeaningfulCalculatorInputs(value)')
  })

  it('treats an empty-input cloud set as an existing saved set', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('if (selected) {')
    expect(text).toContain('const hasDraft = (result.data ?? []).length > 0')
    expect(text).not.toContain(
      'selected && hasMeaningfulCalculatorInputs(selected.inputs)',
    )
    expect(text).not.toContain(
      '!selected || !hasMeaningfulCalculatorInputs(selected.inputs)',
    )
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

  it('keeps the memo focus ring inside its fixed button box', () => {
    const css = source('src/App.css')

    expect(css).toMatch(
      /\.memo-note-button:hover,\s*\.memo-note-button:focus-visible\s*\{[\s\S]*border-color: transparent;[\s\S]*box-shadow: inset 0 0 0 1px/,
    )
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
    expect(text).toContain('setNumberSetPreset: (')
    expect(text).toContain('deleteNumberSetById: (mode: SaveStorageMode, setId: string) => Promise<string | null>')
  })

  it('restores and persists the terminology preset with the active number-set slot', () => {
    const text = source('src/context/CalculatorContext.tsx')

    expect(text).toContain('replaceNumberSetFromStorage')
    expect(text).toContain('const nextPreset = numberSet.presetId ?? currentPreset')
    expect(text).toContain('void setNumberSetPreset(storageMode, activeNumberSetId, preset)')
    expect(text).toContain('presetId: preset')
  })

  it('uses multi-set cloud helpers instead of latest-only selection for lists', () => {
    const db = source('src/db/numberSets.ts')

    expect(db).toContain('export async function fetchNumberSets')
    expect(db).toContain('export async function createNumberSet')
    expect(db).toContain('export async function renameNumberSet')
    expect(db).toContain(".order('updated_at', { ascending: false })")
  })
})
