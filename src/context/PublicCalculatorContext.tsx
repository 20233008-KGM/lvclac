import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { applyInputPatch, type CalculatorInputPatch } from '../calc/mtmLink'
import {
  createCalculatorHistory,
  getCalculatorHistoryMoves,
  jumpCalculatorHistory,
  recordCalculatorHistory,
  redoCalculatorHistory,
  replaceCalculatorHistory,
  undoCalculatorHistory,
  type CalculatorHistoryDirection,
  type CalculatorHistoryMove,
  type CalculatorHistoryOptions,
} from './calculatorHistory'
import { defaultInputs, type CalculatorInputs } from '../types'
import {
  loadLocalNumberSets,
  resolveActiveLocalNumberSetId,
} from '../storage/localNumberSets'
import {
  hasMeaningfulCalculatorInputs,
  parseStoredCalculatorInputs,
} from '../utils/storedCalculatorInputs'

const DRAFT_KEY = 'leverage_calculator_draft'
const DRAFT_SAVED_AT_KEY = 'leverage_calculator_draft_saved_at'
const SAVE_ENABLED_KEY = 'leverage_save_enabled'
const PUBLIC_DRAFT_MIGRATED_KEY = 'leverage_public_draft_migrated_v1'

export type PublicSaveSyncStatus = 'idle' | 'saving' | 'saved' | 'error'

interface PublicCalculatorContextValue {
  inputs: CalculatorInputs
  updateInputs: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
  undoInputs: () => void
  redoInputs: () => void
  canUndo: boolean
  canRedo: boolean
  undoHistory: CalculatorHistoryMove[]
  redoHistory: CalculatorHistoryMove[]
  jumpHistory: (direction: CalculatorHistoryDirection, steps: number) => void
  resetInputs: () => void
  saveEnabled: boolean
  syncStatus: PublicSaveSyncStatus
  syncError: string | null
  hasLocalDraft: boolean
  localDraftSavedAt: string | null
  setSaveEnabled: (enabled: boolean, mode?: 'local') => Promise<string | null>
  pauseSaving: () => void
  deleteSavedData: () => Promise<string | null>
}

const PublicCalculatorContext = createContext<PublicCalculatorContextValue | null>(null)

function readLegacyDraft(): CalculatorInputs | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = parseStoredCalculatorInputs(JSON.parse(raw))
    return parsed && hasMeaningfulCalculatorInputs(parsed) ? parsed : null
  } catch {
    return null
  }
}

function readActiveLocalSetDraft(): { inputs: CalculatorInputs; updatedAt: string } | null {
  try {
    const legacyDraft = readLegacyDraft()
    const legacySavedAt = localStorage.getItem(DRAFT_SAVED_AT_KEY)
    const sets = loadLocalNumberSets(localStorage, legacyDraft, legacySavedAt).sets
    const activeId = resolveActiveLocalNumberSetId(localStorage, sets)
    const active = sets.find((set) => set.id === activeId) ?? sets[0]
    return active ? { inputs: active.inputs, updatedAt: active.updatedAt } : null
  } catch {
    return null
  }
}

function readInitialDraft(): { inputs: CalculatorInputs; updatedAt: string | null } | null {
  try {
    if (localStorage.getItem(PUBLIC_DRAFT_MIGRATED_KEY) === '1') {
      const legacy = readLegacyDraft()
      return legacy
        ? { inputs: legacy, updatedAt: localStorage.getItem(DRAFT_SAVED_AT_KEY) }
        : null
    }
  } catch {
    // Continue with the compatibility migration.
  }

  const active = readActiveLocalSetDraft()
  if (active) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(active.inputs))
      localStorage.setItem(DRAFT_SAVED_AT_KEY, active.updatedAt)
      localStorage.setItem(PUBLIC_DRAFT_MIGRATED_KEY, '1')
    } catch {
      // The in-memory value can still be restored for this session.
    }
    return active
  }

  const legacy = readLegacyDraft()
  if (!legacy) return null
  try {
    localStorage.setItem(PUBLIC_DRAFT_MIGRATED_KEY, '1')
    return { inputs: legacy, updatedAt: localStorage.getItem(DRAFT_SAVED_AT_KEY) }
  } catch {
    return { inputs: legacy, updatedAt: null }
  }
}

function readInitialSaveEnabled(hasDraft: boolean): boolean {
  try {
    const stored = localStorage.getItem(SAVE_ENABLED_KEY)
    if (stored === '0') return false
    if (stored === '1') return true
  } catch {
    // Fall back to the presence of a restored draft.
  }
  return hasDraft
}

function persistDraft(inputs: CalculatorInputs): string | null {
  try {
    const savedAt = new Date().toISOString()
    localStorage.setItem(DRAFT_KEY, JSON.stringify(inputs))
    localStorage.setItem(DRAFT_SAVED_AT_KEY, savedAt)
    localStorage.setItem(SAVE_ENABLED_KEY, '1')
    localStorage.setItem(PUBLIC_DRAFT_MIGRATED_KEY, '1')
    return savedAt
  } catch {
    return null
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(DRAFT_SAVED_AT_KEY)
    localStorage.setItem(SAVE_ENABLED_KEY, '0')
  } catch {
    // Private browsing or quota failures are surfaced through the state transition.
  }
}

export function PublicCalculatorProvider({ children }: { children: ReactNode }) {
  const [initialDraft] = useState(readInitialDraft)
  const [history, setHistory] = useState(() =>
    createCalculatorHistory(initialDraft?.inputs ?? defaultInputs),
  )
  const [saveEnabled, setSaveEnabledState] = useState(() =>
    readInitialSaveEnabled(initialDraft != null),
  )
  const [syncStatus, setSyncStatus] = useState<PublicSaveSyncStatus>(() =>
    initialDraft ? 'saved' : 'idle',
  )
  const [syncError, setSyncError] = useState<string | null>(null)
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<string | null>(
    initialDraft?.updatedAt ?? null,
  )
  const [hasLocalDraft, setHasLocalDraft] = useState(() => initialDraft != null)
  const firstPersistRef = useRef(true)
  const inputs = history.present
  const historyMoves = getCalculatorHistoryMoves(history)

  const updateInputs = useCallback(
    (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => {
      setHistory((current) =>
        recordCalculatorHistory(current, applyInputPatch(current.present, patch), options),
      )
    },
    [],
  )

  const undoInputs = useCallback(() => {
    setHistory((current) => undoCalculatorHistory(current))
  }, [])

  const redoInputs = useCallback(() => {
    setHistory((current) => redoCalculatorHistory(current))
  }, [])

  const jumpHistory = useCallback(
    (direction: CalculatorHistoryDirection, steps: number) => {
      setHistory((current) => jumpCalculatorHistory(current, direction, steps))
    },
    [],
  )

  const resetInputs = useCallback(() => {
    setHistory((current) => replaceCalculatorHistory(current, defaultInputs))
    clearDraft()
    setSaveEnabledState(false)
    setHasLocalDraft(false)
    setLocalDraftSavedAt(null)
    setSyncStatus('idle')
    setSyncError(null)
  }, [])

  const setSaveEnabled = useCallback(
    async (enabled: boolean): Promise<string | null> => {
      setSyncError(null)
      setSaveEnabledState(enabled)
      try {
        localStorage.setItem(SAVE_ENABLED_KEY, enabled ? '1' : '0')
      } catch {
        setSyncStatus('error')
        setSyncError('local_draft_save_failed')
        return 'local_draft_save_failed'
      }

      if (!enabled) {
        setSyncStatus(hasLocalDraft ? 'saved' : 'idle')
        return null
      }

      setSyncStatus('saving')
      const savedAt = persistDraft(inputs)
      if (!savedAt) {
        setSyncStatus('error')
        setSyncError('local_draft_save_failed')
        return 'local_draft_save_failed'
      }
      setHasLocalDraft(true)
      setLocalDraftSavedAt(savedAt)
      setSyncStatus('saved')
      return null
    },
    [hasLocalDraft, inputs],
  )

  const pauseSaving = useCallback(() => {
    setSaveEnabledState(false)
    try {
      localStorage.setItem(SAVE_ENABLED_KEY, '0')
    } catch {
      // Ignore storage failures; the current session still stops saving.
    }
    setSyncStatus(hasLocalDraft ? 'saved' : 'idle')
  }, [hasLocalDraft])

  const deleteSavedData = useCallback(async (): Promise<string | null> => {
    clearDraft()
    setSaveEnabledState(false)
    setHasLocalDraft(false)
    setLocalDraftSavedAt(null)
    setSyncStatus('idle')
    setSyncError(null)
    return null
  }, [])

  useEffect(() => {
    if (firstPersistRef.current) {
      firstPersistRef.current = false
      return
    }
    if (!saveEnabled) return

    const statusTimer = window.setTimeout(() => {
      setSyncStatus('saving')
      setSyncError(null)
    }, 0)
    const timer = window.setTimeout(() => {
      const savedAt = persistDraft(inputs)
      if (!savedAt) {
        setSyncStatus('error')
        setSyncError('local_draft_save_failed')
        return
      }
      setHasLocalDraft(true)
      setLocalDraftSavedAt(savedAt)
      setSyncStatus('saved')
    }, 500)

    return () => {
      window.clearTimeout(statusTimer)
      window.clearTimeout(timer)
    }
  }, [inputs, saveEnabled])

  const value = useMemo<PublicCalculatorContextValue>(
    () => ({
      inputs,
      updateInputs,
      undoInputs,
      redoInputs,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      undoHistory: historyMoves.undo,
      redoHistory: historyMoves.redo,
      jumpHistory,
      resetInputs,
      saveEnabled,
      syncStatus,
      syncError,
      hasLocalDraft,
      localDraftSavedAt,
      setSaveEnabled,
      pauseSaving,
      deleteSavedData,
    }),
    [
      deleteSavedData,
      hasLocalDraft,
      history.canRedo,
      history.canUndo,
      historyMoves.redo,
      historyMoves.undo,
      inputs,
      jumpHistory,
      localDraftSavedAt,
      pauseSaving,
      redoInputs,
      resetInputs,
      saveEnabled,
      setSaveEnabled,
      syncError,
      syncStatus,
      undoInputs,
      updateInputs,
    ],
  )

  return (
    <PublicCalculatorContext.Provider value={value}>
      {children}
    </PublicCalculatorContext.Provider>
  )
}

export function usePublicCalculator(): PublicCalculatorContextValue {
  const context = useContext(PublicCalculatorContext)
  if (!context) {
    throw new Error('usePublicCalculator must be used within PublicCalculatorProvider')
  }
  return context
}
