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
  createNumberSet as createCloudNumberSet,
  deleteNumberSet,
  fetchNumberSets,
  fetchLatestNumberSet,
  renameNumberSet as renameCloudNumberSet,
  setNumberSetAutoSnapshot as setCloudNumberSetAutoSnapshot,
  type NumberSetRecord,
  saveNumberSet,
} from '../db/numberSets'
import {
  appendLocalNumberSet,
  deleteLocalNumberSet,
  loadLocalNumberSets,
  readActiveLocalNumberSetId,
  resolveActiveLocalNumberSetId,
  renameLocalNumberSet,
  upsertLocalNumberSet,
  writeActiveLocalNumberSetId,
  writeLocalNumberSets,
  type LocalNumberSetRecord,
} from '../storage/localNumberSets'
import {
  hasMeaningfulCalculatorInputs,
  parseStoredCalculatorInputs,
} from '../utils/storedCalculatorInputs'

const DRAFT_KEY = 'leverage_calculator_draft'
const DRAFT_SAVED_AT_KEY = 'leverage_calculator_draft_saved_at'
const SAVE_ENABLED_KEY = 'leverage_save_enabled'
const SAVE_STORAGE_MODE_KEY = 'leverage_save_storage_mode'
const ACTIVE_CLOUD_NUMBER_SET_ID_KEY = 'leverage_calculator_active_cloud_number_set_id'
const FREE_NUMBER_SET_LIMIT = 1
const PRO_NUMBER_SET_LIMIT = 10

export type SaveStorageMode = 'local' | 'cloud'
export type SaveSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

export interface CalculatorNumberSet {
  id: string
  title: string
  inputs: CalculatorInputs
  updatedAt: string | null
  storageMode: SaveStorageMode
  // 자동 스냅샷 대상 여부. 클라우드 슬롯에서만 의미가 있고 로컬은 항상 false.
  autoSnapshotEnabled: boolean
}

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
  numberSets: CalculatorNumberSet[]
  activeNumberSetId: string | null
  numberSetLimits: Record<SaveStorageMode, number>
  canMigrateLocalDraft: boolean
  setSaveEnabled: (enabled: boolean, mode?: SaveStorageMode) => Promise<string | null>
  pauseSaving: () => void
  deleteSavedData: (mode: SaveStorageMode) => Promise<string | null>
  setStorageMode: (mode: SaveStorageMode) => void
  selectNumberSet: (mode: SaveStorageMode, setId: string) => Promise<string | null>
  createNumberSet: (mode: SaveStorageMode) => Promise<string | null>
  renameNumberSet: (mode: SaveStorageMode, setId: string, title: string) => Promise<string | null>
  setNumberSetAutoSnapshot: (
    mode: SaveStorageMode,
    setId: string,
    enabled: boolean,
  ) => Promise<string | null>
  deleteNumberSetById: (mode: SaveStorageMode, setId: string) => Promise<string | null>
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

function loadLegacyDraft(): CalculatorInputs | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const draft = parseStoredCalculatorInputs(JSON.parse(raw))
    return draft && hasMeaningfulCalculatorInputs(draft) ? draft : null
  } catch {
    return null
  }
}

function readLocalNumberSetState(): LocalNumberSetRecord[] {
  try {
    return loadLocalNumberSets(localStorage, loadLegacyDraft(), readDraftSavedAt()).sets
  } catch {
    return []
  }
}

function readActiveLocalNumberSet(): LocalNumberSetRecord | null {
  const sets = readLocalNumberSetState()
  const activeId = resolveActiveLocalNumberSetId(localStorage, sets)
  return sets.find((set) => set.id === activeId) ?? sets[0] ?? null
}

function loadDraft(): CalculatorInputs | null {
  return readActiveLocalNumberSet()?.inputs ?? null
}

function readActiveLocalDraftSavedAt(): string | null {
  return readActiveLocalNumberSet()?.updatedAt ?? readDraftSavedAt()
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
    const sets = readLocalNumberSetState()
    const activeSetId =
      resolveActiveLocalNumberSetId(localStorage, sets) ?? readActiveLocalNumberSetId(localStorage)
    const nextSets = upsertLocalNumberSet(sets, activeSetId, inputs, { updatedAt: savedAt })
    const nextActiveId = activeSetId ?? nextSets[0]?.id ?? null
    writeLocalNumberSets(localStorage, nextSets)
    writeActiveLocalNumberSetId(localStorage, nextActiveId)
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

function clearDraft(setId?: string | null): void {
  try {
    const sets = readLocalNumberSetState()
    const targetId = setId ?? resolveActiveLocalNumberSetId(localStorage, sets)
    const nextSets = targetId ? deleteLocalNumberSet(sets, targetId) : []
    writeLocalNumberSets(localStorage, nextSets)
    const nextActiveId = resolveActiveLocalNumberSetId(localStorage, nextSets)
    writeActiveLocalNumberSetId(localStorage, nextActiveId)
    const nextActiveSet = nextSets.find((set) => set.id === nextActiveId) ?? nextSets[0] ?? null
    if (nextActiveSet) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(nextActiveSet.inputs))
      localStorage.setItem(DRAFT_SAVED_AT_KEY, nextActiveSet.updatedAt)
    } else {
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(DRAFT_SAVED_AT_KEY)
    }
  } catch {
    // ignore
  }
}

function hasStoredDraft(): boolean {
  return readLocalNumberSetState().length > 0
}

function getInitialInputs(saveEnabled: boolean): CalculatorInputs {
  return saveEnabled ? loadDraft() ?? defaultInputs : defaultInputs
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, isPro } = useAuth()
  const activeUserId = user?.id ?? null
  const cloudAvailable = Boolean(activeUserId)
  const numberSetLimits: Record<SaveStorageMode, number> = useMemo(
    () => ({
      local: isPro ? PRO_NUMBER_SET_LIMIT : FREE_NUMBER_SET_LIMIT,
      cloud: isPro ? PRO_NUMBER_SET_LIMIT : FREE_NUMBER_SET_LIMIT,
    }),
    [isPro],
  )
  const [storageModeState, setStorageModeState] = useState(readStorageMode)
  const storageMode: SaveStorageMode =
    cloudAvailable && storageModeState === 'cloud' ? 'cloud' : 'local'
  const [saveEnabled, setSaveEnabledState] = useState(readSaveEnabled)
  const [localNumberSets, setLocalNumberSets] = useState(readLocalNumberSetState)
  const [cloudNumberSets, setCloudNumberSets] = useState<NumberSetRecord[]>([])
  const [activeLocalSetId, setActiveLocalSetId] = useState(() =>
    resolveActiveLocalNumberSetId(localStorage, readLocalNumberSetState()),
  )
  const [history, setHistory] = useState(() =>
    createCalculatorHistory(getInitialInputs(readSaveEnabled())),
  )
  const inputs = history.present
  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [cloudSetId, setCloudSetId] = useState<string | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(hasStoredDraft)
  const [hasCloudDraft, setHasCloudDraft] = useState(false)
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState(readActiveLocalDraftSavedAt)
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

  const refreshLocalNumberSetState = useCallback(() => {
    const sets = readLocalNumberSetState()
    const nextActiveId = resolveActiveLocalNumberSetId(localStorage, sets)
    setLocalNumberSets(sets)
    setActiveLocalSetId(nextActiveId)
    setHasLocalDraft(sets.length > 0)
    setLocalDraftSavedAt(
      (sets.find((set) => set.id === nextActiveId) ?? sets[0] ?? null)?.updatedAt ?? null,
    )
    return { sets, activeId: nextActiveId }
  }, [])

  const refreshCloudNumberSetState = useCallback(async (userId: string) => {
    const result = await fetchNumberSets(userId)
    if (result.error) return result
    const sets = result.data ?? []
    setCloudNumberSets(sets)
    const preferredId = cloudSetIdRef.current
    const nextActive = sets.find((set) => set.id === preferredId) ?? sets[0] ?? null
    if (nextActive) {
      setCloudSetId(nextActive.id)
      setCloudDraftSavedAt(nextActive.updatedAt)
      setHasCloudDraft(true)
      try {
        localStorage.setItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY, nextActive.id)
      } catch {
        // ignore
      }
    } else {
      setCloudSetId(null)
      setCloudDraftSavedAt(null)
      setHasCloudDraft(false)
      try {
        localStorage.removeItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY)
      } catch {
        // ignore
      }
    }
    return result
  }, [])

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
  const numberSets: CalculatorNumberSet[] = useMemo(
    () => [
      ...localNumberSets.map((set) => ({
        ...set,
        storageMode: 'local' as const,
        autoSnapshotEnabled: false,
      })),
      ...cloudNumberSets.map((set) => ({
        ...set,
        storageMode: 'cloud' as const,
      })),
    ],
    [cloudNumberSets, localNumberSets],
  )
  const activeNumberSetId = storageMode === 'cloud' ? cloudSetId : activeLocalSetId

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
          refreshLocalNumberSetState()
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
        const deletedSetId = cloudSetIdRef.current
        const result = await deleteNumberSet(activeUserId, deletedSetId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        if (deletedSetId) {
          setCloudNumberSets((sets) => sets.filter((set) => set.id !== deletedSetId))
        }
        cloudSetIdRef.current = null
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
        refreshLocalNumberSetState()
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
      const savedSet = result.data
      setCloudSetId(savedSet.id)
      setHasCloudDraft(true)
      setCloudDraftSavedAt(savedSet.updatedAt)
      setCloudNumberSets((sets) => {
        const existing = sets.some((set) => set.id === savedSet.id)
        return existing
          ? sets.map((set) => (set.id === savedSet.id ? savedSet : set))
          : [savedSet, ...sets]
      })
      setSyncStatus('saved')
      return null
    },
    [activeUserId, refreshLocalNumberSetState, saveEnabled, storageMode],
  )

  const setSaveEnabled = useCallback(
    async (enabled: boolean, mode: SaveStorageMode = storageMode): Promise<string | null> => {
      setSaveEnabledState(enabled)
      writeSaveEnabled(enabled)
      setSyncError(null)

      if (!enabled) {
        if (mode === 'local') {
          clearDraft()
          refreshLocalNumberSetState()
        } else if (activeUserId) {
          setSyncStatus('saving')
          const deletedSetId = cloudSetIdRef.current
          const result = await deleteNumberSet(activeUserId, deletedSetId)
          if (result.error) {
            setSyncStatus('error')
            setSyncError(result.error)
            return result.error
          }
          if (deletedSetId) {
            setCloudNumberSets((sets) => sets.filter((set) => set.id !== deletedSetId))
          }
          cloudSetIdRef.current = null
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
          refreshLocalNumberSetState()
          setSyncStatus('saved')
          return null
        }
      } else if (activeUserId) {
        setSyncStatus('loading')
        const result = await fetchNumberSets(activeUserId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        const sets = result.data ?? []
        const preferredId = cloudSetIdRef.current
        const selected = sets.find((set) => set.id === preferredId) ?? sets[0] ?? null
        setCloudNumberSets(sets)
        if (selected && hasMeaningfulCalculatorInputs(selected.inputs)) {
          replaceInputsFromStorage(selected.inputs)
          setCloudSetId(selected.id)
          setHasCloudDraft(true)
          setCloudDraftSavedAt(selected.updatedAt)
          setSyncStatus('saved')
          return null
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
      }

      return persistInputs(inputs, true, mode)
    },
    [activeUserId, inputs, persistInputs, refreshLocalNumberSetState, storageMode],
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
        refreshLocalNumberSetState()
      } else if (activeUserId) {
        setSyncStatus('saving')
        setSyncError(null)
        const deletedSetId = cloudSetIdRef.current
        const result = await deleteNumberSet(activeUserId, deletedSetId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        if (deletedSetId) {
          setCloudNumberSets((sets) => sets.filter((set) => set.id !== deletedSetId))
        }
        cloudSetIdRef.current = null
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
    [activeUserId, refreshLocalNumberSetState, replaceInputsFromStorage],
  )

  const setStorageMode = useCallback((mode: SaveStorageMode) => {
    suppressNextPersistRef.current = true
    setStorageModeState(mode)
    writeStorageMode(mode)
    if (mode === 'local') {
      const draft = loadDraft()
      replaceInputsFromStorage(draft ?? defaultInputs)
      setHasLocalDraft(Boolean(draft))
      refreshLocalNumberSetState()
      setCloudSetId(null)
    }
    setSyncStatus('idle')
    setSyncError(null)
  }, [refreshLocalNumberSetState, replaceInputsFromStorage])

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

    const savedSet = result.data
    replaceInputsFromStorage(savedSet.inputs)
    setCloudSetId(savedSet.id)
    setHasCloudDraft(true)
    setCloudDraftSavedAt(savedSet.updatedAt)
    setCloudNumberSets((sets) => {
      const existing = sets.some((set) => set.id === savedSet.id)
      return existing
        ? sets.map((set) => (set.id === savedSet.id ? savedSet : set))
        : [savedSet, ...sets]
    })
    clearDraft()
    refreshLocalNumberSetState()
    setSyncStatus('saved')
    return null
  }, [activeUserId, refreshLocalNumberSetState, replaceInputsFromStorage])

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

        const savedSet = result.data
        cloudSetIdRef.current = savedSet.id
        setCloudSetId(savedSet.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(savedSet.updatedAt)
        setCloudNumberSets((sets) => {
          const existing = sets.some((set) => set.id === savedSet.id)
          return existing
            ? sets.map((set) => (set.id === savedSet.id ? savedSet : set))
            : [savedSet, ...sets]
        })
        if (saveEnabled && storageMode === 'cloud') {
          replaceInputsFromStorage(savedSet.inputs)
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
        refreshLocalNumberSetState()
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
    [activeUserId, refreshLocalNumberSetState, replaceInputsFromStorage, saveEnabled, storageMode],
  )

  const selectNumberSet = useCallback(
    async (mode: SaveStorageMode, setId: string): Promise<string | null> => {
      setSyncError(null)
      setStorageModeState(mode)
      writeStorageMode(mode)
      setSaveEnabledState(true)
      writeSaveEnabled(true)

      if (mode === 'local') {
        const sets = readLocalNumberSetState()
        const selected = sets.find((set) => set.id === setId)
        if (!selected) return 'number_set_not_found'
        writeActiveLocalNumberSetId(localStorage, selected.id)
        setActiveLocalSetId(selected.id)
        setLocalNumberSets(sets)
        setHasLocalDraft(true)
        setLocalDraftSavedAt(selected.updatedAt)
        setCloudSetId(null)
        replaceInputsFromStorage(selected.inputs)
        setSyncStatus('saved')
        return null
      }

      if (!activeUserId) return 'not_logged_in'
      const selected = cloudNumberSets.find((set) => set.id === setId)
      if (!selected) return 'number_set_not_found'
      setCloudSetId(selected.id)
      try {
        localStorage.setItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY, selected.id)
      } catch {
        // ignore
      }
      setHasCloudDraft(true)
      setCloudDraftSavedAt(selected.updatedAt)
      replaceInputsFromStorage(selected.inputs)
      setSyncStatus('saved')
      return null
    },
    [activeUserId, cloudNumberSets, replaceInputsFromStorage],
  )

  const createNumberSet = useCallback(
    async (mode: SaveStorageMode): Promise<string | null> => {
      setSyncError(null)
      if (mode === 'local') {
        const sets = readLocalNumberSetState()
        if (sets.length >= numberSetLimits.local) return 'number_set_limit_reached'
        const result = appendLocalNumberSet(sets, inputs, {
          title: `숫자세트 ${sets.length + 1}`,
        })
        writeLocalNumberSets(localStorage, result.sets)
        writeActiveLocalNumberSetId(localStorage, result.set.id)
        refreshLocalNumberSetState()
        return selectNumberSet('local', result.set.id)
      }

      if (!activeUserId) return 'not_logged_in'
      if (cloudNumberSets.length >= numberSetLimits.cloud) return 'number_set_limit_reached'
      setSyncStatus('saving')
      const result = await createCloudNumberSet(
        activeUserId,
        inputs,
        `숫자세트 ${cloudNumberSets.length + 1}`,
      )
      if (result.error) {
        setSyncStatus('error')
        setSyncError(result.error)
        return result.error
      }
      const createdSet = result.data
      if (!createdSet) return 'number_set_save_empty'
      setCloudNumberSets((sets) => [createdSet, ...sets])
      setStorageModeState('cloud')
      writeStorageMode('cloud')
      setSaveEnabledState(true)
      writeSaveEnabled(true)
      cloudSetIdRef.current = createdSet.id
      setCloudSetId(createdSet.id)
      try {
        localStorage.setItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY, createdSet.id)
      } catch {
        // ignore
      }
      setHasCloudDraft(true)
      setCloudDraftSavedAt(createdSet.updatedAt)
      replaceInputsFromStorage(createdSet.inputs)
      setSyncStatus('saved')
      return null
    },
    [
      activeUserId,
      cloudNumberSets.length,
      inputs,
      numberSetLimits.cloud,
      numberSetLimits.local,
      replaceInputsFromStorage,
      refreshLocalNumberSetState,
      selectNumberSet,
    ],
  )

  const renameNumberSet = useCallback(
    async (mode: SaveStorageMode, setId: string, title: string): Promise<string | null> => {
      const trimmed = title.trim()
      if (!trimmed) return 'number_set_title_required'

      if (mode === 'local') {
        const nextSets = renameLocalNumberSet(readLocalNumberSetState(), setId, trimmed)
        writeLocalNumberSets(localStorage, nextSets)
        refreshLocalNumberSetState()
        return null
      }

      if (!activeUserId) return 'not_logged_in'
      const result = await renameCloudNumberSet(activeUserId, setId, trimmed)
      if (result.error) return result.error
      const renamedSet = result.data
      if (!renamedSet) return 'number_set_not_found'
      setCloudNumberSets((sets) =>
        sets.map((set) => (set.id === renamedSet.id ? renamedSet : set)),
      )
      return null
    },
    [activeUserId, refreshLocalNumberSetState],
  )

  const setNumberSetAutoSnapshot = useCallback(
    async (mode: SaveStorageMode, setId: string, enabled: boolean): Promise<string | null> => {
      // 자동 스냅샷은 서버 크론이 접근하는 클라우드 슬롯에서만 동작한다. 로컬 슬롯은 대상 불가.
      if (mode === 'local') return 'auto_snapshot_local_unsupported'
      if (!activeUserId) return 'not_logged_in'
      const result = await setCloudNumberSetAutoSnapshot(activeUserId, setId, enabled)
      if (result.error) return result.error
      const updatedSet = result.data
      if (!updatedSet) return 'number_set_not_found'
      setCloudNumberSets((sets) =>
        sets.map((set) => (set.id === updatedSet.id ? updatedSet : set)),
      )
      return null
    },
    [activeUserId],
  )

  const deleteNumberSetById = useCallback(
    async (mode: SaveStorageMode, setId: string): Promise<string | null> => {
      if (mode === 'local') {
        const nextSets = deleteLocalNumberSet(readLocalNumberSetState(), setId)
        writeLocalNumberSets(localStorage, nextSets)
        const nextActiveId = resolveActiveLocalNumberSetId(localStorage, nextSets)
        writeActiveLocalNumberSetId(localStorage, nextActiveId)
        const nextActive = nextSets.find((set) => set.id === nextActiveId) ?? null
        refreshLocalNumberSetState()
        if (storageMode === 'local') {
          replaceInputsFromStorage(nextActive?.inputs ?? defaultInputs)
          if (!nextActive) {
            setSaveEnabledState(false)
            writeSaveEnabled(false)
          }
        }
        return null
      }

      if (!activeUserId) return 'not_logged_in'
      const result = await deleteNumberSet(activeUserId, setId)
      if (result.error) return result.error
      const nextSets = cloudNumberSets.filter((set) => set.id !== setId)
      setCloudNumberSets(nextSets)
      const nextActive = nextSets[0] ?? null
      if (cloudSetId === setId) {
        setCloudSetId(nextActive?.id ?? null)
        setCloudDraftSavedAt(nextActive?.updatedAt ?? null)
        if (storageMode === 'cloud') {
          replaceInputsFromStorage(nextActive?.inputs ?? defaultInputs)
          if (!nextActive) {
            setSaveEnabledState(false)
            writeSaveEnabled(false)
          }
        }
      }
      setHasCloudDraft(nextSets.length > 0)
      return null
    },
    [
      activeUserId,
      cloudNumberSets,
      cloudSetId,
      refreshLocalNumberSetState,
      replaceInputsFromStorage,
      storageMode,
    ],
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
        refreshLocalNumberSetState()
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
      const result = await fetchNumberSets(activeUserId)
      if (!active) return
      if (result.error) {
        setSyncStatus('error')
        setSyncError(result.error)
        return
      }
      const sets = result.data ?? []
      const preferredId = cloudSetIdRef.current
      const selected = sets.find((set) => set.id === preferredId) ?? sets[0] ?? null
      setCloudNumberSets(sets)
      if (selected && hasMeaningfulCalculatorInputs(selected.inputs)) {
        replaceInputsFromStorage(selected.inputs)
        setCloudSetId(selected.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(selected.updatedAt)
        setSyncStatus('saved')
      } else {
        replaceInputsFromStorage(defaultInputs)
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
        setSyncStatus('idle')
      }
      refreshLocalNumberSetState()
    }

    void syncConfiguredStorage()

    return () => {
      active = false
    }
  }, [
    activeUserId,
    authLoading,
    refreshLocalNumberSetState,
    replaceInputsFromStorage,
    saveEnabled,
    storageMode,
  ])

  useEffect(() => {
    if (authLoading) return
    if (!activeUserId) return
    if (saveEnabled && storageMode === 'cloud') return

    let active = true
    const userId = activeUserId

    async function refreshCloudDraftPresence() {
      const result = await refreshCloudNumberSetState(userId)
      if (!active || result.error) return
      const hasDraft = (result.data ?? []).some((set) => hasMeaningfulCalculatorInputs(set.inputs))
      setHasCloudDraft(hasDraft)
    }

    void refreshCloudDraftPresence()

    return () => {
      active = false
    }
  }, [activeUserId, authLoading, refreshCloudNumberSetState, saveEnabled, storageMode])

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
        numberSets: cloudAvailable
          ? numberSets
          : numberSets.filter((numberSet) => numberSet.storageMode === 'local'),
        activeNumberSetId,
        numberSetLimits,
        canMigrateLocalDraft: Boolean(activeUserId && storageMode === 'cloud' && hasLocalDraft),
        setSaveEnabled,
        pauseSaving,
        deleteSavedData,
        setStorageMode,
        selectNumberSet,
        createNumberSet,
        renameNumberSet,
        setNumberSetAutoSnapshot,
        deleteNumberSetById,
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
