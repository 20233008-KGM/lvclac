import { describe, it, expect } from 'vitest'
import { normalizePresetId } from './storage'
import { PRESET_IDS } from '../types'

describe('normalizePresetId', () => {
  it('알 수 없는/빈/null 값은 default로 수렴', () => {
    expect(normalizePresetId(null)).toBe('default')
    expect(normalizePresetId(undefined)).toBe('default')
    expect(normalizePresetId('')).toBe('default')
    expect(normalizePresetId('nope')).toBe('default')
    expect(normalizePresetId('INDEX')).toBe('default')
  })

  it('유효한 프리셋 id는 그대로 왕복', () => {
    for (const id of PRESET_IDS) {
      expect(normalizePresetId(id)).toBe(id)
    }
  })
})
