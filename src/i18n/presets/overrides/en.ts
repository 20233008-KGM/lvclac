import type { PresetId, PresetOverride } from '../types'

/**
 * 영문 베이스(en.ts)는 지수·종목·원자재 선물에 공통인 제네릭 용어다
 * ('Entry price', 'Notional', 'Initial margin', 'Open contracts', 'Contract multiplier').
 * 공개판 고정 용어세트는 별도 오버라이드를 적용하지 않는다.
 */
export const enPresetOverrides: Record<PresetId, PresetOverride> = {
  futures: {},
}
