import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { useDebouncedSave } from '../hooks/useDebouncedSave'
import { applyInputPatch, type CalculatorInputPatch } from '../calc/mtmLink'
import { defaultInputs, type CalculatorInputs } from '../types'
import { normalizeStoredRate } from '../utils/inputFormat'
import { sanitizeDraftInputs } from '../utils/sanitizeDraftInputs'

const DRAFT_KEY = 'leverage_calculator_draft'
const SAVE_ENABLED_KEY = 'leverage_save_enabled'

interface CalculatorContextValue {
  inputs: CalculatorInputs
  updateInputs: (patch: CalculatorInputPatch) => void
  resetInputs: () => void
  saveEnabled: boolean
  setSaveEnabled: (enabled: boolean) => void
}

const CalculatorContext = createContext<CalculatorContextValue | null>(null)

function mergeInputs(prefs: Partial<CalculatorInputs>): CalculatorInputs {
  const legacy = prefs as Partial<CalculatorInputs> & {
    additionalContracts?: number
    priceMultiplier?: number
    maintenanceMargin?: number
  }
  const positionSide = prefs.positionSide ?? 'long'
  // 모드 미저장(구버전) 마이그레이션: 직접 총액이 있으면 total, 아니면 rate
  const marginInputMode =
    prefs.marginInputMode ??
    ((prefs.maintenanceMargin ?? legacy.maintenanceMargin) != null ||
    prefs.entrustedMargin != null
      ? 'total'
      : 'rate')
  return sanitizeDraftInputs({
    ...defaultInputs,
    ...prefs,
    mode: prefs.mode ?? 'evaluate',
    marginInputMode,
    positionSide,
    evalSnapshotSide: prefs.evalSnapshotSide ?? positionSide,
    maintenanceMarginRate: normalizeStoredRate(prefs.maintenanceMarginRate),
    maintenanceMargin: prefs.maintenanceMargin ?? legacy.maintenanceMargin,
    entrustedMarginRate: normalizeStoredRate(prefs.entrustedMarginRate),
    contractMultiplier:
      prefs.contractMultiplier ??
      (typeof legacy.priceMultiplier === 'number' ? legacy.priceMultiplier : undefined),
    orderContracts:
      prefs.orderContracts ??
      (typeof legacy.additionalContracts === 'number' ? legacy.additionalContracts : undefined),
  })
}

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

function loadDraft(): CalculatorInputs {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return defaultInputs
    return mergeInputs(JSON.parse(raw) as Partial<CalculatorInputs>)
  } catch {
    return defaultInputs
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

function getInitialInputs(saveEnabled: boolean): CalculatorInputs {
  return saveEnabled ? loadDraft() : defaultInputs
}

export function CalculatorProvider({ children }: { children: ReactNode }) {
  const [saveEnabled, setSaveEnabledState] = useState(readSaveEnabled)
  const [inputs, setInputs] = useState(() => getInitialInputs(readSaveEnabled()))

  const updateInputs = useCallback((patch: CalculatorInputPatch) => {
    setInputs((prev) => applyInputPatch(prev, patch))
  }, [])

  const resetInputs = useCallback(() => {
    setInputs({ ...defaultInputs })
  }, [])

  const setSaveEnabled = useCallback((enabled: boolean) => {
    setSaveEnabledState(enabled)
    try {
      localStorage.setItem(SAVE_ENABLED_KEY, enabled ? '1' : '0')
      if (enabled) {
        setInputs((current) => {
          saveDraft(current)
          return current
        })
      } else {
        clearDraft()
      }
    } catch {
      // ignore
    }
  }, [])

  const persistDraft = useCallback(
    (value: CalculatorInputs) => {
      if (saveEnabled) saveDraft(value)
    },
    [saveEnabled],
  )

  useDebouncedSave(inputs, persistDraft)

  return (
    <CalculatorContext.Provider
      value={{ inputs, updateInputs, resetInputs, saveEnabled, setSaveEnabled }}
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
