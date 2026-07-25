import { describe, it, expect } from 'vitest'
import { normalizePresetId } from './storage'
import { PRESET_IDS } from '../types'

describe('normalizePresetId', () => {
  it('알 수 없는/빈/null 값은 지수선물로 수렴', () => {
    expect(normalizePresetId(null)).toBe('index')
    expect(normalizePresetId(undefined)).toBe('index')
    expect(normalizePresetId('')).toBe('index')
    expect(normalizePresetId('nope')).toBe('index')
    expect(normalizePresetId('INDEX')).toBe('index')
  })

  it('구버전 프리셋 값은 지수선물로 수렴', () => {
    expect(normalizePresetId('default')).toBe('index')
    expect(normalizePresetId('fx')).toBe('index')
    expect(normalizePresetId('cfd')).toBe('index')
  })

  it('유효한 프리셋 id는 그대로 왕복', () => {
    for (const id of PRESET_IDS) {
      expect(normalizePresetId(id)).toBe(id)
    }
  })
})
