import { describe, it, expect } from 'vitest'
import { normalizePresetId } from './storage'
import { PRESET_IDS } from '../types'

describe('normalizePresetId', () => {
  it('알 수 없는/빈/null 값은 공통 선물 용어세트로 수렴', () => {
    expect(normalizePresetId(null)).toBe('futures')
    expect(normalizePresetId(undefined)).toBe('futures')
    expect(normalizePresetId('')).toBe('futures')
    expect(normalizePresetId('nope')).toBe('futures')
    expect(normalizePresetId('INDEX')).toBe('futures')
  })

  it('모든 구버전 프리셋 값은 공통 선물 용어세트로 수렴', () => {
    expect(normalizePresetId('default')).toBe('futures')
    expect(normalizePresetId('index')).toBe('futures')
    expect(normalizePresetId('stock')).toBe('futures')
    expect(normalizePresetId('commodity')).toBe('futures')
    expect(normalizePresetId('fx')).toBe('futures')
    expect(normalizePresetId('cfd')).toBe('futures')
  })

  it('유효한 프리셋 id는 그대로 왕복', () => {
    for (const id of PRESET_IDS) {
      expect(normalizePresetId(id)).toBe(id)
    }
  })
})
