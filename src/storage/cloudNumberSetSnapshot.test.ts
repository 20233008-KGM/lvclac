import { describe, expect, it } from 'vitest'
import type { NumberSetRecord } from '../db/numberSets'
import {
  clearCloudNumberSetSnapshot,
  cloudSnapshotMatchesRevision,
  readCloudNumberSetSnapshot,
  writeCloudNumberSetSnapshot,
} from './cloudNumberSetSnapshot'

class MemoryStorage {
  private readonly values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

function numberSet(id: string, updatedAt: string): NumberSetRecord {
  return {
    id,
    title: `set-${id}`,
    inputs: { mode: 'evaluate', positionSide: 'long', equity: '1000' },
    memo: null,
    presetId: 'default',
    updatedAt,
    autoSnapshotEnabled: false,
    rollover: {
      enabled: false,
      intervalMonths: null,
      anchor: null,
      nextDate: null,
      pending: false,
    },
  }
}

describe('cloudNumberSetSnapshot', () => {
  it('isolates snapshots by account and restores a valid server-acknowledged value', () => {
    const storage = new MemoryStorage()
    writeCloudNumberSetSnapshot(storage, 'user-a', [numberSet('a', '2026-08-02T01:00:00Z')], 'a')

    expect(readCloudNumberSetSnapshot(storage, 'user-b')).toBeNull()
    expect(readCloudNumberSetSnapshot(storage, 'user-a')?.sets[0].inputs.equity).toBe('1000')
  })

  it('rejects a snapshot whose active set does not exist', () => {
    const storage = new MemoryStorage()
    writeCloudNumberSetSnapshot(storage, 'user-a', [numberSet('a', '2026-08-02T01:00:00Z')], 'missing')
    expect(readCloudNumberSetSnapshot(storage, 'user-a')).toBeNull()
  })

  it('compares both active selection and every set revision', () => {
    const snapshot = {
      activeSetId: 'a',
      sets: [
        numberSet('a', '2026-08-02T01:00:00Z'),
        numberSet('b', '2026-08-02T02:00:00Z'),
      ],
    }
    expect(cloudSnapshotMatchesRevision(snapshot, 'a', [
      { id: 'b', updatedAt: '2026-08-02T02:00:00Z' },
      { id: 'a', updatedAt: '2026-08-02T01:00:00Z' },
    ])).toBe(true)
    expect(cloudSnapshotMatchesRevision(snapshot, 'b', [
      { id: 'a', updatedAt: '2026-08-02T01:00:00Z' },
      { id: 'b', updatedAt: '2026-08-02T02:00:00Z' },
    ])).toBe(false)
    expect(cloudSnapshotMatchesRevision(snapshot, 'a', [
      { id: 'a', updatedAt: '2026-08-02T03:00:00Z' },
      { id: 'b', updatedAt: '2026-08-02T02:00:00Z' },
    ])).toBe(false)
  })

  it('clears the account snapshot on sign-out', () => {
    const storage = new MemoryStorage()
    writeCloudNumberSetSnapshot(storage, 'user-a', [numberSet('a', '2026-08-02T01:00:00Z')], 'a')
    clearCloudNumberSetSnapshot(storage, 'user-a')
    expect(readCloudNumberSetSnapshot(storage, 'user-a')).toBeNull()
  })
})
