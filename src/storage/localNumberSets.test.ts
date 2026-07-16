import { describe, expect, it } from 'vitest'
import { defaultInputs, sampleInputs } from '../types'
import {
  DEFAULT_LOCAL_NUMBER_SET_ID,
  LOCAL_NUMBER_SETS_KEY,
  appendLocalNumberSet,
  deleteLocalNumberSet,
  loadLocalNumberSets,
  renameLocalNumberSet,
  resolveActiveLocalNumberSetId,
  upsertLocalNumberSet,
  writeLocalNumberSets,
  writeActiveLocalNumberSetId,
} from './localNumberSets'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

describe('local number sets', () => {
  it('migrates a legacy single local draft into the default local set', () => {
    const storage = new MemoryStorage()

    const result = loadLocalNumberSets(storage, sampleInputs, '2026-07-10T01:02:03.000Z')

    expect(result.migrated).toBe(true)
    expect(result.sets).toEqual([
      {
        id: DEFAULT_LOCAL_NUMBER_SET_ID,
        title: '기본 세트',
        inputs: sampleInputs,
        updatedAt: '2026-07-10T01:02:03.000Z',
      },
    ])
    expect(storage.getItem(LOCAL_NUMBER_SETS_KEY)).toContain(DEFAULT_LOCAL_NUMBER_SET_ID)
  })

  it('keeps the active local set id valid when sets are renamed or deleted', () => {
    const storage = new MemoryStorage()
    const first = appendLocalNumberSet([], defaultInputs, {
      id: 'local-a',
      title: '기본 세트',
      updatedAt: '2026-07-10T01:00:00.000Z',
    })
    const second = appendLocalNumberSet(first.sets, sampleInputs, {
      id: 'local-b',
      title: '롤오버 기준',
      updatedAt: '2026-07-10T02:00:00.000Z',
    })
    writeLocalNumberSets(storage, second.sets)
    writeActiveLocalNumberSetId(storage, 'local-b')

    const renamed = renameLocalNumberSet(second.sets, 'local-b', '보수적 계약수')
    const deleted = deleteLocalNumberSet(renamed, 'local-b')

    expect(resolveActiveLocalNumberSetId(storage, deleted)).toBe('local-a')
    expect(deleted).toHaveLength(1)
    expect(deleted[0].title).toBe('기본 세트')
  })

  it('upserts the selected local set instead of creating a new slot on every save', () => {
    const existing = appendLocalNumberSet([], defaultInputs, {
      id: 'local-a',
      title: '기본 세트',
      updatedAt: '2026-07-10T01:00:00.000Z',
    }).sets

    const next = upsertLocalNumberSet(existing, 'local-a', sampleInputs, {
      updatedAt: '2026-07-10T02:00:00.000Z',
    })

    expect(next).toHaveLength(1)
    expect(next[0]).toMatchObject({
      id: 'local-a',
      title: '기본 세트',
      inputs: sampleInputs,
      updatedAt: '2026-07-10T02:00:00.000Z',
    })
  })

  it('drops memo data written by the short-lived local memo experiment', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      LOCAL_NUMBER_SETS_KEY,
      JSON.stringify([
        {
          id: 'local-a',
          title: '기본 세트',
          inputs: defaultInputs,
          memo: '로컬에는 남기지 않음',
          updatedAt: '2026-07-10T01:00:00.000Z',
        },
      ]),
    )

    const result = loadLocalNumberSets(storage, null, null)
    expect(result.sets[0]).not.toHaveProperty('memo')
    expect(storage.getItem(LOCAL_NUMBER_SETS_KEY)).not.toContain('memo')
  })
})
