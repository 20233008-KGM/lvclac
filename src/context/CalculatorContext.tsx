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
import { useLanguage, type PresetId } from '../i18n'
import { useAuth } from './AuthContext'
import {
  createNumberSet as createCloudNumberSet,
  deleteNumberSet,
  fetchNumberSets,
  fetchNumberSetRevisions,
  renameNumberSet as renameCloudNumberSet,
  updateNumberSetMemo as updateCloudNumberSetMemo,
  setNumberSetPreset as setCloudNumberSetPreset,
  setNumberSetAutoSnapshot as setCloudNumberSetAutoSnapshot,
  setNumberSetRollover as setCloudNumberSetRollover,
  clearNumberSetRolloverPending as clearCloudNumberSetRolloverPending,
  type NumberSetRecord,
  type RolloverSettings,
  saveNumberSet,
} from '../db/numberSets'
import type { RolloverAnchor, RolloverIntervalMonths } from '../db/rolloverSchedule'
import {
  appendLocalNumberSet,
  deleteLocalNumberSet,
  loadLocalNumberSets,
  readActiveLocalNumberSetId,
  resolveActiveLocalNumberSetId,
  renameLocalNumberSet,
  setLocalNumberSetPreset,
  upsertLocalNumberSet,
  writeActiveLocalNumberSetId,
  writeLocalNumberSets,
  type LocalNumberSetRecord,
} from '../storage/localNumberSets'
import {
  hasMeaningfulCalculatorInputs,
  parseStoredCalculatorInputs,
} from '../utils/storedCalculatorInputs'
import { resolveNumberSetDeletionTransition } from '../utils/numberSetDeletion'
import {
  fetchActiveCloudNumberSetId,
  saveActiveCloudNumberSetId,
} from '../db/numberSetPreferences'
import {
  resolveActiveCloudNumberSet,
  shouldOpenCloudAtStartup,
} from './cloudStartupPreference'
import {
  cloudSnapshotMatchesRevision,
  readCloudNumberSetSnapshot,
  writeCloudNumberSetSnapshot,
  type CloudNumberSetSnapshot,
} from '../storage/cloudNumberSetSnapshot'

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
  presetId: PresetId
  memo?: string | null
  updatedAt: string | null
  storageMode: SaveStorageMode
  // 자동 스냅샷 대상 여부. 클라우드 슬롯에서만 의미가 있고 로컬은 항상 false.
  autoSnapshotEnabled: boolean
  // 롤오버 알림 설정. 클라우드 슬롯에서만 의미가 있고 로컬은 항상 비활성.
  rollover: RolloverSettings
}

const DISABLED_ROLLOVER: RolloverSettings = {
  enabled: false,
  intervalMonths: null,
  anchor: null,
  nextDate: null,
  pending: false,
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
  setNumberSetMemo: (mode: SaveStorageMode, setId: string, memo: string) => Promise<string | null>
  setNumberSetPreset: (
    mode: SaveStorageMode,
    setId: string,
    presetId: PresetId,
  ) => Promise<string | null>
  setNumberSetAutoSnapshot: (
    mode: SaveStorageMode,
    setId: string,
    enabled: boolean,
  ) => Promise<string | null>
  setNumberSetRollover: (
    mode: SaveStorageMode,
    setId: string,
    settings: {
      enabled: boolean
      intervalMonths: RolloverIntervalMonths | null
      anchor: RolloverAnchor | null
      nextDate: string | null
    },
  ) => Promise<string | null>
  clearNumberSetRolloverPending: (
    mode: SaveStorageMode,
    setId: string,
  ) => Promise<string | null>
  deleteNumberSetById: (mode: SaveStorageMode, setId: string) => Promise<string | null>
  migrateLocalDraftToCloud: () => Promise<string | null>
  copyDraftBetweenStorageModes: (source: SaveStorageMode, target: SaveStorageMode) => Promise<string | null>
  copyNumberSetValues: (
    sourceMode: SaveStorageMode,
    sourceSetId: string,
    targetMode: SaveStorageMode,
    targetSetId: string,
  ) => Promise<string | null>
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

function readCachedActiveCloudNumberSetId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY)
  } catch {
    return null
  }
}

function writeCachedActiveCloudNumberSetId(setId: string | null): void {
  try {
    if (setId) localStorage.setItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY, setId)
    else localStorage.removeItem(ACTIVE_CLOUD_NUMBER_SET_ID_KEY)
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

function saveDraft(inputs: CalculatorInputs, presetId: PresetId): string | null {
  try {
    const savedAt = new Date().toISOString()
    const sets = readLocalNumberSetState()
    const activeSetId =
      resolveActiveLocalNumberSetId(localStorage, sets) ?? readActiveLocalNumberSetId(localStorage)
    const nextSets = upsertLocalNumberSet(sets, activeSetId, inputs, { presetId, updatedAt: savedAt })
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

function hasDeviceSavePreference(): boolean {
  try {
    return (
      localStorage.getItem(SAVE_ENABLED_KEY) != null
      || localStorage.getItem(SAVE_STORAGE_MODE_KEY) != null
      || readLocalNumberSetState().length > 0
    )
  } catch {
    return readLocalNumberSetState().length > 0
  }
}

async function fetchResolvedCloudNumberSetState(userId: string) {
  const [setsResult, preferenceResult] = await Promise.all([
    fetchNumberSets(userId),
    fetchActiveCloudNumberSetId(userId),
  ])
  if (setsResult.error) {
    return {
      data: null,
      error: setsResult.error,
      preferenceError: preferenceResult.error,
    }
  }

  const sets = setsResult.data ?? []
  const serverActiveId = preferenceResult.error ? null : preferenceResult.data
  const selected = resolveActiveCloudNumberSet(
    sets,
    serverActiveId,
    readCachedActiveCloudNumberSetId(),
  )
  return {
    data: { sets, selected, serverActiveId },
    error: null,
    preferenceError: preferenceResult.error,
  }
}

async function fetchCloudNumberSetRevisionState(
  userId: string,
  cachedActiveSetId: string | null,
) {
  const [revisionsResult, preferenceResult] = await Promise.all([
    fetchNumberSetRevisions(userId),
    fetchActiveCloudNumberSetId(userId),
  ])
  if (revisionsResult.error) {
    return { data: null, error: revisionsResult.error }
  }

  const revisions = revisionsResult.data ?? []
  const serverActiveId = preferenceResult.error ? null : preferenceResult.data
  const selected = resolveActiveCloudNumberSet(revisions, serverActiveId, cachedActiveSetId)
  return {
    data: {
      revisions,
      activeSetId: selected?.id ?? null,
    },
    error: null,
  }
}

function getInitialInputs(saveEnabled: boolean): CalculatorInputs {
  return saveEnabled ? loadDraft() ?? defaultInputs : defaultInputs
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const { user, sessionLoading, sessionUserId, isPro } = useAuth()
  const { preset, setPreset } = useLanguage()
  const activeUserId = sessionUserId ?? user?.id ?? null
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
  const [devicePreferenceAtStartup] = useState(hasDeviceSavePreference)
  const [localNumberSets, setLocalNumberSets] = useState(readLocalNumberSetState)
  const [cloudNumberSets, setCloudNumberSets] = useState<NumberSetRecord[]>([])
  const [activeLocalSetId, setActiveLocalSetId] = useState(() =>
    resolveActiveLocalNumberSetId(localStorage, readLocalNumberSetState()),
  )
  const [history, setHistory] = useState(() =>
    createCalculatorHistory(getInitialInputs(readSaveEnabled())),
  )
  const inputs = history.present
  const inputsRef = useRef(inputs)
  const presetRef = useRef(preset)
  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [cloudSetId, setCloudSetId] = useState<string | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(hasStoredDraft)
  const [hasCloudDraft, setHasCloudDraft] = useState(false)
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState(readActiveLocalDraftSavedAt)
  const [cloudDraftSavedAt, setCloudDraftSavedAt] = useState<string | null>(null)
  const [cloudRevalidateNonce, setCloudRevalidateNonce] = useState(0)
  const cloudSetIdRef = useRef<string | null>(null)
  const cloudNumberSetsRef = useRef<NumberSetRecord[]>([])
  const cloudBootstrapUserIdRef = useRef<string | null>(null)
  const cloudCacheWriteUserIdRef = useRef<string | null>(null)
  const inputEditGenerationRef = useRef(0)
  const mountedRef = useRef(false)
  const storageBootstrapPendingRef = useRef(true)
  const suppressNextPersistRef = useRef(false)
  const suppressNextPresetPersistRef = useRef(false)
  const previousPresetRef = useRef(preset)
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

  useEffect(() => {
    inputsRef.current = inputs
  }, [inputs])

  useEffect(() => {
    presetRef.current = preset
  }, [preset])

  useEffect(() => {
    cloudNumberSetsRef.current = cloudNumberSets
  }, [cloudNumberSets])

  useEffect(() => {
    const requestCloudRevalidation = () => {
      if (window.location.pathname === '/') {
        setCloudRevalidateNonce((value) => value + 1)
      }
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestCloudRevalidation()
    }
    window.addEventListener('popstate', requestCloudRevalidation)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('popstate', requestCloudRevalidation)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!activeUserId || cloudCacheWriteUserIdRef.current !== activeUserId) return
    const sets = cloudNumberSetsRef.current
    const cachedActiveId = cloudSetId ?? readCachedActiveCloudNumberSetId()
    const activeId = cachedActiveId && sets.some((set) => set.id === cachedActiveId)
      ? cachedActiveId
      : null
    writeCloudNumberSetSnapshot(localStorage, activeUserId, sets, activeId)
  }, [activeUserId, cloudNumberSets, cloudSetId])

  const rememberActiveCloudNumberSet = useCallback(
    async (userId: string, setId: string | null): Promise<string | null> => {
      writeCachedActiveCloudNumberSetId(setId)
      const result = await saveActiveCloudNumberSetId(userId, setId)
      return result.error
    },
    [],
  )

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
    const result = await fetchResolvedCloudNumberSetState(userId)
    if (result.error || !result.data) return result
    const { sets, selected: nextActive, serverActiveId } = result.data
    setCloudNumberSets(sets)
    if (nextActive) {
      cloudSetIdRef.current = nextActive.id
      setCloudSetId(nextActive.id)
      setCloudDraftSavedAt(nextActive.updatedAt)
      setHasCloudDraft(true)
      writeCachedActiveCloudNumberSetId(nextActive.id)
      if (!result.preferenceError && serverActiveId !== nextActive.id) {
        const preferenceError = await rememberActiveCloudNumberSet(userId, nextActive.id)
        if (preferenceError) {
          console.error('[numberSets] save active cloud preference failed:', preferenceError)
        }
      }
    } else {
      cloudSetIdRef.current = null
      setCloudSetId(null)
      setCloudDraftSavedAt(null)
      setHasCloudDraft(false)
      writeCachedActiveCloudNumberSetId(null)
      if (!result.preferenceError && serverActiveId !== null) {
        const preferenceError = await rememberActiveCloudNumberSet(userId, null)
        if (preferenceError) {
          console.error('[numberSets] clear active cloud preference failed:', preferenceError)
        }
      }
    }
    return { data: sets, error: null }
  }, [rememberActiveCloudNumberSet])

  const updateInputs = useCallback((
    patch: CalculatorInputPatch,
    options?: CalculatorHistoryOptions,
  ) => {
    inputEditGenerationRef.current += 1
    setHistory((prev) => {
      const nextInputs = options?.historyOnly
        ? prev.present
        : applyInputPatch(prev.present, patch)
      const historyOptions =
        options?.historyTransient && options.historyTransient !== 'cancel'
          ? {
              ...options,
              historyTransientTarget: applyInputPatch(nextInputs, {
                clearOrderScenario: true,
              }),
            }
          : options
      return recordCalculatorHistory(prev, nextInputs, historyOptions)
    })
  }, [])

  const resetInputs = useCallback(() => {
    inputEditGenerationRef.current += 1
    setHistory((prev) => recordCalculatorHistory(prev, { ...defaultInputs }))
  }, [])

  const replaceInputsFromStorage = useCallback((nextInputs: CalculatorInputs) => {
    suppressNextPersistRef.current = true
    setHistory((prev) => replaceCalculatorHistory(prev, { ...nextInputs }))
  }, [])

  const replaceNumberSetFromStorage = useCallback(
    (numberSet: { inputs: CalculatorInputs; presetId: PresetId | null }) => {
      replaceInputsFromStorage(numberSet.inputs)
      const currentPreset = presetRef.current
      const nextPreset = numberSet.presetId ?? currentPreset
      if (nextPreset !== currentPreset) {
        suppressNextPresetPersistRef.current = true
        setPreset(nextPreset)
      }
    },
    [replaceInputsFromStorage, setPreset],
  )

  const undoInputs = useCallback(() => {
    inputEditGenerationRef.current += 1
    setHistory((prev) => {
      if (!prev.transientEdit && hasOrderApplyUndo(prev.present)) {
        deleteOrderHistoryOnUndo()
      }
      return undoCalculatorHistory(prev)
    })
  }, [deleteOrderHistoryOnUndo])

  const redoInputs = useCallback(() => {
    inputEditGenerationRef.current += 1
    setHistory((prev) => redoCalculatorHistory(prev))
  }, [])

  const jumpHistory = useCallback((direction: CalculatorHistoryDirection, steps: number) => {
    inputEditGenerationRef.current += 1
    const count = Math.max(0, Math.floor(steps))
    setHistory((prev) => {
      if (direction === 'undo') {
        let probe = prev
        if (probe.transientEdit) {
          probe = undoCalculatorHistory(probe)
        }
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
        presetId: set.presetId ?? preset,
        storageMode: 'local' as const,
        autoSnapshotEnabled: false,
        rollover: DISABLED_ROLLOVER,
      })),
      ...cloudNumberSets.map((set) => ({
        ...set,
        presetId: set.presetId ?? preset,
        storageMode: 'cloud' as const,
      })),
    ],
    [cloudNumberSets, localNumberSets, preset],
  )
  const activeNumberSetId = storageMode === 'cloud' ? cloudSetId : activeLocalSetId

  const persistInputs = useCallback(
    async (
      value: CalculatorInputs,
      force = false,
      mode: SaveStorageMode = storageMode,
    ): Promise<string | null> => {
      if (!force && !saveEnabled) return null

      if (mode === 'local') {
        if (isSameAsStoredDraft(value)) {
          setHasLocalDraft(true)
          setSyncStatus('saved')
          setSyncError(null)
          return null
        }
        const savedAt = saveDraft(value, preset)
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
      const previousSetId = cloudSetIdRef.current
      const result = await saveNumberSet(activeUserId, value, preset, previousSetId)
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
      if (previousSetId !== savedSet.id) {
        const preferenceError = await rememberActiveCloudNumberSet(activeUserId, savedSet.id)
        if (preferenceError) {
          console.error('[numberSets] save active cloud preference failed:', preferenceError)
        }
      }
      setSyncStatus('saved')
      return null
    },
    [activeUserId, preset, refreshLocalNumberSetState, rememberActiveCloudNumberSet, saveEnabled, storageMode],
  )
  const persistInputsRef = useRef(persistInputs)

  useEffect(() => {
    persistInputsRef.current = persistInputs
  }, [persistInputs])

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
            const nextSets = cloudNumberSets.filter((set) => set.id !== deletedSetId)
            const nextActive = nextSets[0] ?? null
            setCloudNumberSets(nextSets)
            cloudSetIdRef.current = nextActive?.id ?? null
            setCloudSetId(nextActive?.id ?? null)
            setHasCloudDraft(nextSets.length > 0)
            setCloudDraftSavedAt(nextActive?.updatedAt ?? null)
            const preferenceError = await rememberActiveCloudNumberSet(
              activeUserId,
              nextActive?.id ?? null,
            )
            if (preferenceError) {
              setSyncStatus('error')
              setSyncError(preferenceError)
              return preferenceError
            }
          } else {
            cloudSetIdRef.current = null
            setCloudSetId(null)
            setHasCloudDraft(false)
            setCloudDraftSavedAt(null)
          }
        }

        setSyncStatus('idle')
        return null
      }

      if (mode === 'local') {
        const selected = readActiveLocalNumberSet()
        if (selected) {
          replaceNumberSetFromStorage(selected)
          refreshLocalNumberSetState()
          setSyncStatus('saved')
          return null
        }
      } else if (activeUserId) {
        setSyncStatus('loading')
        const result = await fetchResolvedCloudNumberSetState(activeUserId)
        if (result.error || !result.data) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        const { sets, selected, serverActiveId } = result.data
        setCloudNumberSets(sets)
        if (selected) {
          replaceNumberSetFromStorage(selected)
          cloudSetIdRef.current = selected.id
          setCloudSetId(selected.id)
          setHasCloudDraft(true)
          setCloudDraftSavedAt(selected.updatedAt)
          if (!result.preferenceError && serverActiveId !== selected.id) {
            const preferenceError = await rememberActiveCloudNumberSet(activeUserId, selected.id)
            if (preferenceError) {
              setSyncStatus('error')
              setSyncError(preferenceError)
              return preferenceError
            }
          }
          setSyncStatus('saved')
          return null
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
      }

      return persistInputs(inputs, true, mode)
    },
    [activeUserId, cloudNumberSets, inputs, persistInputs, refreshLocalNumberSetState, rememberActiveCloudNumberSet, replaceNumberSetFromStorage, storageMode],
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
          const nextSets = cloudNumberSets.filter((set) => set.id !== deletedSetId)
          const nextActive = nextSets[0] ?? null
          setCloudNumberSets(nextSets)
          cloudSetIdRef.current = nextActive?.id ?? null
          setCloudSetId(nextActive?.id ?? null)
          setHasCloudDraft(nextSets.length > 0)
          setCloudDraftSavedAt(nextActive?.updatedAt ?? null)
          const preferenceError = await rememberActiveCloudNumberSet(
            activeUserId,
            nextActive?.id ?? null,
          )
          if (preferenceError) {
            setSyncStatus('error')
            setSyncError(preferenceError)
            return preferenceError
          }
        } else {
          cloudSetIdRef.current = null
          setCloudSetId(null)
          setHasCloudDraft(false)
          setCloudDraftSavedAt(null)
        }
      }

      setSaveEnabledState(false)
      writeSaveEnabled(false)
      setSyncStatus('idle')
      setSyncError(null)
      replaceInputsFromStorage(defaultInputs)
      return null
    },
    [activeUserId, cloudNumberSets, refreshLocalNumberSetState, rememberActiveCloudNumberSet, replaceInputsFromStorage],
  )

  const setStorageMode = useCallback((mode: SaveStorageMode) => {
    suppressNextPersistRef.current = true
    setStorageModeState(mode)
    writeStorageMode(mode)
    if (mode === 'local') {
      const selected = readActiveLocalNumberSet()
      if (selected) replaceNumberSetFromStorage(selected)
      else replaceInputsFromStorage(defaultInputs)
      setHasLocalDraft(Boolean(selected))
      refreshLocalNumberSetState()
      setCloudSetId(null)
    }
    setSyncStatus('idle')
    setSyncError(null)
  }, [refreshLocalNumberSetState, replaceInputsFromStorage, replaceNumberSetFromStorage])

  const migrateLocalDraftToCloud = useCallback(async (): Promise<string | null> => {
    if (!activeUserId) return 'not_logged_in'
    const localDraft = loadDraft()
    const localPreset = readActiveLocalNumberSet()?.presetId ?? preset
    if (!localDraft) {
      setHasLocalDraft(false)
      setLocalDraftSavedAt(null)
      return 'no_local_draft'
    }

    setSaveEnabledState(true)
    writeSaveEnabled(true)
    setSyncStatus('saving')
    setSyncError(null)

    const result = await saveNumberSet(activeUserId, localDraft, localPreset, cloudSetIdRef.current)
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
    replaceNumberSetFromStorage(savedSet)
    setCloudSetId(savedSet.id)
    setHasCloudDraft(true)
    setCloudDraftSavedAt(savedSet.updatedAt)
    setCloudNumberSets((sets) => {
      const existing = sets.some((set) => set.id === savedSet.id)
      return existing
        ? sets.map((set) => (set.id === savedSet.id ? savedSet : set))
        : [savedSet, ...sets]
    })
    const preferenceError = await rememberActiveCloudNumberSet(activeUserId, savedSet.id)
    if (preferenceError) {
      setSyncStatus('error')
      setSyncError(preferenceError)
      return preferenceError
    }
    clearDraft()
    refreshLocalNumberSetState()
    setSyncStatus('saved')
    return null
  }, [activeUserId, preset, refreshLocalNumberSetState, rememberActiveCloudNumberSet, replaceNumberSetFromStorage])

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
        const localPreset = readActiveLocalNumberSet()?.presetId ?? preset
        if (!localDraft) {
          setHasLocalDraft(false)
          setLocalDraftSavedAt(null)
          setSyncStatus('idle')
          setSyncError(null)
          return 'no_local_draft'
        }

        setSyncStatus('saving')
        setSyncError(null)
        const result = await saveNumberSet(activeUserId, localDraft, localPreset, cloudSetIdRef.current)
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
        const preferenceError = await rememberActiveCloudNumberSet(activeUserId, savedSet.id)
        if (preferenceError) {
          setSyncStatus('error')
          setSyncError(preferenceError)
          return preferenceError
        }
        if (saveEnabled && storageMode === 'cloud') {
          replaceNumberSetFromStorage(savedSet)
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
        const result = await fetchResolvedCloudNumberSetState(activeUserId)
        if (result.error) {
          setSyncStatus('error')
          setSyncError(result.error)
          return result.error
        }
        const selected = result.data?.selected ?? null
        if (!selected) {
          setHasCloudDraft(false)
          setCloudSetId(null)
          setCloudDraftSavedAt(null)
          setSyncStatus('idle')
          return 'no_cloud_draft'
        }

        const savedAt = saveDraft(selected.inputs, selected.presetId ?? preset)
        if (!savedAt) {
          setSyncStatus('error')
          setSyncError('local_draft_save_failed')
          return 'local_draft_save_failed'
        }

        cloudSetIdRef.current = selected.id
        setCloudSetId(selected.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(selected.updatedAt)
        refreshLocalNumberSetState()
        setLocalDraftSavedAt(savedAt)
        if (saveEnabled && storageMode === 'local') {
          replaceNumberSetFromStorage(selected)
        }
        setSyncStatus('saved')
        setSyncError(null)
        return null
      }

      return 'unsupported_draft_copy'
    },
    [activeUserId, preset, refreshLocalNumberSetState, rememberActiveCloudNumberSet, replaceNumberSetFromStorage, saveEnabled, storageMode],
  )

  const copyNumberSetValues = useCallback(
    async (
      sourceMode: SaveStorageMode,
      sourceSetId: string,
      targetMode: SaveStorageMode,
      targetSetId: string,
    ): Promise<string | null> => {
      if (sourceMode === targetMode && sourceSetId === targetSetId) return null

      const sourceSets = sourceMode === 'local' ? localNumberSets : cloudNumberSets
      const sourceSet = sourceSets.find((set) => set.id === sourceSetId)
      if (!sourceSet) return 'number_set_not_found'
      const sourcePreset = sourceSet.presetId ?? preset

      if (targetMode === 'local') {
        const targetSet = localNumberSets.find((set) => set.id === targetSetId)
        if (!targetSet) return 'number_set_not_found'

        const updatedSets = upsertLocalNumberSet(
          localNumberSets,
          targetSetId,
          sourceSet.inputs,
          { presetId: sourcePreset },
        )
        writeLocalNumberSets(localStorage, updatedSets)
        const refreshed = refreshLocalNumberSetState()
        const updatedTarget = refreshed.sets.find((set) => set.id === targetSetId)
        if (
          updatedTarget &&
          saveEnabled &&
          storageMode === 'local' &&
          activeLocalSetId === targetSetId
        ) {
          replaceNumberSetFromStorage(updatedTarget)
        }
        setSyncStatus('saved')
        setSyncError(null)
        return null
      }

      if (!activeUserId) {
        setSyncStatus('error')
        setSyncError('not_logged_in')
        return 'not_logged_in'
      }
      if (!cloudNumberSets.some((set) => set.id === targetSetId)) {
        return 'number_set_not_found'
      }

      setSyncStatus('saving')
      setSyncError(null)
      const result = await saveNumberSet(
        activeUserId,
        sourceSet.inputs,
        sourcePreset,
        targetSetId,
      )
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
      setCloudNumberSets((sets) =>
        sets.map((set) => (set.id === savedSet.id ? savedSet : set)),
      )
      if (saveEnabled && storageMode === 'cloud' && cloudSetId === targetSetId) {
        setCloudDraftSavedAt(savedSet.updatedAt)
        replaceNumberSetFromStorage(savedSet)
      }
      setSyncStatus('saved')
      setSyncError(null)
      return null
    },
    [
      activeLocalSetId,
      activeUserId,
      cloudNumberSets,
      cloudSetId,
      localNumberSets,
      preset,
      refreshLocalNumberSetState,
      replaceNumberSetFromStorage,
      saveEnabled,
      storageMode,
    ],
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
        replaceNumberSetFromStorage(selected)
        setSyncStatus('saved')
        return null
      }

      if (!activeUserId) return 'not_logged_in'
      const selected = cloudNumberSets.find((set) => set.id === setId)
      if (!selected) return 'number_set_not_found'
      cloudSetIdRef.current = selected.id
      setCloudSetId(selected.id)
      const preferenceError = await rememberActiveCloudNumberSet(activeUserId, selected.id)
      if (preferenceError) {
        setSyncStatus('error')
        setSyncError(preferenceError)
        return preferenceError
      }
      setHasCloudDraft(true)
      setCloudDraftSavedAt(selected.updatedAt)
      replaceNumberSetFromStorage(selected)
      setSyncStatus('saved')
      return null
    },
    [activeUserId, cloudNumberSets, rememberActiveCloudNumberSet, replaceNumberSetFromStorage],
  )

  const createNumberSet = useCallback(
    async (mode: SaveStorageMode): Promise<string | null> => {
      setSyncError(null)
      if (mode === 'local') {
        const sets = readLocalNumberSetState()
        if (sets.length >= numberSetLimits.local) return 'number_set_limit_reached'
        const result = appendLocalNumberSet(sets, inputs, {
          presetId: preset,
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
        preset,
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
      const preferenceError = await rememberActiveCloudNumberSet(activeUserId, createdSet.id)
      if (preferenceError) {
        setSyncStatus('error')
        setSyncError(preferenceError)
        return preferenceError
      }
      setHasCloudDraft(true)
      setCloudDraftSavedAt(createdSet.updatedAt)
      replaceNumberSetFromStorage(createdSet)
      setSyncStatus('saved')
      return null
    },
    [
      activeUserId,
      cloudNumberSets.length,
      inputs,
      preset,
      numberSetLimits.cloud,
      numberSetLimits.local,
      rememberActiveCloudNumberSet,
      replaceNumberSetFromStorage,
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

  const setNumberSetMemo = useCallback(
    async (mode: SaveStorageMode, setId: string, memo: string): Promise<string | null> => {
      if (mode === 'local') {
        return 'local_number_set_memo_unsupported'
      }

      if (!activeUserId) return 'not_logged_in'
      const result = await updateCloudNumberSetMemo(activeUserId, setId, memo)
      if (result.error) return result.error
      if (!result.data) return 'number_set_not_found'
      const updatedSet = result.data
      setCloudNumberSets((sets) =>
        sets.map((set) => (set.id === updatedSet.id ? updatedSet : set)),
      )
      return null
    },
    [activeUserId],
  )

  const setNumberSetPreset = useCallback(
    async (mode: SaveStorageMode, setId: string, presetId: PresetId): Promise<string | null> => {
      if (mode === 'local') {
        const nextSets = setLocalNumberSetPreset(readLocalNumberSetState(), setId, presetId)
        if (!nextSets.some((set) => set.id === setId)) return 'number_set_not_found'
        writeLocalNumberSets(localStorage, nextSets)
        refreshLocalNumberSetState()
        if (storageMode === 'local' && activeLocalSetId === setId && preset !== presetId) {
          suppressNextPresetPersistRef.current = true
          setPreset(presetId)
        }
        return null
      }

      if (!activeUserId) return 'not_logged_in'
      const result = await setCloudNumberSetPreset(activeUserId, setId, presetId)
      if (result.error) return result.error
      const updatedSet = result.data
      if (!updatedSet) return 'number_set_not_found'
      setCloudNumberSets((sets) =>
        sets.map((set) => (set.id === updatedSet.id ? updatedSet : set)),
      )
      if (storageMode === 'cloud' && cloudSetIdRef.current === setId && preset !== presetId) {
        suppressNextPresetPersistRef.current = true
        setPreset(presetId)
      }
      return null
    },
    [activeLocalSetId, activeUserId, preset, refreshLocalNumberSetState, setPreset, storageMode],
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

  const setNumberSetRollover = useCallback(
    async (
      mode: SaveStorageMode,
      setId: string,
      settings: {
        enabled: boolean
        intervalMonths: RolloverIntervalMonths | null
        anchor: RolloverAnchor | null
        nextDate: string | null
      },
    ): Promise<string | null> => {
      // 롤오버 알림도 서버 크론이 접근하는 클라우드 슬롯 전용.
      if (mode === 'local') return 'auto_snapshot_local_unsupported'
      if (!activeUserId) return 'not_logged_in'
      const result = await setCloudNumberSetRollover(activeUserId, setId, settings)
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

  const clearNumberSetRolloverPending = useCallback(
    async (mode: SaveStorageMode, setId: string): Promise<string | null> => {
      if (mode === 'local') return 'auto_snapshot_local_unsupported'
      if (!activeUserId) return 'not_logged_in'
      const result = await clearCloudNumberSetRolloverPending(activeUserId, setId)
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
          if (nextActive) replaceNumberSetFromStorage(nextActive)
          else replaceInputsFromStorage(defaultInputs)
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
      const deletion = resolveNumberSetDeletionTransition(cloudNumberSets, cloudSetId, setId)
      const { nextSets } = deletion
      setCloudNumberSets(nextSets)
      const nextActive = nextSets.find((set) => set.id === deletion.nextActiveId) ?? null
      if (deletion.activeDeleted) {
        cloudSetIdRef.current = nextActive?.id ?? null
        setCloudSetId(nextActive?.id ?? null)
        setCloudDraftSavedAt(nextActive?.updatedAt ?? null)
        const preferenceError = await rememberActiveCloudNumberSet(
          activeUserId,
          nextActive?.id ?? null,
        )
        if (preferenceError) {
          setSyncStatus('error')
          setSyncError(preferenceError)
          return preferenceError
        }
        if (storageMode === 'cloud') {
          if (nextActive) replaceNumberSetFromStorage(nextActive)
          else replaceInputsFromStorage(defaultInputs)
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
      rememberActiveCloudNumberSet,
      replaceInputsFromStorage,
      replaceNumberSetFromStorage,
      storageMode,
    ],
  )

  useEffect(() => {
    const previousPreset = previousPresetRef.current
    previousPresetRef.current = preset
    if (previousPreset === preset) return
    if (suppressNextPresetPersistRef.current) {
      suppressNextPresetPersistRef.current = false
      return
    }
    if (!saveEnabled || !activeNumberSetId) return
    const timer = window.setTimeout(() => {
      void setNumberSetPreset(storageMode, activeNumberSetId, preset)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [activeNumberSetId, preset, saveEnabled, setNumberSetPreset, storageMode])

  useEffect(() => {
    if (sessionLoading) return
    let active = true
    let persistEditsAfterValidation = false
    storageBootstrapPendingRef.current = true
    const inputGenerationAtStart = inputEditGenerationRef.current

    async function syncConfiguredStorage() {
      if (!active) return

      if (!activeUserId) {
        cloudBootstrapUserIdRef.current = null
        cloudCacheWriteUserIdRef.current = null
        cloudNumberSetsRef.current = []
        setCloudNumberSets([])
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
      }

      if (!saveEnabled) {
        if (!devicePreferenceAtStartup && activeUserId) {
          setSyncStatus('loading')
          setSyncError(null)
          const result = await fetchResolvedCloudNumberSetState(activeUserId)
          if (!active) return
          if (result.error || !result.data) {
            setSyncStatus('error')
            setSyncError(result.error)
            return
          }

          const { sets, selected, serverActiveId } = result.data
          cloudNumberSetsRef.current = sets
          setCloudNumberSets(sets)
          setHasCloudDraft(sets.length > 0)
          cloudCacheWriteUserIdRef.current = activeUserId
          writeCloudNumberSetSnapshot(localStorage, activeUserId, sets, selected?.id ?? null)
          if (shouldOpenCloudAtStartup({
            hasDevicePreference: false,
            saveEnabled: false,
            storageMode,
            hasCloudSet: selected != null,
          }) && selected) {
            suppressNextPersistRef.current = true
            setStorageModeState('cloud')
            writeStorageMode('cloud')
            setSaveEnabledState(true)
            writeSaveEnabled(true)
            cloudSetIdRef.current = selected.id
            setCloudSetId(selected.id)
            setCloudDraftSavedAt(selected.updatedAt)
            replaceNumberSetFromStorage(selected)
            writeCachedActiveCloudNumberSetId(selected.id)
            if (!result.preferenceError && serverActiveId !== selected.id) {
              const preferenceError = await rememberActiveCloudNumberSet(
                activeUserId,
                selected.id,
              )
              if (preferenceError) {
                setSyncStatus('error')
                setSyncError(preferenceError)
                return
              }
            }
            setSyncStatus('saved')
            return
          }
        }
        setSyncStatus('idle')
        setSyncError(null)
        return
      }

      if (storageMode === 'local') {
        const selected = readActiveLocalNumberSet()
        if (selected) {
          replaceNumberSetFromStorage(selected)
          setSyncStatus('saved')
        } else {
          replaceInputsFromStorage(defaultInputs)
          setSyncStatus('idle')
        }
        setCloudSetId(null)
        refreshLocalNumberSetState()
        return
      }

      if (!activeUserId) {
        setSyncStatus('idle')
        setSyncError(null)
        return
      }

      setSyncError(null)
      const alreadyBootstrapped = cloudBootstrapUserIdRef.current === activeUserId
      let baseSnapshot: Pick<CloudNumberSetSnapshot, 'activeSetId' | 'sets'> | null = null

      if (alreadyBootstrapped) {
        baseSnapshot = {
          activeSetId: cloudSetIdRef.current,
          sets: cloudNumberSetsRef.current,
        }
      } else {
        cloudBootstrapUserIdRef.current = activeUserId
        cloudCacheWriteUserIdRef.current = null
        const cached = readCloudNumberSetSnapshot(localStorage, activeUserId)
        if (cached) {
          const cachedSelected = cached.sets.find((set) => set.id === cached.activeSetId) ?? null
          baseSnapshot = cached
          cloudNumberSetsRef.current = cached.sets
          setCloudNumberSets(cached.sets)
          cloudSetIdRef.current = cachedSelected?.id ?? null
          setCloudSetId(cachedSelected?.id ?? null)
          setHasCloudDraft(cached.sets.length > 0)
          setCloudDraftSavedAt(cachedSelected?.updatedAt ?? null)
          if (cachedSelected) replaceNumberSetFromStorage(cachedSelected)
          cloudCacheWriteUserIdRef.current = activeUserId
          setSyncStatus(cachedSelected ? 'saved' : 'idle')
        } else {
          cloudNumberSetsRef.current = []
          setCloudNumberSets([])
          cloudSetIdRef.current = null
          setCloudSetId(null)
          setHasCloudDraft(false)
          setCloudDraftSavedAt(null)
          setSyncStatus('loading')
        }
      }

      if (baseSnapshot) {
        const revisionResult = await fetchCloudNumberSetRevisionState(
          activeUserId,
          baseSnapshot.activeSetId,
        )
        if (!active) return
        if (revisionResult.error || !revisionResult.data) {
          setSyncStatus('error')
          setSyncError(revisionResult.error)
          return
        }
        if (cloudSnapshotMatchesRevision(
          baseSnapshot,
          revisionResult.data.activeSetId,
          revisionResult.data.revisions,
        )) {
          persistEditsAfterValidation = inputEditGenerationRef.current !== inputGenerationAtStart
          setSyncStatus(baseSnapshot.activeSetId ? 'saved' : 'idle')
          refreshLocalNumberSetState()
          return
        }
      }

      if (!baseSnapshot) setSyncStatus('loading')
      const result = await fetchResolvedCloudNumberSetState(activeUserId)
      if (!active) return
      if (result.error || !result.data) {
        setSyncStatus('error')
        setSyncError(result.error)
        return
      }
      const { sets, selected, serverActiveId } = result.data
      const inputsChangedDuringValidation = inputEditGenerationRef.current !== inputGenerationAtStart
      const baseSelected = baseSnapshot?.sets.find(
        (set) => set.id === baseSnapshot?.activeSetId,
      ) ?? null
      const activeRevisionChanged =
        (baseSnapshot?.activeSetId ?? null) !== (selected?.id ?? null)
        || (baseSelected?.updatedAt ?? null) !== (selected?.updatedAt ?? null)
      cloudNumberSetsRef.current = sets
      setCloudNumberSets(sets)
      if (selected) {
        if (activeRevisionChanged && !inputsChangedDuringValidation) {
          suppressNextPersistRef.current = true
          replaceNumberSetFromStorage(selected)
        }
        cloudSetIdRef.current = selected.id
        setCloudSetId(selected.id)
        setHasCloudDraft(true)
        setCloudDraftSavedAt(selected.updatedAt)
        writeCachedActiveCloudNumberSetId(selected.id)
        if (!result.preferenceError && serverActiveId !== selected.id) {
          const preferenceError = await rememberActiveCloudNumberSet(activeUserId, selected.id)
          if (preferenceError) {
            setSyncStatus('error')
            setSyncError(preferenceError)
            return
          }
        }
        if (activeRevisionChanged && inputsChangedDuringValidation) {
          setSyncStatus('error')
          setSyncError('cloud_changed_while_editing')
        } else {
          persistEditsAfterValidation = inputsChangedDuringValidation
          setSyncStatus('saved')
        }
      } else {
        if (activeRevisionChanged && !inputsChangedDuringValidation) {
          replaceInputsFromStorage(defaultInputs)
        }
        cloudSetIdRef.current = null
        setCloudSetId(null)
        setHasCloudDraft(false)
        setCloudDraftSavedAt(null)
        if (activeRevisionChanged && inputsChangedDuringValidation) {
          setSyncStatus('error')
          setSyncError('cloud_changed_while_editing')
        } else {
          persistEditsAfterValidation = inputsChangedDuringValidation
          setSyncStatus('idle')
        }
      }
      cloudCacheWriteUserIdRef.current = activeUserId
      writeCloudNumberSetSnapshot(localStorage, activeUserId, sets, selected?.id ?? null)
      refreshLocalNumberSetState()
    }

    void syncConfiguredStorage().finally(() => {
      if (!active) return
      storageBootstrapPendingRef.current = false
      if (persistEditsAfterValidation) {
        void persistInputsRef.current(inputsRef.current)
      }
    })

    return () => {
      active = false
    }
  }, [
    activeUserId,
    cloudRevalidateNonce,
    devicePreferenceAtStartup,
    refreshLocalNumberSetState,
    rememberActiveCloudNumberSet,
    replaceInputsFromStorage,
    replaceNumberSetFromStorage,
    saveEnabled,
    sessionLoading,
    storageMode,
  ])

  useEffect(() => {
    if (sessionLoading) return
    if (!activeUserId) return
    if (!devicePreferenceAtStartup && !saveEnabled) return
    if (saveEnabled && storageMode === 'cloud') return

    let active = true
    const userId = activeUserId

    async function refreshCloudDraftPresence() {
      const result = await refreshCloudNumberSetState(userId)
      if (!active || result.error) return
      const hasDraft = (result.data ?? []).length > 0
      setHasCloudDraft(hasDraft)
    }

    void refreshCloudDraftPresence()

    return () => {
      active = false
    }
  }, [activeUserId, devicePreferenceAtStartup, refreshCloudNumberSetState, saveEnabled, sessionLoading, storageMode])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (suppressNextPersistRef.current) {
      suppressNextPersistRef.current = false
      return
    }
    if (!saveEnabled || sessionLoading || storageBootstrapPendingRef.current) return

    // 편집이 감지되는 즉시 미커밋(저장 대기) 상태로 표시해 저장 완료 체크(✓)를 숨긴다.
    // persistInputs가 500ms 뒤 실제 저장 결과('saved'/'idle'/'error')로 덮어쓴다.
    setSyncStatus('saving')
    const timer = window.setTimeout(() => {
      void persistInputs(inputs)
    }, 500)
    return () => window.clearTimeout(timer)
  }, [inputs, persistInputs, saveEnabled, sessionLoading])

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
        setNumberSetMemo,
        setNumberSetPreset,
        setNumberSetAutoSnapshot,
        setNumberSetRollover,
        clearNumberSetRolloverPending,
        deleteNumberSetById,
        migrateLocalDraftToCloud,
        copyDraftBetweenStorageModes,
        copyNumberSetValues,
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
