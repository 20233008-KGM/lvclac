import { mergeOverride } from '../applyPreset'
import type { PresetId, PresetOverride } from '../types'

type NamedPreset = Exclude<PresetId, 'default'>

/**
 * 지수·종목·원자재 선물이 공유하는 국내 선물 어휘 베이스.
 * 대부분 현재(default) 라벨과 동일하지만, 세 프리셋이 canonical 키 셋을
 * 빠짐없이 덮도록 여기서 전부 명시한다(화면 간 어휘 혼용 방지).
 */
const futuresBase: PresetOverride = {
  fields: {
    contractAmount: { label: '약정가격' },
    contracts: { label: '보유 계약수' },
    contractMultiplier: { label: '계약승수(계약크기)' },
    entrustedMargin: { label: '위탁증거금 (총액)' },
    entrustedMarginRate: { label: '개시증거금률 (위탁)' },
    entrustedMarginPerContract: { label: '개시증거금 (계약당)' },
  },
  results: {
    contractNotional: '약정가치',
    entrustedMargin: '총 위탁증거금',
    // 종속 서브라벨: 부모 용어(약정가치/위탁증거금)를 문자열로 품고 있어 함께 갈아야 일관됨
    leverageSub: '약정가치 ÷ 계좌 평가금액',
    availableMarginSub: '계좌 평가금액 − 위탁증거금',
    perContractEntrusted: '개시금/계약',
    perContractEntrustedTitle: '1계약당 개시·위탁증거금',
    afterEntrusted: '주문 후 위탁증거금',
  },
}

export const koPresetOverrides: Record<NamedPreset, PresetOverride> = {
  // 지수선물: 진입값은 지수 포인트, 승수는 KRX식 '거래승수'
  index: mergeOverride(futuresBase, {
    fields: {
      contractAmount: { label: '진입 지수·가격' },
      contractMultiplier: { label: '거래승수' },
    },
  }),
  // 종목선물: 주당 가격 + 1계약당 주식 수(거래승수)
  stock: mergeOverride(futuresBase, {
    fields: {
      contractAmount: { label: '진입 가격(주당)' },
      contractMultiplier: { label: '거래승수(주식수)' },
    },
  }),
  // 원자재선물: 1계약 단위 크기(배럴·톤 등)
  commodity: mergeOverride(futuresBase, {
    fields: {
      contractAmount: { label: '진입 가격' },
      contractMultiplier: { label: '계약단위(계약크기)' },
    },
  }),
  // 외환(FX): 랏 단위 + 필요증거금 어휘
  fx: {
    fields: {
      contractAmount: { label: '진입 환율' },
      contracts: { label: '거래량(랏)' },
      contractMultiplier: { label: '계약 크기(랏)' },
      entrustedMargin: { label: '필요증거금 (총액)' },
      entrustedMarginRate: { label: '증거금률' },
      entrustedMarginPerContract: { label: '개시증거금 (랏당)' },
    },
    results: {
      contractNotional: '명목 금액',
      entrustedMargin: '총 필요증거금',
      leverageSub: '명목 금액 ÷ 계좌 평가금액',
      availableMarginSub: '계좌 평가금액 − 필요증거금',
      perContractEntrusted: '증거금/랏',
      perContractEntrustedTitle: '1랏당 필요증거금',
      afterEntrusted: '주문 후 필요증거금',
    },
  },
  // CFD: 수량 단위 + 필요증거금 어휘
  cfd: {
    fields: {
      contractAmount: { label: '진입 가격' },
      contracts: { label: '보유 수량' },
      contractMultiplier: { label: '계약 크기' },
      entrustedMargin: { label: '필요증거금 (총액)' },
      entrustedMarginRate: { label: '증거금률' },
      entrustedMarginPerContract: { label: '개시증거금 (계약당)' },
    },
    results: {
      contractNotional: '명목 금액',
      entrustedMargin: '총 필요증거금',
      leverageSub: '명목 금액 ÷ 계좌 평가금액',
      availableMarginSub: '계좌 평가금액 − 필요증거금',
      perContractEntrusted: '증거금/계약',
      perContractEntrustedTitle: '1계약당 필요증거금',
      afterEntrusted: '주문 후 필요증거금',
    },
  },
}
