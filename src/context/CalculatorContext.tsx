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
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'

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
  canMigrateLocalDraft: boolean
  setSaveEnabled: (enabled: boolean) => Promise<string | null>
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
    return parseStoredCalculatorInputs(JSON.parse(raw))
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

  const persistInputs = useCallback(
    async (value: CalculatorInputs, force = false): Promise<string | null> => {
      if (!force && !saveEnabled) return null

      if (storageMode === 'local') {
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
      setSyncStatus('saved')
      return null
    },
    [activeUserId, saveEnabled, storageMode],
  )

  const setSaveEnabled = useCallback(
    async (enabled: boolean): Promise<string | null> => {
      setSaveEnabledState(enabled)
      writeSaveEnabled(enabled)
      setSyncError(null)

      if (!enabled) {
        if (storageMode === 'local') {
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
        }

        setSyncStatus('idle')
        return null
      }

      return persistInputs(inputs, true)
    },
    [activeUserId, inputs, persistInputs, storageMode],
  )

  const setStorageMode = useCallback((mode: SaveStorageMode) => {
    setStorageModeState(mode)
    writeStorageMode(mode)
    setSyncStatus('idle')
    setSyncError(null)
  }, [])

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

    suppressNextPersistRef.current = true
    setInputs(result.data.inputs)
    setCloudSetId(result.data.id)
    clearDraft()
    setHasLocalDraft(false)
    setSyncStatus('saved')
    return null
  }, [activeUserId])

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
          suppressNextPersistRef.current = true
          setInputs(draft)
          setSyncStatus('saved')
        } else {
          setSyncStatus('idle')
        }
        setCloudSetId(null)
        setHasLocalDraft(Boolean(draft))
        return
      }

      if (!activeUserId) {
        setSyncStatus('idle')
        setSyncError(null)
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
      if (result.data) {
        suppressNextPersistRef.current = true
        setInputs(result.data.inputs)
        setCloudSetId(result.data.id)
        setSyncStatus('saved')
      } else {
        setCloudSetId(null)
        setSyncStatus('idle')
      }
      setHasLocalDraft(hasStoredDraft())
    }

    void syncConfiguredStorage()

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
        canMigrateLocalDraft: Boolean(activeUserId && storageMode === 'cloud' && hasLocalDraft),
        setSaveEnabled,
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
