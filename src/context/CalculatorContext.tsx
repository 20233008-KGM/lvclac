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
import { applyInputPatch, hasOrderApplyUndo, type CalculatorInputPatch } from '../calc/mtmLink'
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
import { consumeOrderHistoryUndo } from './orderHistoryUndoSync'
import { createAccountRecordsRepository } from '../db/accountRecords'
import { defaultInputs, type CalculatorInputs } from '../types'
import { useAuth } from './AuthContext'
import {
  deleteNumberSet,
  fetchLatestNumberSet,
  saveNumberSet,
} from '../db/numberSets'
import {
  hasMeaningfulCalculatorInputs,
  parseStoredCalculatorInputs,
} from '../utils/storedCalculatorInputs'

const DRAFT_KEY = 'leverage_calculator_draft'
const DRAFT_SAVED_AT_KEY = 'leverage_calculator_draft_saved_at'
const SAVE_ENABLED_KEY = 'leverage_save_enabled'
const SAVE_STORAGE_MODE_KEY = 'leverage_save_storage_mode'

export type SaveStorageMode = 'local' | 'cloud'
export type SaveSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface CalculatorContextValue {
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
  storageMode: SaveStorageMode
  cloudAvailable: boolean
  syncStatus: SaveSyncStatus
  syncError: string | null
  hasLocalDraft: boolean
  hasCloudDraft: boolean
  localDraftSavedAt: string | null
  cloudDraftSavedAt: string | null
  canMigrateLocalDraft: boolean
  setSaveEnabled: (enabled: boolean, mode?: SaveStorageMode) => Promise<string | null>
  pauseSaving: () => void
  deleteSavedData: (mode: SaveStorageMode) => Promise<string | null>
  setStorageMode: (mode: SaveStorageMode) => void
  migrateLocalDraftToCloud: () => Promise<string | null>
  copyDraftBetweenStorageModes: (source: SaveStorageMode, target: SaveStorageMode) => Promise<string | null>
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null)

function readSaveEnabled(): boolean {
  try {
    const flag = localStorage.getItem(SAVE_ENABLED_KEY)
    if (flag === '0') return false
    if (flag === '1') return true
    return false
  } catch {
    return false
  }
}

function writeSaveEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SAVE_ENABLED_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

function readStorageMode(): SaveStorageMode {
  try {
    return localStorage.getItem(SAVE_STORAGE_MODE_KEY) === 'cloud' ? 'cloud' : 'local'
  } catch {
    return 'local'
  }
}

function writeStorageMode(mode: SaveStorageMode): void {
  try {
    localStorage.setItem(SAVE_STORAGE_MODE_KEY, mode)
  } catch {
    // ignore
  }
}

function loadDraft(): CalculatorInputs | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = parseStoredCalculatorInputs(JSON.parse(raw))
    return draft && hasMeaningfulCalculatorInputs(draft) ? draft : null
  } catch {
    return null
  }
}

function readDraftSavedAt(): string | null {
  try {
    return localStorage.getItem(DRAFT_SAVED_AT_KEY)
  } catch {
    return null
  }
}

function saveDraft(inputs: CalculatorInputs): string | null {
  try {
    const savedAt = new Date().toISOString()
    localStorage.setItem(DRAFT_KEY, JSON.stringify(inputs))
    localStorage.setItem(DRAFT_SAVED_AT_KEY, savedAt)
    return savedAt
  } catch {
    // quota exceeded or private mode — ignore
    return null
  }
}

function isSameAsStoredDraft(value: CalculatorInputs): boolean {
  const stored = loadDraft()
  if (!stored) return false
  const normalizedValue = parseStoredCalculatorInputs(value)
  return normalizedValue != null && JSON.stringify(normalizedValue) === JSON.stringify(stored)
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
    localStorage.removeItem(DRAFT_SAVED_AT_KEY)
  } catch {
    // ignore
  }
}

function hasStoredDraft(): boolean {
  return loadDraft() != null
}

function getInitialInputs(saveEnabled: boolean): CalculatorInputs {
  return saveEnabled ? loadDraft() ?? defaultInputs : defaultInputs
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const activeUserId = user?.id ?? null
  const cloudAvailable = Boolean(activeUserId)
  const [storageModeState, setStorageModeState] = useState(readStorageMode)
  const storageMode: SaveStorageMode =
    cloudAvailable && storageModeState === 'cloud' ? 'cloud' : 'local'
  const [saveEnabled, setSaveEnabledState] = useState(readSaveEnabled)
  const [history, setHistory] = useState(() =>
    createCalculatorHistory(getInitialInputs(readSaveEnabled())),
  )
  const inputs = history.present
  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [cloudSetId, setCloudSetId] = useState<string | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(hasStoredDraft)
  const [hasCloudDraft, setHasCloudDraft] = useState(false)
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState(readDraftSavedAt)
  const [cloudDraftSavedAt, setCloudDraftSavedAt] = useState<string | null>(null)
  const cloudSetIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)
  const suppressNextPersistRef = useRef(false)
  const recordsRepository = useMemo(() => createAccountRecordsRepository(), [])

  const deleteOrderHistoryOnUndo = useCallback(() => {
    const id = consumeOrderHistoryUndo()
    if (!id || !activeUserId || !user?.autoSaveOrderHistory) return

    void recordsRepository.deleteOrderHistory(activeUserId, id).then((result) => {
      if (result.error) {
        console.error('[orderHistory] undo delete failed:', result.error)
      }
    })
  }, [activeUserId, recordsRepository, user?.autoSaveOrderHistory])

  useEffect(() => {
    cloudSetIdRef.current = cloudSetId
  }, [cloudSetId])

  const updateInputs = useCallback((
    patch: CalculatorInputPatch,
    options?: CalculatorHistoryOptions,
  ) => {
    setHistory((prev) => {
      const nextInputs = applyInputPatch(prev.present, patch)
      return recordCalculatorHistory(prev, nextInputs, options)
    })
  }, [])

  const resetInputs = useCallback(() => {
    setHistory((prev) => recordCalculatorHistory(prev, { ...defaultInputs }))
  }, [])

  const replaceInputsFromStorage = useCallback((nextInputs: CalculatorInputs) => {
    suppressNextPersistRef.current = true
    setHistory((prev) => replaceCalculatorHistory(prev, { ...nextInputs }))
  }, [])

  const undoInputs = useCallback(() => {
    setHistory((prev) => {
      if (hasOrderApplyUndo(prev.present)) {
        deleteOrderHistoryOnUndo()
      }
      return undoCalculatorHistory(prev)
    })
  }, [deleteOrderHistoryOnUndo])

  const redoInputs = useCallback(() => {
    setHistory((prev) => redoCalculatorHistory(prev))
  }, [])

  const jumpHistory = useCallback((direction: CalculatorHistoryDirection, steps: number) => {
    const count = Math.max(0, Math.floor(steps))
    setHistory((prev) => {
      if (direction === 'undo') {
        let probe = prev
        for (let i = 0; i < count; i += 1) {
          if (!probe.canUndo) break
          if (hasOrderApplyUndo(probe.present)) {
            deleteOrderHistoryOnUndo()
          }
          probe = undoCalculatorHistory(probe)
        }
      }
      return jumpCalculatorHistory(prev, direction, count)
    })
  }, [deleteOrderHistoryOnUndo])

  const historyMoves = getCalculatorHistoryMoves(history)

  const persistInputs = useCallback(
    async (
      value: CalculatorInputs,
      force = false,
      mode: SaveStorageMode = storageMode,
    ): Promise<string | null> => {
      if (!force && !saveEnabled) return null

      if (!hasMeaningfulCalculatorInputs(value)) {
        if (mode === 'local') {
          clearDraft()
          setHasLocalDraft(false)
          setLocalDraftSavedAt(null)
          setSyncStatus('idle')
          setSyncError(null)
          return null
        }

        if (!activeUserId) {
          setSyncStatus('idle')
          setSyncError(null)
          setHasCloudDraft(false)
          setCloudDraftSavedAt(null)
          return null
        }

        setSyncStatus('saving')
        setSyncError(null)
        const result = await deleteNumberSet(activeUserId, cloudSetIdRef.current)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
        setSyncStatus('idle')
        return null
      }

      if (mode === 'local') {
        if (isSameAsStoredDraft(value)) {
          setHasLocalDraft(true)
          setSyncStatus('saved')
          setSyncError(null)
          return null
        }
        const savedAt = saveDraft(value)
        if (!savedAt) {
          setSyncStatus('error')
          setSyncError('local_draft_save_failed')
          return 'local_draft_save_failed'
        }
        setHasLocalDraft(true)
        setLocalDraftSavedAt(savedAt)
        setSyncStatus('saved')
        setSyncError(null)
        return null
      }

      setSyncStatus('saving')
      setSyncError(null)
      if (!activeUserId) {
        setSyncStatus('error')
        setSyncError('not_logged_in')
        return 'not_logged_in'
      }
      const result = await saveNumberSet(activeUserId, value, cloudSetIdRef.current)
      if (result.error) {
        setSyncStatus('error')
        setSyncError(result.error)
        return result.error
      }
      if (!result.data) {
        setSyncStatus('error')
        setSyncError('number_set_save_empty')
        return 'number_set_save_empty'
      }
      setCloudSetId(result.data.id)
      setHasCloudDraft(true)
      setCloudDraftSavedAt(result.data.updatedAt)
      setSyncStatus('saved')
      return null
    },
    [activeUserId, saveEnabled, storageMode],
  )

  const setSaveEnabled = useCallback(
    async (enabled: boolean, mode: SaveStorageMode = storageMode): Promise<string | null> => {
      setSaveEnabledState(enabled)
      writeSaveEnabled(enabled)
      setSyncError(null)

      if (!enabled) {
        if (mode === 'local') {
          clearDraft()
          setHasLocalDraft(false)
          setLocalDraftSavedAt(null)
        } else if (activeUserId) {
          setSyncStatus('saving')
          const result = await deleteNumberSet(activeUserId, cloudSetIdRef.current)
          if (result.error) {
            setSyncStatus('error')
            setSyncError(result.error)
            return result.error
          }
          setCloudSetId(null)
          setHasCloudDraft(false)
          setCloudDraftSavedAt(null)
        }

        setSyncStatus('idle')
        return null
      }

      if (mode === 'local') {
        const draft = loadDraft()
        if (draft) {
          replaceInputsFromStorage(draft)
          setHasLocalDraft(true)
          setLocalDraftSavedAt(readDraftSavedAt())
          setSyncStatus('saved')
          return null
        }
      } else if (activeUserId) {
        setSyncStatus('loading')
        const result = await fetchLatestNumberSet(activeUserId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        if (result.data && hasMeaningfulCalculatorInputs(result.data.inputs)) {
          replaceInputsFromStorage(result.data.inputs)
          setCloudSetId(result.data.id)
          setHasCloudDraft(true)
          setCloudDraftSavedAt(result.data.updatedAt)
          setSyncStatus('saved')
          return null
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
      }

      return persistInputs(inputs, true, mode)
    },
    [activeUserId, inputs, persistInputs, storageMode],
  )

  const pauseSaving = useCallback(() => {
    // 저장만 끄고 화면은 빈 입력값으로 되돌린다. 이미 저장해 둔 로컬/클라우드 값은 삭제하지 않는다.
    setSaveEnabledState(false)
    writeSaveEnabled(false)
    setSyncStatus('idle')
    setSyncError(null)
    replaceInputsFromStorage(defaultInputs)
  }, [replaceInputsFromStorage])

  const deleteSavedData = useCallback(
    async (mode: SaveStorageMode): Promise<string | null> => {
      // 해당 위치에 저장된 값을 실제로 삭제하고, 저장을 끈 뒤 빈 입력값으로 되돌린다.
      if (mode === 'local') {
        clearDraft()
        setHasLocalDraft(false)
        setLocalDraftSavedAt(null)
      } else if (activeUserId) {
        setSyncStatus('saving')
        setSyncError(null)
        const result = await deleteNumberSet(activeUserId, cloudSetIdRef.current)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
      }

      setSaveEnabledState(false)
      writeSaveEnabled(false)
      setSyncStatus('idle')
      setSyncError(null)
      replaceInputsFromStorage(defaultInputs)
      return null
    },
    [activeUserId, replaceInputsFromStorage],
  )

  const setStorageMode = useCallback((mode: SaveStorageMode) => {
    suppressNextPersistRef.current = true
    setStorageModeState(mode)
    writeStorageMode(mode)
    if (mode === 'local') {
      const draft = loadDraft()
      replaceInputsFromStorage(draft ?? defaultInputs)
      setHasLocalDraft(Boolean(draft))
      setLocalDraftSavedAt(draft ? readDraftSavedAt() : null)
      setCloudSetId(null)
    }
    setSyncStatus('idle')
    setSyncError(null)
  }, [replaceInputsFromStorage])

  const migrateLocalDraftToCloud = useCallback(async (): Promise<string | null> => {
    if (!activeUserId) return 'not_logged_in'
    const localDraft = loadDraft()
    if (!localDraft) {
      setHasLocalDraft(false)
      setLocalDraftSavedAt(null)
      return 'no_local_draft'
    }

    setSaveEnabledState(true)
    writeSaveEnabled(true)
    setSyncStatus('saving')
    setSyncError(null)

    const result = await saveNumberSet(activeUserId, localDraft, cloudSetIdRef.current)
    if (result.error) {
      setSyncStatus('error')
      setSyncError(result.error)
      return result.error
    }
    if (!result.data) {
      setSyncStatus('error')
      setSyncError('number_set_save_empty')
      return 'number_set_save_empty'
    }

    replaceInputsFromStorage(result.data.inputs)
    setCloudSetId(result.data.id)
    setHasCloudDraft(true)
    setCloudDraftSavedAt(result.data.updatedAt)
    clearDraft()
    setHasLocalDraft(false)
    setLocalDraftSavedAt(null)
    setSyncStatus('saved')
    return null
  }, [activeUserId, replaceInputsFromStorage])

  const copyDraftBetweenStorageModes = useCallback(
    async (source: SaveStorageMode, target: SaveStorageMode): Promise<string | null> => {
      if (source === target) return null

      if (source === 'local' && target === 'cloud') {
        if (!activeUserId) {
          setSyncStatus('error')
          setSyncError('not_logged_in')
          return 'not_logged_in'
        }

        const localDraft = loadDraft()
        if (!localDraft) {
          setHasLocalDraft(false)
          setLocalDraftSavedAt(null)
          setSyncStatus('idle')
          setSyncError(null)
          return 'no_local_draft'
        }

        setSyncStatus('saving')
        setSyncError(null)
        const result = await saveNumberSet(activeUserId, localDraft, cloudSetIdRef.current)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        if (!result.data) {
          setSyncStatus('error')
          setSyncError('number_set_save_empty')
          return 'number_set_save_empty'
        }

        cloudSetIdRef.current = result.data.id
        setCloudSetId(result.data.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(result.data.updatedAt)
        if (saveEnabled && storageMode === 'cloud') {
          replaceInputsFromStorage(result.data.inputs)
        }
        setSyncStatus('saved')
        setSyncError(null)
        return null
      }

      if (source === 'cloud' && target === 'local') {
        if (!activeUserId) {
          setSyncStatus('error')
          setSyncError('not_logged_in')
          return 'not_logged_in'
        }

        setSyncStatus('loading')
        setSyncError(null)
        const result = await fetchLatestNumberSet(activeUserId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        if (!result.data || !hasMeaningfulCalculatorInputs(result.data.inputs)) {
          setHasCloudDraft(false)
          setCloudSetId(null)
          setCloudDraftSavedAt(null)
          setSyncStatus('idle')
          return 'no_cloud_draft'
        }

        const savedAt = saveDraft(result.data.inputs)
        if (!savedAt) {
          setSyncStatus('error')
          setSyncError('local_draft_save_failed')
          return 'local_draft_save_failed'
        }

        cloudSetIdRef.current = result.data.id
        setCloudSetId(result.data.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(result.data.updatedAt)
        setHasLocalDraft(true)
        setLocalDraftSavedAt(savedAt)
        if (saveEnabled && storageMode === 'local') {
          replaceInputsFromStorage(result.data.inputs)
        }
        setSyncStatus('saved')
        setSyncError(null)
        return null
      }

      return 'unsupported_draft_copy'
    },
    [activeUserId, replaceInputsFromStorage, saveEnabled, storageMode],
  )

  useEffect(() => {
    if (authLoading) return
    let active = true

    async function syncConfiguredStorage() {
      if (!active) return

      if (!saveEnabled) {
        setSyncStatus('idle')
        setSyncError(null)
        return
      }

      if (storageMode === 'local') {
        const draft = loadDraft()
        if (draft) {
          replaceInputsFromStorage(draft)
          setSyncStatus('saved')
        } else {
          replaceInputsFromStorage(draft ?? defaultInputs)
          setSyncStatus('idle')
        }
        setCloudSetId(null)
        setHasLocalDraft(Boolean(draft))
        setLocalDraftSavedAt(draft ? readDraftSavedAt() : null)
        return
      }

      if (!activeUserId) {
        setSyncStatus('idle')
        setSyncError(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
        return
      }

      setSyncStatus('loading')
      setSyncError(null)
      const result = await fetchLatestNumberSet(activeUserId)
      if (!active) return
      if (result.error) {
        setSyncStatus('error')
        setSyncError(result.error)
        return
      }
      if (result.data && hasMeaningfulCalculatorInputs(result.data.inputs)) {
        replaceInputsFromStorage(result.data.inputs)
        setCloudSetId(result.data.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(result.data.updatedAt)
        setSyncStatus('saved')
      } else {
        replaceInputsFromStorage(defaultInputs)
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
        setSyncStatus('idle')
      }
      setHasLocalDraft(hasStoredDraft())
      setLocalDraftSavedAt(readDraftSavedAt())
    }

    void syncConfiguredStorage()

    return () => {
      active = false
    }
  }, [activeUserId, authLoading, replaceInputsFromStorage, saveEnabled, storageMode])

  useEffect(() => {
    if (authLoading) return
    if (!activeUserId) return
    if (saveEnabled && storageMode === 'cloud') return

    let active = true
    const userId = activeUserId

    async function refreshCloudDraftPresence() {
      const result = await fetchLatestNumberSet(userId)
      if (!active || result.error) return
      const hasDraft = Boolean(result.data && hasMeaningfulCalculatorInputs(result.data.inputs))
      setHasCloudDraft(hasDraft)
      setCloudSetId(hasDraft ? (result.data?.id ?? null) : null)
      setCloudDraftSavedAt(hasDraft ? (result.data?.updatedAt ?? null) : null)
    }

    void refreshCloudDraftPresence()

    return () => {
      active = false
    }
  }, [activeUserId, authLoading, saveEnabled, storageMode])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (suppressNextPersistRef.current) {
      suppressNextPersistRef.current = false
      return
    }
    if (!saveEnabled || authLoading) return

    // 편집이 감지되는 즉시 미커밋(저장 대기) 상태로 표시해 저장 완료 체크(✓)를 숨긴다.
    // persistInputs가 500ms 뒤 실제 저장 결과('saved'/'idle'/'error')로 덮어쓴다.
    setSyncStatus('saving')
    const timer = window.setTimeout(() => {
      void persistInputs(inputs)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [authLoading, inputs, persistInputs, saveEnabled])

  return (
    <CalculatorContext.Provider
      value={{
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
        storageMode,
        cloudAvailable,
        syncStatus,
        syncError,
        hasLocalDraft,
        hasCloudDraft: cloudAvailable ? hasCloudDraft : false,
        localDraftSavedAt,
        cloudDraftSavedAt: cloudAvailable ? cloudDraftSavedAt : null,
        canMigrateLocalDraft: Boolean(activeUserId && storageMode === 'cloud' && hasLocalDraft),
        setSaveEnabled,
        pauseSaving,
        deleteSavedData,
        setStorageMode,
        migrateLocalDraftToCloud,
        copyDraftBetweenStorageModes,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  )
}

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext)
  if (!ctx) throw new Error('useCalculator must be used within CalculatorProvider')
  return ctx
}
