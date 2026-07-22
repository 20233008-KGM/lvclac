import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { calculateEvaluate } from '../calc/leverage'
import { BILLING_PATH, MY_PAGE_PATH } from '../config/routes'
import { useAuth } from '../context/AuthContext'
import { useCalculator, type SaveStorageMode } from '../context/CalculatorContext'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { formatLeverageValue, formatNumber, formatSavedAtCompact } from '../utils/format'
import { TooltipBody } from './TooltipBody'
import { MemoButton, MemoEditorWindow } from './MemoEditorWindow'
import type { SnapshotProGateMode } from './SnapshotProGateModal'

// 게이트/로그인 모달은 실제로 열릴 때만 로드(코드 스플리팅 — ResultPanel과 동일 패턴).
const AuthModal = lazy(() =>
  import('./auth/AuthModal').then((mod) => ({ default: mod.AuthModal })),
)
const SnapshotProGateModal = lazy(() =>
  import('./SnapshotProGateModal').then((mod) => ({ default: mod.SnapshotProGateModal })),
)

const SKIP_ENABLE_MODAL_KEY = 'leverage_save_enable_modal_skip'
const DRAFT_SLOT_DRAG_TYPE = 'application/x-lvclac-draft-slot'

type ModalKind = 'enable' | 'enable-info' | null

type SaveSlot = 'off' | SaveStorageMode

function parseDraggedMode(value: string): SaveStorageMode | null {
  return value === 'local' || value === 'cloud' ? value : null
}

function skipEnableModalKey(mode: SaveStorageMode): string {
  return `${SKIP_ENABLE_MODAL_KEY}_${mode}`
}

function readSkipEnableModal(mode: SaveStorageMode): boolean {
  try {
    return localStorage.getItem(skipEnableModalKey(mode)) === '1'
  } catch {
    return false
  }
}

function setSkipEnableModal(mode: SaveStorageMode, skip: boolean): void {
  try {
    const key = skipEnableModalKey(mode)
    if (skip) localStorage.setItem(key, '1')
    else localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

function DraftSaveModal({
  title,
  children,
  confirmLabel,
  onConfirm,
  onDismiss,
  footer,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onDismiss?: () => void
  footer?: ReactNode
}) {
  const dismiss = onDismiss ?? onConfirm

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss()
      }}
    >
      <div
        className="disclaimer-modal draft-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-save-modal-title"
      >
        <h2 id="draft-save-modal-title" className="disclaimer-modal-title">
          {title}
        </h2>
        {children}
        <button type="button" className="btn btn-primary draft-save-modal-btn" onClick={onConfirm}>
          {confirmLabel}
        </button>
        {footer && <div className="draft-save-modal-footer">{footer}</div>}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function EnableModalBody({ lines }: { lines: string[] }) {
  return (
    <div className="draft-save-modal-body">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

function LocalComputerIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect className="draft-save-slot__fill" x="7.4" y="6.2" width="13.2" height="10.8" rx="1.4" />
      <rect x="6.1" y="4.9" width="15.8" height="13.4" rx="1.9" fill="none" />
      <line x1="10.4" y1="22.1" x2="17.6" y2="22.1" />
      <line x1="14" y1="18.4" x2="14" y2="22.1" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path
        className="draft-save-slot__fill"
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
      />
      <path
        d="M8.4 21h11.2a5.05 5.05 0 0 0 .4-10.1A6.45 6.45 0 0 0 7.7 12.8 4.25 4.25 0 0 0 8.4 21z"
        fill="none"
      />
    </svg>
  )
}

function OffIcon() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="8.4" fill="none" />
      <line x1="8.1" y1="8.1" x2="19.9" y2="19.9" />
    </svg>
  )
}

function NumberSetStackIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <line x1="6" y1="6" x2="16" y2="6" />
      <line x1="6" y1="10" x2="16" y2="10" />
      <line x1="6" y1="14" x2="16" y2="14" />
      <circle cx="3" cy="6" r="0.6" />
      <circle cx="3" cy="10" r="0.6" />
      <circle cx="3" cy="14" r="0.6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <line x1="10" y1="4.5" x2="10" y2="15.5" />
      <line x1="4.5" y1="10" x2="15.5" y2="10" />
    </svg>
  )
}

function InfoGlyph() {
  return (
    <span className="draft-number-set-menu__info-glyph" aria-hidden="true">
      i
    </span>
  )
}

/** 위치(로컬/클라우드)별 스토리지 글리프 — 그룹 라벨·아이콘 타일에 재사용. */
function StorageGlyph({ mode }: { mode: SaveStorageMode }) {
  return mode === 'local' ? <LocalComputerIcon /> : <CloudIcon />
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="7.5" rx="1.6" fill="none" />
      <path d="M6.75 9 V6.5 a3.25 3.25 0 0 1 6.5 0 V9" fill="none" />
    </svg>
  )
}

export function SaveDraftToggle() {
  const { t } = useLanguage()
  const {
    saveEnabled,
    storageMode,
    cloudAvailable,
    syncStatus,
    hasLocalDraft,
    hasCloudDraft,
    localDraftSavedAt,
    cloudDraftSavedAt,
    numberSets,
    activeNumberSetId,
    numberSetLimits,
    setSaveEnabled,
    pauseSaving,
    setStorageMode,
    selectNumberSet,
    createNumberSet,
    setNumberSetMemo,
    copyDraftBetweenStorageModes,
  } = useCalculator()
  const { user, isPro } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState<ModalKind>(null)
  const [pendingMode, setPendingMode] = useState<SaveStorageMode | null>(null)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [, refreshSkipState] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [draggingMode, setDraggingMode] = useState<SaveStorageMode | null>(null)
  const [dropTargetMode, setDropTargetMode] = useState<SaveStorageMode | null>(null)
  const [numberSetMenuOpen, setNumberSetMenuOpen] = useState(false)
  const [numberSetMenuStyle, setNumberSetMenuStyle] = useState<CSSProperties | null>(null)
  const [gateMode, setGateMode] = useState<SnapshotProGateMode | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [memoSetId, setMemoSetId] = useState<string | null>(null)
  const numberSetPickerRef = useRef<HTMLButtonElement>(null)
  const numberSetMenuRef = useRef<HTMLDivElement>(null)
  const isCloud = storageMode === 'cloud'
  const modalMode = pendingMode ?? storageMode
  const modalIsCloud = modalMode === 'cloud'
  const skipActive = readSkipEnableModal(storageMode)
  const enableTitle = modalIsCloud
    ? t.draftSave.cloudEnableModalTitle
    : t.draftSave.enableModalTitle
  const enableBody = modalIsCloud
    ? t.draftSave.cloudEnableModalBody
    : t.draftSave.enableModalBody
  const savedAt = isCloud ? cloudDraftSavedAt : localDraftSavedAt

  // 저장 완료(=미커밋 변경 없음)일 때만 체크(✓)를 보인다.
  const showSavedCheck = syncStatus === 'saved' && Boolean(savedAt)
  // 시각 텍스트: 저장된 시각이 있으면 항상 그 시각을 유지해 편집 중에도 숫자필드가 흔들리지 않게 한다.
  const statusText =
    syncStatus === 'error'
      ? t.draftSave.statusError
      : savedAt
        ? formatSavedAtCompact(savedAt)
        : syncStatus === 'loading'
          ? t.draftSave.statusLoading
          : syncStatus === 'saving'
            ? t.draftSave.statusSaving
            : null
  const menuNumberSets = numberSets
    .map((numberSet) => numberSet)
    .filter((numberSet) => cloudAvailable || numberSet.storageMode === 'local')
  const localNumberSets = menuNumberSets.filter((numberSet) => numberSet.storageMode === 'local')
  const cloudNumberSets = menuNumberSets.filter((numberSet) => numberSet.storageMode === 'cloud')

  const countForMode = (mode: SaveStorageMode) =>
    mode === 'local' ? localNumberSets.length : cloudNumberSets.length

  // '세트 추가' 게이트 판정. 로컬 세트는 로그인 없이도 무료 한도까지 만들 수 있고,
  // 클라우드 세트만 로그인이 필요하다(로컬 우선 UX 보존).
  // - 클라우드인데 비로그인 → 로그인 유도('guest')
  // - 무료·한도 초과 → 로그인 상태면 Pro 유도('free'), 비로그인이면 로그인 유도('guest')
  const addAtLimit = countForMode(storageMode) >= numberSetLimits[storageMode]
  const addGatedByPlan = addAtLimit && !isPro
  const addGateMode: SnapshotProGateMode | null =
    storageMode === 'cloud' && !user
      ? 'guest'
      : addGatedByPlan
        ? user
          ? 'free'
          : 'guest'
        : null

  // 슬롯 메타: 방향(색점) · 계좌평가금 · 레버리지.
  // 계좌평가금(accountEval)은 저장된 입력값이라 그대로 쓰고, 레버리지는 저장값이 아니라
  // 입력으로부터 계산해 얻는 파생값이라 calculateEvaluate로 뽑는다(순수 산술, 세트 수만큼 반복해도 무해).
  // 입력이 불완전한 세트는 값이 null → 해당 칸을 비우되 고정폭은 CSS가 유지해 정렬은 안 흔들린다.
  const describeNumberSet = (numberSet: (typeof menuNumberSets)[number]) => {
    const { inputs } = numberSet
    const equity = inputs.accountEval ?? null
    const leverageRatio = calculateEvaluate(inputs).leverageRatio
    return {
      side: inputs.positionSide,
      sideLabel: inputs.positionSide === 'short' ? t.short : t.long,
      equityText: equity != null ? formatNumber(equity) : null,
      // 슬롯은 언어와 무관하게 'x' 표기(예: 20x). 본문 계산기의 '배'(t.leverageUnit)와 별개.
      leverageText: leverageRatio != null ? `${formatLeverageValue(leverageRatio)}x` : null,
    }
  }

  const openEnableModal = (mode: SaveStorageMode = storageMode) => {
    setPendingMode(mode === storageMode ? null : mode)
    setDontShowAgain(false)
    setModal('enable')
  }

  const applySaveEnabled = async (next: boolean, mode: SaveStorageMode = storageMode) => {
    setBusy(true)
    setNotice(null)
    const error = await setSaveEnabled(next, mode)
    if (error) setNotice(t.draftSave.statusError)
    setBusy(false)
    return error
  }

  const storedForMode = (mode: SaveStorageMode) => (mode === 'local' ? hasLocalDraft : hasCloudDraft)

  const modeLabelFor = (mode: SaveStorageMode) =>
    mode === 'local' ? t.draftSave.localMode : t.draftSave.cloudMode

  const formatCopySuccess = (source: SaveStorageMode, target: SaveStorageMode) =>
    t.draftSave.copySuccess
      .replace('{source}', modeLabelFor(source))
      .replace('{target}', modeLabelFor(target))

  const canDragMode = (mode: SaveStorageMode) =>
    !busy && syncStatus !== 'loading' && storedForMode(mode)

  const canDropMode = (source: SaveStorageMode | null, target: SaveStorageMode) =>
    !busy &&
    syncStatus !== 'loading' &&
    source != null &&
    source !== target &&
    storedForMode(source) &&
    (user != null || (source !== 'cloud' && target !== 'cloud'))

  const handleModeChange = (mode: SaveStorageMode) => {
    if (mode === storageMode) return
    setNotice(null)
    if (storedForMode(mode)) {
      setStorageMode(mode)
      return
    }
    if (saveEnabled && !readSkipEnableModal(mode)) {
      openEnableModal(mode)
      return
    }
    setStorageMode(mode)
  }

  const confirmEnable = () => {
    const consentMode = pendingMode ?? storageMode
    if (dontShowAgain) {
      setSkipEnableModal(consentMode, true)
      refreshSkipState((value) => value + 1)
    }
    if (pendingMode) {
      const targetMode = pendingMode
      setStorageMode(targetMode)
      setPendingMode(null)
      if (!saveEnabled) {
        void applySaveEnabled(true, targetMode).then((error) => {
          if (!error) setModal(null)
        })
        return
      }
      setModal(null)
      return
    }
    void applySaveEnabled(true).then((error) => {
      if (!error) setModal(null)
    })
  }

  const cancelEnable = () => {
    setPendingMode(null)
    setModal(null)
  }

  const helpTooltipId = useId()
  const slotsRowRef = useRef<HTMLDivElement>(null)
  const { anchorRef: helpAnchorRef, anchorHandlers: helpAnchorHandlers, focusWithinHandlers: helpFocusWithinHandlers, renderTooltip: renderHelpTooltip } = useFloatingTooltip({
    placement: 'top',
    horizontalAlign: 'right',
    focusWithin: true,
    positionAnchorRef: slotsRowRef,
  })

  const showGuideAgain = () => {
    setSkipEnableModal(storageMode, false)
    refreshSkipState((value) => value + 1)
    setModal('enable-info')
  }

  const positionNumberSetMenu = () => {
    const anchor = numberSetPickerRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const gap = 8
    const viewportPadding = 12
    const width = Math.min(320, Math.max(240, window.innerWidth - 24))
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
    const desiredHeight = Math.min(320, window.innerHeight - viewportPadding * 2)
    const measuredHeight = numberSetMenuRef.current?.offsetHeight
    const menuHeight = Math.min(measuredHeight ?? desiredHeight, desiredHeight)
    const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding
    const spaceAbove = rect.top - gap - viewportPadding
    const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
    const availableHeight = openAbove ? spaceAbove : spaceBelow
    const maxHeight = Math.min(desiredHeight, Math.max(180, availableHeight))
    const top = openAbove
      ? Math.max(viewportPadding, rect.top - gap - Math.min(menuHeight, maxHeight))
      : Math.min(rect.bottom + gap, window.innerHeight - viewportPadding - maxHeight)
    setNumberSetMenuStyle({
      position: 'fixed',
      top,
      left,
      width,
      maxHeight,
    })
  }

  useEffect(() => {
    if (!numberSetMenuOpen) return
    positionNumberSetMenu()

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (numberSetPickerRef.current?.contains(target)) return
      if (numberSetMenuRef.current?.contains(target)) return
      if (target instanceof Element && target.closest('.memo-editor-window')) return
      setNumberSetMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNumberSetMenuOpen(false)
    }
    const onResize = () => positionNumberSetMenu()

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [numberSetMenuOpen])

  const handleNumberSetSelect = (mode: SaveStorageMode, setId: string) => {
    setNumberSetMenuOpen(false)
    setBusy(true)
    setNotice(null)
    void selectNumberSet(mode, setId).then((error) => {
      setBusy(false)
      if (error) setNotice(t.draftSave.statusError)
    })
  }

  const handleNumberSetAdd = () => {
    if (addGateMode) {
      setNumberSetMenuOpen(false)
      setGateMode(addGateMode)
      return
    }
    setBusy(true)
    setNotice(null)
    void createNumberSet(storageMode).then((error) => {
      setBusy(false)
      if (error === 'number_set_limit_reached') {
        setNotice(t.draftSave.numberSetLimitReached)
      } else if (error) {
        setNotice(t.draftSave.statusError)
      }
    })
  }

  const handleSlotDragStart = (event: DragEvent<HTMLButtonElement>, mode: SaveStorageMode) => {
    if (!canDragMode(mode)) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(DRAFT_SLOT_DRAG_TYPE, mode)
    setDraggingMode(mode)
    setDropTargetMode(null)
    setNotice(null)
  }

  const handleSlotDragOver = (event: DragEvent<HTMLButtonElement>, targetMode: SaveStorageMode) => {
    const sourceMode = draggingMode
    if (!canDropMode(sourceMode, targetMode)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setDropTargetMode(targetMode)
  }

  const handleSlotDragLeave = (
    event: DragEvent<HTMLButtonElement>,
    targetMode: SaveStorageMode,
  ) => {
    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return
    setDropTargetMode((mode) => (mode === targetMode ? null : mode))
  }

  const handleSlotDrop = (event: DragEvent<HTMLButtonElement>, targetMode: SaveStorageMode) => {
    event.preventDefault()
    const sourceMode =
      parseDraggedMode(event.dataTransfer.getData(DRAFT_SLOT_DRAG_TYPE)) ?? draggingMode

    setDraggingMode(null)
    setDropTargetMode(null)

    if (!sourceMode || !canDropMode(sourceMode, targetMode)) return

    setBusy(true)
    setNotice(null)
    void copyDraftBetweenStorageModes(sourceMode, targetMode).then((error) => {
      setNotice(error ? t.draftSave.copyError : formatCopySuccess(sourceMode, targetMode))
      setBusy(false)
    })
  }

  const handleSlotDragEnd = () => {
    setDraggingMode(null)
    setDropTargetMode(null)
  }

  const handleSlotClick = (slot: SaveSlot) => {
    if (busy || syncStatus === 'loading') return
    setNotice(null)

    if (slot === 'off') {
      if (!saveEnabled) return
      pauseSaving()
      return
    }

    const mode = slot

    if (mode === 'cloud' && !user) {
      setAuthModalOpen(true)
      return
    }

    if (saveEnabled && storageMode === mode) return

    if (!saveEnabled) {
      if (mode !== storageMode) {
        setStorageMode(mode)
      }
      if (storedForMode(mode)) {
        void applySaveEnabled(true, mode)
        return
      }
      if (!storedForMode(mode) && !readSkipEnableModal(mode)) {
        openEnableModal(mode)
        return
      }
      if (readSkipEnableModal(mode)) {
        void applySaveEnabled(true, mode)
        return
      }
      return
    }

    handleModeChange(mode)
  }

  const slots: SaveSlot[] = ['off', 'local', 'cloud']

  const renderNumberSetGroup = (mode: SaveStorageMode, label: string) => {
    const groupSets = mode === 'local' ? localNumberSets : cloudNumberSets
    if (groupSets.length === 0) return null
    const countLabel = isPro
      ? String(groupSets.length)
      : `${groupSets.length} / ${numberSetLimits[mode]}`

    return (
      <div className="draft-number-set-menu__group">
        <div className="draft-number-set-menu__group-label">
          <span className="draft-number-set-menu__group-glyph" aria-hidden="true">
            <StorageGlyph mode={mode} />
          </span>
          <span>{label}</span>
          <span className="draft-number-set-menu__group-count">{countLabel}</span>
        </div>
        {mode === 'local' && (
          <p className="draft-number-set-menu__storage-note" role="note">
            <InfoGlyph />
            <span>{t.draftSave.localDataLossNote}</span>
          </p>
        )}
        {groupSets.map((numberSet) => {
          const active = saveEnabled && storageMode === mode && activeNumberSetId === numberSet.id
          const { side, sideLabel, equityText, leverageText } = describeNumberSet(numberSet)
          return (
            <div
              key={`${mode}:${numberSet.id}`}
              className={`draft-number-set-menu__item${
                active ? ' draft-number-set-menu__item--active' : ''
              }${mode === 'cloud' ? ' draft-number-set-menu__item--memo' : ''}`}
              role="menuitemradio"
              tabIndex={0}
              aria-checked={active}
              onClick={() => handleNumberSetSelect(numberSet.storageMode, numberSet.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleNumberSetSelect(numberSet.storageMode, numberSet.id)
                }
              }}
            >
              <span
                className={`draft-number-set-menu__side-dot draft-number-set-menu__side-dot--${side}`}
                aria-hidden="true"
              />
              <span className="draft-number-set-menu__copy">
                <strong>{numberSet.title}</strong>
                <span className="draft-number-set-menu__sr-side">{sideLabel}</span>
              </span>
              <span className="draft-number-set-menu__stats">
                <span className="draft-number-set-menu__equity">{equityText ?? ''}</span>
                <span className="draft-number-set-menu__stats-dot" aria-hidden="true">
                  {equityText != null && leverageText != null ? '·' : ''}
                </span>
                <span className="draft-number-set-menu__leverage">{leverageText ?? ''}</span>
              </span>
              {mode === 'cloud' && (
                <MemoButton
                  memo={numberSet.memo}
                  label={`${numberSet.title} ${numberSet.memo ? t.accountRecords.memoEdit : t.accountRecords.memoAdd}`}
                  onClick={() => setMemoSetId(numberSet.id)}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const numberSetMenu =
    numberSetMenuOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={numberSetMenuRef}
            className="draft-number-set-menu"
            role="menu"
            style={numberSetMenuStyle ?? undefined}
          >
            <div className="draft-number-set-menu__head">
              <span>{t.draftSave.numberSetMenuTitle}</span>
              <span className="draft-number-set-menu__total">{menuNumberSets.length}</span>
            </div>
            {menuNumberSets.length === 0 ? (
              <div className="draft-number-set-menu__empty">
                <span className="draft-number-set-menu__empty-tile" aria-hidden="true">
                  <NumberSetStackIcon />
                </span>
                <strong>{t.draftSave.numberSetEmptyTitle}</strong>
                <span>{t.draftSave.numberSetEmptyBody}</span>
                {storageMode === 'local' && (
                  <p
                    className="draft-number-set-menu__storage-note draft-number-set-menu__storage-note--empty"
                    role="note"
                  >
                    <InfoGlyph />
                    <span>{t.draftSave.localDataLossNote}</span>
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-primary draft-number-set-menu__empty-cta"
                  disabled={busy}
                  onClick={handleNumberSetAdd}
                >
                  <PlusIcon />
                  {t.draftSave.numberSetEmptyCta}
                </button>
              </div>
            ) : (
              <>
                {renderNumberSetGroup('local', t.draftSave.localMode)}
                {renderNumberSetGroup('cloud', t.draftSave.cloudMode)}
                {!isPro && (
                  <div className="draft-number-set-menu__limit-hint">
                    <span className="draft-number-set-menu__limit-glyph" aria-hidden="true">
                      <LockGlyph />
                    </span>
                    <span>{t.draftSave.numberSetLimitHint}</span>
                  </div>
                )}
                <div className="draft-number-set-menu__actions">
                  <button
                    type="button"
                    className={`btn btn-ghost draft-number-set-menu__add${
                      addGateMode ? ' draft-number-set-menu__add--gated' : ''
                    }`}
                    disabled={busy}
                    onClick={handleNumberSetAdd}
                  >
                    <PlusIcon />
                    {t.draftSave.numberSetAdd}
                    {addGatedByPlan && (
                      <span className="draft-number-set-menu__pro-badge">PRO</span>
                    )}
                  </button>
                  <a
                    className="btn btn-ghost"
                    href={`${MY_PAGE_PATH}#my-page-preferences`}
                    onClick={() => setNumberSetMenuOpen(false)}
                  >
                    {t.draftSave.numberSetManage}
                  </a>
                </div>
              </>
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="draft-save">
        <div className="draft-save-row">
          <div
            ref={slotsRowRef}
            className="draft-save-slots"
            role="group"
            aria-label={t.draftSave.storageModeLabel}
          >
            {slots.map((slot) => {
              if (slot === 'off') {
                const active = !saveEnabled
                const className = [
                  'draft-save-slot',
                  'draft-save-slot--off',
                  active ? 'draft-save-slot--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key="off"
                    type="button"
                    className={className}
                    aria-pressed={active}
                    aria-label={t.draftSave.noSaveMode}
                    title={t.draftSave.noSaveMode}
                    disabled={busy || syncStatus === 'loading'}
                    onClick={() => handleSlotClick('off')}
                  >
                    <OffIcon />
                    <span className="draft-save-slot__sr-label">{t.draftSave.noSaveMode}</span>
                  </button>
                )
              }

              const mode = slot
              const stored = mode === 'local' ? hasLocalDraft : hasCloudDraft
              const active = saveEnabled && storageMode === mode
              const modeLabel =
                mode === 'local'
                  ? t.draftSave.localMode
                  : user
                    ? t.draftSave.cloudMode
                    : t.draftSave.cloudLoginRequired
              const modeClass =
                mode === 'local' ? 'draft-save-slot--local' : 'draft-save-slot--cloud'
              const className = [
                'draft-save-slot',
                modeClass,
                stored ? 'draft-save-slot--stored' : '',
                active ? 'draft-save-slot--active' : '',
                canDragMode(mode) ? 'draft-save-slot--draggable' : '',
                draggingMode === mode ? 'draft-save-slot--dragging' : '',
                dropTargetMode === mode ? 'draft-save-slot--drop-target' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={mode}
                  type="button"
                  className={className}
                  aria-pressed={active}
                  aria-label={modeLabel}
                  title={modeLabel}
                  draggable={canDragMode(mode)}
                  disabled={busy || syncStatus === 'loading'}
                  onClick={() => handleSlotClick(mode)}
                  onDragStart={(event) => handleSlotDragStart(event, mode)}
                  onDragOver={(event) => handleSlotDragOver(event, mode)}
                  onDragLeave={(event) => handleSlotDragLeave(event, mode)}
                  onDrop={(event) => handleSlotDrop(event, mode)}
                  onDragEnd={handleSlotDragEnd}
                >
                  {mode === 'local' ? <LocalComputerIcon /> : <CloudIcon />}
                  <span className="draft-save-slot__sr-label">{modeLabel}</span>
                </button>
              )
            })}
            <span className="draft-save-slots__divider" aria-hidden="true" />
            <button
              ref={numberSetPickerRef}
              type="button"
              className="draft-save-slot draft-number-set-picker"
              aria-label={t.draftSave.numberSetPickerLabel}
              aria-haspopup="menu"
              aria-expanded={numberSetMenuOpen}
              disabled={busy || syncStatus === 'loading'}
              onClick={() => setNumberSetMenuOpen((open) => !open)}
            >
              <NumberSetStackIcon />
              <span className="draft-save-slot__sr-label">
                {t.draftSave.numberSetPickerLabel}
              </span>
            </button>
            <span
              ref={helpAnchorRef as RefObject<HTMLSpanElement>}
              className="field-label-tooltip-anchor draft-save-slots__help"
              {...helpAnchorHandlers}
              {...helpFocusWithinHandlers}
            >
              <button
                type="button"
                className="field-label-tooltip-trigger"
                aria-label={t.draftSave.helpHintLabel}
                aria-describedby={helpTooltipId}
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
              >
                ?
              </button>
              {renderHelpTooltip(
                'draft-save-tooltip',
                <TooltipBody text={t.draftSave.helpHint} />,
                { id: helpTooltipId },
              )}
            </span>
          </div>
          {saveEnabled && statusText && (
            <span className={`draft-save-status draft-save-status--${syncStatus}`}>
              <span className="draft-save-status__check" aria-hidden="true">
                {showSavedCheck ? '✓' : ''}
              </span>
              <span className="draft-save-status__time">{statusText}</span>
            </span>
          )}
        </div>
        {notice && (
          <span
            className={`draft-save-notice${
              syncStatus === 'error' ? ' draft-save-notice--error' : ''
            }`}
          >
            {notice}
          </span>
        )}
        {skipActive && (
          <button type="button" className="link-btn draft-save-show-guide" onClick={showGuideAgain}>
            {t.draftSave.showGuideAgain}
          </button>
        )}
      </div>
      {numberSetMenu}
      {memoSetId && (() => {
        const numberSet = cloudNumberSets.find((set) => set.id === memoSetId)
        if (!numberSet) return null
        return (
          <MemoEditorWindow
            key={`${numberSet.storageMode}:${numberSet.id}`}
            title={`${numberSet.title} · ${t.accountRecords.memoNumberSetTitle}`}
            initialMemo={numberSet.memo}
            onSave={(memo) => setNumberSetMemo('cloud', numberSet.id, memo)}
            onClose={() => setMemoSetId(null)}
          />
        )
      })()}

      {modal === 'enable' && (
        <DraftSaveModal
          title={enableTitle}
          confirmLabel={t.draftSave.enableConfirm}
          onConfirm={confirmEnable}
          onDismiss={cancelEnable}
          footer={
            <label className="draft-save-skip">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              <span>{t.draftSave.skipModalLabel}</span>
            </label>
          }
        >
          <EnableModalBody lines={enableBody} />
        </DraftSaveModal>
      )}

      {modal === 'enable-info' && (
        <DraftSaveModal
          title={enableTitle}
          confirmLabel={t.draftSave.confirm}
          onConfirm={() => setModal(null)}
          onDismiss={() => setModal(null)}
        >
          <EnableModalBody lines={enableBody} />
        </DraftSaveModal>
      )}

      {gateMode && (
        <Suspense fallback={null}>
          <SnapshotProGateModal
            mode={gateMode}
            copy={{
              eyebrow: t.accountRecords.snapshotGateEyebrow,
              title:
                gateMode === 'guest'
                  ? t.draftSave.numberSetGateGuestTitle
                  : t.draftSave.numberSetGateFreeTitle,
              guestBody: t.draftSave.numberSetGateGuestBody,
              freeBody: t.draftSave.numberSetGateFreeBody,
              loginCta: t.draftSave.numberSetGateLoginCta,
              viewPlansCta: t.draftSave.numberSetGateViewPlansCta,
              upgradeCta: t.draftSave.numberSetGateUpgradeCta,
              close: t.close,
              benefits: t.myPage.billing.page.benefits.slice(0, 3),
            }}
            restoreFocusRef={numberSetPickerRef}
            onClose={() => setGateMode(null)}
            onLogin={() => {
              setGateMode(null)
              setAuthModalOpen(true)
            }}
            onUpgrade={() => {
              setGateMode(null)
              navigate(BILLING_PATH)
            }}
          />
        </Suspense>
      )}

      {authModalOpen && (
        <Suspense fallback={null}>
          <AuthModal onClose={() => setAuthModalOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
