import type { Locale, PresetId } from '../types'
import type { PresetOverride } from './types'
import { koPresetOverrides } from './overrides/ko'
import { enPresetOverrides } from './overrides/en'

/**
 * 현재 언어·프리셋에 해당하는 오버라이드를 반환한다.
 * - 공개판은 지수·종목·원자재 선물 프리셋만 허용한다.
 * - 맵 누락 시 null 폴백은 방어용이다.
 */
export function getPresetOverride(locale: Locale, presetId: PresetId): PresetOverride | null {
  const map = locale === 'en' ? enPresetOverrides : koPresetOverrides
  return map[presetId] ?? null
}

export { applyPreset, mergeOverride } from './applyPreset'
export {
  PRESET_STORAGE_KEY,
  detectInitialPreset,
  normalizePresetId,
  persistPreset,
} from './storage'
export type { PresetOverride } from './types'
export { koPresetOverrides } from './overrides/ko'
export { enPresetOverrides } from './overrides/en'
