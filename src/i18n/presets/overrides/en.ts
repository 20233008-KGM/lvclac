import type { PresetId, PresetOverride } from '../types'

type NamedPreset = Exclude<PresetId, 'default'>

/**
 * 영문 베이스(en.ts)는 이미 상품 무관에 가깝게 제네릭하다
 * ('Entry price', 'Notional', 'Initial margin', 'Open contracts', 'Contract multiplier').
 * 그래서 en 오버라이드는 **실제로 다른 항목만** 담고 나머지는 베이스를 그대로 쓴다
 * (ko처럼 canonical 전체를 강제하지 않음 — 무결성 테스트에서 en은 느슨하게 검증).
 */
export const enPresetOverrides: Record<NamedPreset, PresetOverride> = {
  index: {},
  stock: {},
  commodity: {
    fields: { contractMultiplier: { label: 'Contract size (unit)' } },
  },
  fx: {
    fields: {
      contractAmount: { label: 'Entry rate' },
      contracts: { label: 'Lots' },
      contractMultiplier: { label: 'Contract size (lot)' },
      entrustedMarginPerContract: { label: 'Initial margin (per lot)' },
    },
    results: {
      perContractEntrusted: 'Init./lot',
      perContractEntrustedTitle: 'Initial margin per lot',
    },
  },
  cfd: {
    fields: {
      contracts: { label: 'Position size (units)' },
    },
  },
}
