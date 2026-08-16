import { isPresetId } from '../i18n'
import type { NumberSetRecord } from '../db/numberSets'
import {
  isLocalDateString,
  isRolloverInterval,
} from '../db/rolloverSchedule'
import { parseStoredCalculatorInputs } from '../utils/storedCalculatorInputs'

export const CLOUD_NUMBER_SET_SNAPSHOT_KEY_PREFIX =
  'leverage_calculator_cloud_number_set_snapshot_v1:'

const SNAPSHOT_VERSION = 1

export interface CloudNumberSetRevision {
  id: string
  updatedAt: string
}

export interface CloudNumberSetSnapshot {
  version: typeof SNAPSHOT_VERSION
  userId: string
  activeSetId: string | null
  sets: NumberSetRecord[]
  cachedAt: string
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function snapshotKey(userId: string): string {
  return `${CLOUD_NUMBER_SET_SNAPSHOT_KEY_PREFIX}${userId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseNumberSetRecord(value: unknown): NumberSetRecord | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id) return null
  if (typeof value.title !== 'string') return null
  if (typeof value.updatedAt !== 'string' || !value.updatedAt) return null

  const inputs = parseStoredCalculatorInputs(value.inputs)
  if (!inputs) return null

  const rolloverValue = isRecord(value.rollover) ? value.rollover : {}
  const interval = rolloverValue.intervalMonths
  const nextDate = rolloverValue.nextDate

  return {
    id: value.id,
    title: value.title,
    inputs,
    memo: typeof value.memo === 'string' ? value.memo.slice(0, 500) : null,
    presetId: isPresetId(value.presetId) ? value.presetId : null,
    updatedAt: value.updatedAt,
    autoSnapshotEnabled: value.autoSnapshotEnabled === true,
    rollover: {
      enabled: rolloverValue.enabled === true,
      intervalMonths: isRolloverInterval(interval) ? interval : null,
      nextDate: isLocalDateString(nextDate) ? nextDate : null,
      pending: rolloverValue.pending === true,
    },
  }
}

export function readCloudNumberSetSnapshot(
  storage: StorageLike,
  userId: string,
): CloudNumberSetSnapshot | null {
  try {
    const raw = storage.getItem(snapshotKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if (parsed.version !== SNAPSHOT_VERSION || parsed.userId !== userId) return null
    if (parsed.activeSetId !== null && typeof parsed.activeSetId !== 'string') return null
    if (!Array.isArray(parsed.sets) || typeof parsed.cachedAt !== 'string') return null

    const sets = parsed.sets.map(parseNumberSetRecord)
    if (sets.some((set) => set == null)) return null
    const validSets = sets.filter((set): set is NumberSetRecord => set != null)
    const activeSetId = parsed.activeSetId as string | null
    if (activeSetId && !validSets.some((set) => set.id === activeSetId)) return null

    return {
      version: SNAPSHOT_VERSION,
      userId,
      activeSetId,
      sets: validSets,
      cachedAt: parsed.cachedAt,
    }
  } catch {
    return null
  }
}

export function writeCloudNumberSetSnapshot(
  storage: StorageLike,
  userId: string,
  sets: NumberSetRecord[],
  activeSetId: string | null,
  cachedAt = new Date().toISOString(),
): void {
  if (activeSetId && !sets.some((set) => set.id === activeSetId)) return
  const snapshot: CloudNumberSetSnapshot = {
    version: SNAPSHOT_VERSION,
    userId,
    activeSetId,
    sets,
    cachedAt,
  }
  try {
    storage.setItem(snapshotKey(userId), JSON.stringify(snapshot))
  } catch {
    // 브라우저 저장 공간 제한·보안 설정은 클라우드 저장 자체를 실패시키지 않는다.
  }
}

export function clearCloudNumberSetSnapshot(storage: StorageLike, userId: string): void {
  try {
    storage.removeItem(snapshotKey(userId))
  } catch {
    // 로그아웃은 브라우저 저장소 오류와 무관하게 계속 진행한다.
  }
}

export function cloudSnapshotMatchesRevision(
  snapshot: Pick<CloudNumberSetSnapshot, 'activeSetId' | 'sets'>,
  activeSetId: string | null,
  revisions: CloudNumberSetRevision[],
): boolean {
  if (snapshot.activeSetId !== activeSetId || snapshot.sets.length !== revisions.length) {
    return false
  }
  const revisionById = new Map(revisions.map((revision) => [revision.id, revision.updatedAt]))
  return snapshot.sets.every((set) => revisionById.get(set.id) === set.updatedAt)
}
