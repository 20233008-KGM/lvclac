import type { PresetId } from '../types'

/** 구버전 브라우저 저장값 식별용 레거시 키. 공개판 런타임에서는 읽거나 쓰지 않는다. */
export const PRESET_STORAGE_KEY = 'leverage_glossary_preset'

/** 어떤 과거 값이 들어와도 공개판의 단일 공통 선물 용어세트로 수렴한다. */
export function normalizePresetId(value: string | null | undefined): PresetId {
  void value
  return 'futures'
}

/** 공개판은 브라우저 저장값을 복원하지 않고 공통 선물 용어세트만 사용한다. */
export function detectInitialPreset(): PresetId {
  return 'futures'
}

/** 공개판 고정 용어세트는 별도 브라우저 설정으로 저장하지 않는다. */
export function persistPreset(id: PresetId): void {
  void id
}
