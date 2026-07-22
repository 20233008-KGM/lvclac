import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n'

export type MemoSaveState = 'saved' | 'saving' | 'error'

export interface MemoEditorHandle {
  save: () => Promise<boolean>
}

export function MemoIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5.5 3.75h9.25l3.75 3.75v12.75h-13z"
        fill={filled ? 'currentColor' : 'none'}
      />
      <path d="M14.75 3.75V7.5h3.75M8.5 11h7M8.5 14h7M8.5 17h4.5" />
    </svg>
  )
}

export function MemoButton({
  memo,
  label,
  onClick,
  className = '',
}: {
  memo: string | null | undefined
  label: string
  onClick: () => void
  className?: string
}) {
  const filled = Boolean(memo?.trim())
  return (
    <button
      type="button"
      className={`memo-note-button ${filled ? 'memo-note-button--filled' : 'memo-note-button--empty'} ${className}`.trim()}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    >
      <MemoIcon filled={filled} />
    </button>
  )
}

function useMemoAutosave(
  initialMemo: string | null | undefined,
  onSave: (memo: string) => Promise<string | null>,
) {
  const [value, setValue] = useState(initialMemo ?? '')
  const [saveState, setSaveState] = useState<MemoSaveState>('saved')
  const valueRef = useRef(value)
  const savedValueRef = useRef(initialMemo ?? '')
  const saveTimerRef = useRef<number | null>(null)
  const generationRef = useRef(0)

  const save = async (nextValue = valueRef.current) => {
    if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = null
    if (nextValue === savedValueRef.current) {
      setSaveState('saved')
      return true
    }
    const generation = generationRef.current + 1
    generationRef.current = generation
    setSaveState('saving')
    const error = await onSave(nextValue)
    if (generationRef.current !== generation) return false
    if (error) {
      setSaveState('error')
      return false
    }
    savedValueRef.current = nextValue
    setSaveState('saved')
    return true
  }

  useEffect(() => {
    saveTimerRef.current = window.setTimeout(() => {
      void save(value)
    }, 400)
    return () => {
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current)
    }
    // onSave is intentionally consumed by save; callers should keep it stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const updateValue = (nextValue: string) => {
    generationRef.current += 1
    valueRef.current = nextValue
    setValue(nextValue)
    setSaveState('saving')
  }

  return { value, saveState, save, updateValue }
}

function memoStatusText(
  saveState: MemoSaveState,
  value: string,
  copy: ReturnType<typeof useLanguage>['t']['accountRecords'],
) {
  return saveState === 'saving'
    ? copy.memoSaving
    : saveState === 'error'
      ? copy.memoSaveError
      : value.trim()
        ? copy.memoSaved
        : copy.memoEmptySaved
}

export const MemoWorkspaceEditor = forwardRef<
  MemoEditorHandle,
  {
    title: string
    initialMemo?: string | null
    onSave: (memo: string) => Promise<string | null>
    returnLabel?: string
    onReturn?: () => void
  }
>(function MemoWorkspaceEditor(
  { title, initialMemo, onSave, returnLabel, onReturn },
  ref,
) {
  const { t } = useLanguage()
  const { value, saveState, save, updateValue } = useMemoAutosave(initialMemo, onSave)

  useImperativeHandle(ref, () => ({ save }), [save])

  return (
    <section className="records-memo-editor" aria-label={title}>
      <header className="records-memo-editor__head">
        <div className="records-memo-editor__title">
          <MemoIcon filled={Boolean(value.trim())} />
          <strong>{title}</strong>
        </div>
        {onReturn && returnLabel && (
          <button type="button" className="link-btn records-memo-editor__return" onClick={onReturn}>
            {returnLabel}
          </button>
        )}
      </header>
      <span className={`records-memo-editor__status records-memo-editor__status--${saveState}`} role="status">
        {memoStatusText(saveState, value, t.accountRecords)}
      </span>
      <textarea
        className="records-memo-editor__textarea"
        maxLength={500}
        rows={12}
        value={value}
        placeholder={t.accountRecords.memoPlaceholder}
        onChange={(event) => updateValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault()
            void save()
          }
        }}
      />
      <footer className="records-memo-editor__foot">
        <span>{value.length} / 500</span>
        <span>{t.accountRecords.memoAutoSaveHint}</span>
      </footer>
    </section>
  )
})

export function MemoEditorWindow({
  title,
  initialMemo,
  onSave,
  onClose,
}: {
  title: string
  initialMemo?: string | null
  onSave: (memo: string) => Promise<string | null>
  onClose: () => void
}) {
  const { t } = useLanguage()
  const { value, saveState, save, updateValue } = useMemoAutosave(initialMemo, onSave)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const panelRef = useRef<HTMLElement>(null)
  const dragRef = useRef<{ pointerId: number; dx: number; dy: number } | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void save().then((saved) => {
          if (saved) onClose()
        })
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        void save()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 || window.matchMedia('(max-width: 720px)').matches) return
    const panel = panelRef.current
    if (!panel || (event.target as HTMLElement).closest('button')) return
    const rect = panel.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    panel.classList.add('is-dragging')
    event.preventDefault()
  }

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    const panel = panelRef.current
    if (!drag || drag.pointerId !== event.pointerId || !panel) return
    const rect = panel.getBoundingClientRect()
    setPosition({
      x: Math.max(12, Math.min(window.innerWidth - rect.width - 12, event.clientX - drag.dx)),
      y: Math.max(12, Math.min(window.innerHeight - rect.height - 12, event.clientY - drag.dy)),
    })
  }

  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    dragRef.current = null
    panelRef.current?.classList.remove('is-dragging')
  }

  const statusText = memoStatusText(saveState, value, t.accountRecords)

  return createPortal(
    <section
      ref={panelRef}
      className="memo-editor-window"
      role="dialog"
      aria-label={title}
      style={position ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined}
    >
      <header
        className="memo-editor-window__head"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <div className="memo-editor-window__title">
          <MemoIcon />
          <strong>{title}</strong>
        </div>
        <span className={`memo-editor-window__status memo-editor-window__status--${saveState}`}>
          {statusText}
        </span>
        <button
          type="button"
          className="memo-editor-window__close"
          aria-label={t.accountRecords.memoClose}
          title={t.accountRecords.memoClose}
          onClick={() =>
            void save().then((saved) => {
              if (saved) onClose()
            })
          }
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </header>
      <textarea
        autoFocus
        className="memo-editor-window__textarea"
        maxLength={500}
        rows={3}
        value={value}
        placeholder={t.accountRecords.memoPlaceholder}
        onChange={(event) => updateValue(event.target.value)}
      />
      <footer className="memo-editor-window__foot">
        <span>{value.length} / 500</span>
        <span>{t.accountRecords.memoAutoSaveHint}</span>
      </footer>
    </section>,
    document.body,
  )
}
