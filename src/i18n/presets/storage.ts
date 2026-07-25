import { PRESET_IDS, type PresetId } from '../types'

/** 활성 용어 프리셋 저장 키. 환영 플로우의 "거래 종목" 선택과 단일 진실원으로 공유한다. */
export const PRESET_STORAGE_KEY = 'leverage_glossary_preset'

/** 화이트리스트 검증. 알 수 없는/빈/구버전 값은 모두 지수선물로 수렴. */
export function normalizePresetId(value: string | null | undefined): PresetId {
  return value && (PRESET_IDS as readonly string[]).includes(value)
    ? (value as PresetId)
    : 'index'
}

/** 초기 프리셋 복원. detectLocale.ts 패턴(window 가드 → localStorage → 검증 → 지수선물). */
export function detectInitialPreset(): PresetId {
  if (typeof window === 'undefined') return 'index'
  try {
    return normalizePresetId(localStorage.getItem(PRESET_STORAGE_KEY))
  } catch {
    return 'index'
  }
}

/** 프리셋 영속화. accountSettingGuard.ts 관용구(try/catch로 private 모드·쿼터 안전). */
export function persistPreset(id: PresetId): void {
  try {
    localStorage.setItem(PRESET_STORAGE_KEY, id)
  } catch {
    // ignore (private mode / quota)
  }
}
