import type { PresetId, PresetOverride } from '../types'

/**
 * 지수·종목·원자재 선물이 공유하는 단일 한국어 선물 용어세트.
 * 현재 locale 기본 문구와 같은 계약을 명시해 호환 소비자에서도 용어가 달라지지 않는다.
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
    contractNotional: '포지션 크기',
    entryNotional: '약정가치',
    entrustedMargin: '총 위탁증거금',
    // 종속 서브라벨: 부모 용어(포지션 크기/위탁증거금)를 문자열로 품고 있어 함께 갈아야 일관됨
    leverageSub: '포지션 크기 ÷ 계좌 평가금액',
    availableMarginSub: '계좌 평가금액 − 위탁증거금',
    perContractEntrusted: '개시금/계약',
    perContractEntrustedTitle: '1계약당 개시·위탁증거금',
    afterEntrusted: '주문 후 위탁증거금',
  },
}

export const koPresetOverrides: Record<PresetId, PresetOverride> = {
  futures: futuresBase,
}
