import type { CalculatorInputs } from '../types'
import { isPresetId, type PresetId } from '../i18n'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'

export const LOCAL_NUMBER_SETS_KEY = 'leverage_calculator_local_number_sets_v1'
export const ACTIVE_LOCAL_NUMBER_SET_ID_KEY = 'leverage_calculator_active_local_number_set_id'
export const DEFAULT_LOCAL_NUMBER_SET_ID = 'local-default'
export const DEFAULT_NUMBER_SET_TITLE = '기본 세트'

export interface LocalNumberSetRecord {
  id: string
  title: string
  inputs: CalculatorInputs
  presetId: PresetId | null
  updatedAt: string
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface LocalNumberSetSeed {
  id?: string
  title?: string
  presetId?: PresetId | null
  updatedAt?: string
}

function timestamp(): string {
  return new Date().toISOString()
}

function makeLocalId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function sanitizeTitle(title: string | null | undefined): string {
  const trimmed = title?.trim()
  return trimmed || DEFAULT_NUMBER_SET_TITLE
}

function parseLocalNumberSet(value: unknown): LocalNumberSetRecord | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<LocalNumberSetRecord>
  if (typeof row.id !== 'string' || !row.id) return null
  const inputs = parseStoredCalculatorInputs(row.inputs)
  if (!inputs) return null
  return {
    id: row.id,
    title: sanitizeTitle(row.title),
    inputs,
    presetId: isPresetId(row.presetId) ? row.presetId : null,
    updatedAt: typeof row.updatedAt === 'string' && row.updatedAt ? row.updatedAt : timestamp(),
  }
}

export function readStoredLocalNumberSets(storage: StorageLike): LocalNumberSetRecord[] {
  try {
    const raw = storage.getItem(LOCAL_NUMBER_SETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(parseLocalNumberSet)
      .filter((row): row is LocalNumberSetRecord => row != null)
  } catch {
    return []
  }
}

export function writeLocalNumberSets(storage: StorageLike, sets: LocalNumberSetRecord[]): void {
  try {
    storage.setItem(LOCAL_NUMBER_SETS_KEY, JSON.stringify(sets))
  } catch {
    // ignore quota/private-mode failures
  }
}

export function writeActiveLocalNumberSetId(storage: StorageLike, setId: string | null): void {
  try {
    if (setId) storage.setItem(ACTIVE_LOCAL_NUMBER_SET_ID_KEY, setId)
    else storage.removeItem(ACTIVE_LOCAL_NUMBER_SET_ID_KEY)
  } catch {
    // ignore
  }
}

export function readActiveLocalNumberSetId(storage: StorageLike): string | null {
  try {
    return storage.getItem(ACTIVE_LOCAL_NUMBER_SET_ID_KEY)
  } catch {
    return null
  }
}

export function resolveActiveLocalNumberSetId(
  storage: StorageLike,
  sets: LocalNumberSetRecord[],
): string | null {
  const storedId = readActiveLocalNumberSetId(storage)
  if (storedId && sets.some((set) => set.id === storedId)) return storedId
  return sets[0]?.id ?? null
}

export function loadLocalNumberSets(
  storage: StorageLike,
  legacyDraft: CalculatorInputs | null,
  legacySavedAt: string | null,
): { sets: LocalNumberSetRecord[]; migrated: boolean } {
  const stored = readStoredLocalNumberSets(storage)
  if (stored.length > 0) {
    // 과거 시험 버전이 로컬 슬롯에 memo를 저장했더라도 정규화된 구조로 다시 써서 제거한다.
    writeLocalNumberSets(storage, stored)
    return { sets: stored, migrated: false }
  }
  if (!legacyDraft) return { sets: [], migrated: false }

  const migrated = [
    {
      id: DEFAULT_LOCAL_NUMBER_SET_ID,
      title: DEFAULT_NUMBER_SET_TITLE,
      inputs: legacyDraft,
      presetId: null,
      updatedAt: legacySavedAt ?? timestamp(),
    },
  ]
  writeLocalNumberSets(storage, migrated)
  writeActiveLocalNumberSetId(storage, DEFAULT_LOCAL_NUMBER_SET_ID)
  return { sets: migrated, migrated: true }
}

export function appendLocalNumberSet(
  sets: LocalNumberSetRecord[],
  inputs: CalculatorInputs,
  seed: LocalNumberSetSeed = {},
): { sets: LocalNumberSetRecord[]; set: LocalNumberSetRecord } {
  const set = {
    id: seed.id ?? makeLocalId(),
    title: sanitizeTitle(seed.title),
    inputs,
    presetId: seed.presetId ?? null,
    updatedAt: seed.updatedAt ?? timestamp(),
  }
  return { sets: [...sets, set], set }
}

export function upsertLocalNumberSet(
  sets: LocalNumberSetRecord[],
  setId: string | null,
  inputs: CalculatorInputs,
  seed: Omit<LocalNumberSetSeed, 'id'> = {},
): LocalNumberSetRecord[] {
  const targetId = setId ?? sets[0]?.id ?? DEFAULT_LOCAL_NUMBER_SET_ID
  const existing = sets.find((set) => set.id === targetId)
  const updated = {
    id: targetId,
    title: sanitizeTitle(seed.title ?? existing?.title),
    inputs,
    presetId: seed.presetId !== undefined ? seed.presetId : existing?.presetId ?? null,
    updatedAt: seed.updatedAt ?? timestamp(),
  }
  if (!existing) return [updated, ...sets]
  return sets.map((set) => (set.id === targetId ? updated : set))
}

export function renameLocalNumberSet(
  sets: LocalNumberSetRecord[],
  setId: string,
  title: string,
): LocalNumberSetRecord[] {
  return sets.map((set) =>
    set.id === setId ? { ...set, title: sanitizeTitle(title), updatedAt: timestamp() } : set,
  )
}

export function setLocalNumberSetPreset(
  sets: LocalNumberSetRecord[],
  setId: string,
  presetId: PresetId,
): LocalNumberSetRecord[] {
  return sets.map((set) =>
    set.id === setId ? { ...set, presetId, updatedAt: timestamp() } : set,
  )
}

export function deleteLocalNumberSet(
  sets: LocalNumberSetRecord[],
  setId: string,
): LocalNumberSetRecord[] {
  return sets.filter((set) => set.id !== setId)
}
