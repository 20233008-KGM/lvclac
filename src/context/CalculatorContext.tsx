import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { applyInputPatch, type CalculatorInputPatch } from '../calc/mtmLink'
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
const SAVE_ENABLED_KEY = 'leverage_save_enabled'
const SAVE_STORAGE_MODE_KEY = 'leverage_save_storage_mode'

export type SaveStorageMode = 'local' | 'cloud'
export type SaveSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface CalculatorContextValue {
  inputs: CalculatorInputs
  updateInputs: (patch: CalculatorInputPatch) => void
  resetInputs: () => void
  saveEnabled: boolean
  storageMode: SaveStorageMode
  cloudAvailable: boolean
  syncStatus: SaveSyncStatus
  syncError: string | null
  hasLocalDraft: boolean
  hasCloudDraft: boolean
  canMigrateLocalDraft: boolean
  setSaveEnabled: (enabled: boolean, mode?: SaveStorageMode) => Promise<string | null>
  pauseSaving: () => void
  deleteSavedData: (mode: SaveStorageMode) => Promise<string | null>
  setStorageMode: (mode: SaveStorageMode) => void
  migrateLocalDraftToCloud: () => Promise<string | null>
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

function saveDraft(inputs: CalculatorInputs): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(inputs))
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
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
  const [inputs, setInputs] = useState(() => getInitialInputs(readSaveEnabled()))
  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle')
  const [syncError, setSyncError] = useState<string | null>(null)
  const [cloudSetId, setCloudSetId] = useState<string | null>(null)
  const [hasLocalDraft, setHasLocalDraft] = useState(hasStoredDraft)
  const [hasCloudDraft, setHasCloudDraft] = useState(false)
  const cloudSetIdRef = useRef<string | null>(null)
  const mountedRef = useRef(false)
  const suppressNextPersistRef = useRef(false)

  useEffect(() => {
    cloudSetIdRef.current = cloudSetId
  }, [cloudSetId])

  const updateInputs = useCallback((patch: CalculatorInputPatch) => {
    setInputs((prev) => applyInputPatch(prev, patch))
  }, [])

  const resetInputs = useCallback(() => {
    setInputs({ ...defaultInputs })
  }, [])

  const replaceInputsFromStorage = useCallback((nextInputs: CalculatorInputs) => {
    suppressNextPersistRef.current = true
    setInputs({ ...nextInputs })
  }, [])

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
          setSyncStatus('idle')
          setSyncError(null)
          return null
        }

        if (!activeUserId) {
          setSyncStatus('idle')
          setSyncError(null)
          setHasCloudDraft(false)
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
        setSyncStatus('idle')
        return null
      }

      if (mode === 'local') {
        saveDraft(value)
        setHasLocalDraft(true)
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
        }

        setSyncStatus('idle')
        return null
      }

      if (mode === 'local') {
        const draft = loadDraft()
        if (draft) {
          replaceInputsFromStorage(draft)
          setHasLocalDraft(true)
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
          setSyncStatus('saved')
          return null
        }
        setCloudSetId(null)
        setHasCloudDraft(false)
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
    clearDraft()
    setHasLocalDraft(false)
    setSyncStatus('saved')
    return null
  }, [activeUserId, replaceInputsFromStorage])

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
        return
      }

      if (!activeUserId) {
        setSyncStatus('idle')
        setSyncError(null)
        setHasCloudDraft(false)
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
        setSyncStatus('saved')
      } else {
        replaceInputsFromStorage(defaultInputs)
        setCloudSetId(null)
        setHasCloudDraft(false)
        setSyncStatus('idle')
      }
      setHasLocalDraft(hasStoredDraft())
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
        resetInputs,
        saveEnabled,
        storageMode,
        cloudAvailable,
        syncStatus,
        syncError,
        hasLocalDraft,
        hasCloudDraft: cloudAvailable ? hasCloudDraft : false,
        canMigrateLocalDraft: Boolean(activeUserId && storageMode === 'cloud' && hasLocalDraft),
        setSaveEnabled,
        pauseSaving,
        deleteSavedData,
        setStorageMode,
        migrateLocalDraftToCloud,
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
