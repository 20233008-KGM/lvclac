import type { Locale, PresetId } from '../types'
import type { PresetOverride } from './types'
import { koPresetOverrides } from './overrides/ko'
import { enPresetOverrides } from './overrides/en'

/**
 * 현재 언어·프리셋에 해당하는 오버라이드를 반환한다.
 * - `'default'`는 null(=베이스 어휘 그대로).
 * - en 오버라이드에 없는 프리셋은 빈 객체라도 존재하므로 null 폴백은 방어용.
 */
export function getPresetOverride(locale: Locale, presetId: PresetId): PresetOverride | null {
  if (presetId === 'default') return null
  const map = locale === 'en' ? enPresetOverrides : koPresetOverrides
  return map[presetId] ?? null
}

export { applyPreset, mergeOverride } from './applyPreset'
export {
  PRESET_STORAGE_KEY,
  detectInitialPreset,
  isPresetId,
  normalizePresetId,
  persistPreset,
} from './storage'
export type { PresetOverride } from './types'
export { koPresetOverrides } from './overrides/ko'
export { enPresetOverrides } from './overrides/en'
