import { describe, expect, it } from 'vitest'
import {
  calcLiquidationPrice,
  calcLeverageRatio,
  calcMaxBuyable,
  calcToleranceDelta,
  calcToleranceRate,
  buildAfterOrderInputs,
  calculateEvaluate,
  calculateOrder,
} from './leverage'
import { getPointValue, resolvePointValue } from './pointValue'
import {
  calcContractNotional,
  calcMarginFromNotional,
  calcPositionNotional,
} from './margins'
import { directMarginSampleInputs, sampleInputs } from '../types'

describe('getPointValue', () => {
  it('약정금액×계약승수 ÷ 현재가', () => {
    expect(getPointValue(200_000, 10, 350)).toBeCloseTo(5714.286, 2)
  })
})

describe('resolvePointValue', () => {
  it('약정금액×승수÷현재가로 산출', () => {
    expect(
      resolvePointValue({
        contractAmount: 250_000,
        contractMultiplier: 1,
        currentPrice: 350,
      }),
    ).toBeCloseTo(714.286, 2)
  })

  it('계약승수 미입력 시 1로 간주', () => {
    expect(
      resolvePointValue({
        contractAmount: 250_000,
        currentPrice: 350,
      }),
    ).toBeCloseTo(714.286, 2)
  })
})

describe('calcPositionNotional', () => {
  it('현재가 × 포인트가치 × 계약수', () => {
    expect(
      calcPositionNotional(
        {
          contractAmount: 250_000,
          contractMultiplier: 1,
          currentPrice: 5_000,
        },
        2,
      ),
    ).toBe(500_000)
  })

  it('명목가치 경로: 1계약 약정금액 × 승수 × 계약수', () => {
    expect(
      calcPositionNotional(
        {
          contractAmount: 250_000,
          contractMultiplier: 1,
          currentPrice: 350,
        },
        2,
      ),
    ).toBe(500_000)
  })

  it('price×pointValue 취소 시 부동소수 오차 없이 약정금액 경로 사용', () => {
    // 350 × (250_000/350) 는 IEEE754에서 250_000.00000000003 → maxBuyable 1계약 오차 유발
    expect(
      calcPositionNotional(
        { contractAmount: 250_000, contractMultiplier: 1, currentPrice: 350 },
        1,
      ),
    ).toBe(250_000)
  })
})

describe('calcContractNotional', () => {
  it('약정금액 × 계약승수 × 총 계약수', () => {
    expect(calcContractNotional(10, 200_000, 10)).toBe(20_000_000)
  })
})

describe('calcLiquidationPrice', () => {
  it('롱: 양의 가격 구간에서 청산 불가 시 null', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'long')
    expect(price).toBeNull()
  })

  it('숏: Equity(P)=Maintenance(P) 해에서 청산가', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'short')
    expect(price).toBeCloseTo(7_000, 0)
  })
})

describe('calcToleranceRate', () => {
  it('롱 하락율', () => {
    const rate = calcToleranceRate(350, 347.5, 'long')
    expect(rate).toBeCloseTo(0.714, 2)
  })
})

describe('calcToleranceDelta', () => {
  it('롱 하락폭', () => {
    expect(calcToleranceDelta(350, 347.5, 'long')).toBe(2.5)
  })

  it('숏 상승폭', () => {
    expect(calcToleranceDelta(350, 352.5, 'short')).toBe(2.5)
  })
})

describe('buildAfterOrderInputs', () => {
  it('포지션 확장 주문 시 약정가격을 가중평균으로 갱신', () => {
    const after = buildAfterOrderInputs(
      {
        mode: 'order',
        positionSide: 'long',
        accountEval: 1_000_000,
        contracts: 10,
        contractAmount: 100,
        contractAmountRole: 'entryPrice',
        contractMultiplier: 1,
        currentPrice: 105,
        orderPrice: 110,
      },
      12,
      2,
    )

    expect(after.contracts).toBe(12)
    expect(after.contractAmount).toBeCloseTo(101.6666667, 6)
  })

  it('포지션 축소 주문 시 남은 포지션 약정가격은 유지', () => {
    const after = buildAfterOrderInputs(
      {
        mode: 'order',
        positionSide: 'long',
        accountEval: 1_000_000,
        contracts: 10,
        contractAmount: 100,
        contractAmountRole: 'entryPrice',
        contractMultiplier: 1,
        currentPrice: 105,
        orderPrice: 110,
      },
      8,
      -2,
    )

    expect(after.contracts).toBe(8)
    expect(after.contractAmount).toBe(100)
  })

  it('롱 포지션 전량 청산 주문 시 약정가격을 0으로 초기화', () => {
    const after = buildAfterOrderInputs(
      {
        mode: 'order',
        positionSide: 'long',
        accountEval: 1_000_000,
        contracts: 10,
        contractAmount: 100,
        contractAmountRole: 'entryPrice',
        contractMultiplier: 1,
        currentPrice: 105,
        orderPrice: 110,
      },
      0,
      -10,
    )

    expect(after.contracts).toBe(0)
    expect(after.contractAmount).toBe(0)
  })

  it('숏 포지션 전량 청산 주문 시 약정가격을 0으로 초기화', () => {
    const after = buildAfterOrderInputs(
      {
        mode: 'order',
        positionSide: 'short',
        accountEval: 1_000_000,
        contracts: 10,
        contractAmount: 100,
        contractAmountRole: 'entryPrice',
        contractMultiplier: 1,
        currentPrice: 105,
        orderPrice: 110,
      },
      0,
      -10,
    )

    expect(after.contracts).toBe(0)
    expect(after.contractAmount).toBe(0)
  })

  it('기존 값과 주문가 스케일이 다르면 고정 스펙값으로 보고 덮어쓰지 않음', () => {
    const after = buildAfterOrderInputs(
      {
        mode: 'order',
        positionSide: 'long',
        accountEval: 1_000_000,
        contracts: 10,
        contractAmount: 250_000,
        contractMultiplier: 1,
        currentPrice: 350,
        orderPrice: 360,
      },
      12,
      2,
    )

    expect(after.contracts).toBe(12)
    expect(after.contractAmount).toBe(250_000)
  })

  it('preserves contract amount without entry price role even when order price has the same scale', () => {
    const base = {
      mode: 'order' as const,
      positionSide: 'long' as const,
      accountEval: 1_000_000_000,
      contracts: 58,
      contractAmount: 309_931,
      contractMultiplier: 1,
      currentPrice: 295_500,
      orderPrice: 295_500,
    }

    const unknownRole = buildAfterOrderInputs(base, 63, 5)
    const fixedSpec = buildAfterOrderInputs(
      { ...base, contractAmountRole: 'fixedSpec' as const },
      63,
      5,
    )

    expect(unknownRole.contractAmount).toBe(309_931)
    expect(fixedSpec.contractAmount).toBe(309_931)
  })

  it('전량 청산이면 entryPrice 역할이 아니어도 약정가격을 0으로 초기화', () => {
    const base = {
      mode: 'order' as const,
      positionSide: 'long' as const,
      accountEval: 1_000_000_000,
      contracts: 58,
      contractAmount: 309_931,
      contractMultiplier: 1,
      currentPrice: 295_500,
      orderPrice: 295_500,
    }

    const unknownRole = buildAfterOrderInputs(base, 0, -58)
    const fixedSpec = buildAfterOrderInputs(
      { ...base, contractAmountRole: 'fixedSpec' as const },
      0,
      -58,
    )

    expect(unknownRole.contractAmount).toBe(0)
    expect(fixedSpec.contractAmount).toBe(0)
  })
})

describe('calcLeverageRatio', () => {
  it('약정가치 ÷ 계좌 평가금액', () => {
    expect(calcLeverageRatio(500_000, 10_000_000)).toBe(0.05)
  })

  it('분모 0이면 null', () => {
    expect(calcLeverageRatio(500_000, 0)).toBeNull()
  })
})

describe('calcMaxBuyable', () => {
  it('위탁증거금이 계좌평가를 초과하면 0계약', () => {
    const entrusted = calcMarginFromNotional(
      calcContractNotional(2, 250_000, 1),
      0.1,
    )
    const perContract = calcContractNotional(1, 250_000, 1) * 0.1
    const { value } = calcMaxBuyable(10_000_000, entrusted, perContract)
    expect(value).toBe(398)
  })

  it('여유 증거금이 있으면 추가 매수 가능', () => {
    const entrusted = calcMarginFromNotional(
      calcContractNotional(1, 250_000, 1),
      0.1,
    )
    const perContract = calcContractNotional(1, 250_000, 1) * 0.1
    const { value } = calcMaxBuyable(20_000_000, entrusted, perContract)
    expect(value).toBe(799)
  })

  it('부동소수 나눗셈 경계에서 1계약 누락 방지', () => {
    const { value } = calcMaxBuyable(3_000_000, 25_000, 25_000)
    expect(value).toBe(119)
  })
})

describe('calculateEvaluate', () => {
  it('기본값으로 청산가·하락율 산출', () => {
    const result = calculateEvaluate(sampleInputs)
    expect(result.liquidationPrice).toBeNull()
    expect(result.toleranceRate).toBeNull()
    expect(result.margins?.maintenanceMargin).toBeCloseTo(25_000, 5)
    expect(result.margins?.entrustedMargin).toBeCloseTo(50_000, 5)
    expect(result.margins?.availableMargin).toBeCloseTo(9_950_000, 5)
    expect(result.margins?.perContractEntrusted).toBeCloseTo(25_000, 5)
    expect(result.margins?.perContractMaintenance).toBeCloseTo(12_500, 5)
    expect(result.margins?.contractNotional).toBeCloseTo(500_000, 5)
    expect(result.toleranceDelta).toBeNull()
    expect(result.leverageRatio).toBe(0.05)
  })

  it('약정금액·계약승수·비율로 유지증거금 산출', () => {
    const result = calculateEvaluate({
      ...sampleInputs,
      contracts: 10,
      contractAmount: 200_000,
      contractMultiplier: 10,
      maintenanceMarginRate: 0.2,
      currentPrice: 30_000,
    })
    expect(result.margins?.contractNotional).toBe(20_000_000)
    expect(result.margins?.maintenanceMargin).toBe(4_000_000)
  })

  it('직접 입력 유지증거금 우선', () => {
    const result = calculateEvaluate({
      ...sampleInputs,
      maintenanceMargin: 2_000_000,
    })
    expect(result.margins?.maintenanceMargin).toBe(2_000_000)
    expect(result.margins?.maintenanceMarginSource).toBe('direct')
    const pointValue = getPointValue(250_000, 1, 350)!
    expect(result.liquidationPrice).toBeCloseTo(
      calcLiquidationPrice(10_000_000, 2_000_000, 2, 350, pointValue, 'long')!,
      2,
    )
  })

  it('최소 입력(보유 0·약정금액 없음)으로 추가 매수 한도 산출', () => {
    const result = calculateEvaluate({
      mode: 'evaluate',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
      contracts: 0,
    })
    expect(result.maxBuyable).toBe(285_714)
    expect(result.maxBuyableMessage).toBeNull()
    expect(result.liquidationPrice).toBeNull()
    expect(result.margins?.availableMargin).toBe(10_000_000)
    expect(result.margins?.perContractEntrusted).toBeCloseTo(35, 5)
  })

  it('전량 청산 후 약정가격 0이면 현재가 기준 1계약 증거금과 한도 산출', () => {
    const result = calculateEvaluate({
      mode: 'evaluate',
      accountEval: 10_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 0,
      contractAmount: 0,
      contractMultiplier: 10,
      currentPrice: 350,
      positionSide: 'long',
    })

    expect(result.liquidationPrice).toBeNull()
    expect(result.margins?.availableMargin).toBe(10_000)
    expect(result.margins?.perContractEntrusted).toBeCloseTo(350, 5)
    expect(result.margins?.perContractMaintenance).toBeCloseTo(175, 5)
    expect(result.maxBuyable).toBe(28)
    expect(result.maxBuyableMessage).toBeNull()
  })

  it('약정금액 없이 보유 계약·현재가·증거금률만으로 청산가·한도 산출', () => {
    const result = calculateEvaluate({
      mode: 'evaluate',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 2,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'long',
    })
    expect(result.maxBuyable).toBe(285_712)
    expect(result.liquidationPrice).toBeNull()
    expect(result.margins?.entrustedMargin).toBeCloseTo(70, 5)
  })
})

describe('calculateEvaluate (direct margin)', () => {
  it('약정금액·직접 증거금으로 청산가 산출', () => {
    const result = calculateEvaluate(directMarginSampleInputs)
    expect(result.margins?.contractNotional).toBe(500_000)
    expect(result.margins?.maintenanceMargin).toBe(2_000)
    expect(result.margins?.entrustedMargin).toBe(12_000)
    expect(result.liquidationPrice).toBeNull()
    expect(result.leverageRatio).toBe(10)
    expect(result.maxBuyable).toBe(6)
  })
})

describe('calculateOrder', () => {
  it('주문 계약 수가 추가 매수 한도를 초과하면 경고', () => {
    const result = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 399,
    })
    expect(result.orderCapacityMessage).toBe('order_exceeds_max_buyable')
    expect(result.orderMessage).toBe('order_exceeds_max_buyable')
    expect(result.isAtRiskAfter).toBe(true)
  })

  it('추가 매수 한도 이내 주문은 경고 없음', () => {
    const result = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 1,
    })
    expect(result.orderCapacityMessage).toBeNull()
    expect(result.isAtRiskAfter).toBe(false)
  })

  it('음수 주문으로 포지션 축소 시뮬레이션', () => {
    const result = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: -1,
    })
    expect(result.orderCapacityMessage).toBeNull()
    expect(result.afterMargins?.entrustedMargin).toBeCloseTo(25_000, 5)
  })

  it('보유 계약보다 많이 매도하면 주문 후 결과 없음', () => {
    const result = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: -99,
    })
    expect(result.orderMessage).toBe('order_exceeds_position')
    expect(result.afterMargins).toBeNull()
  })

  it('주문가가 현재가와 같으면 기존 시뮬과 동일', () => {
    const atMark = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 1,
    })
    const explicit = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 1,
      orderPrice: sampleInputs.currentPrice,
    })
    expect(explicit.afterLiquidation).toBe(atMark.afterLiquidation)
    expect(explicit.afterMargins?.availableMargin).toBe(atMark.afterMargins?.availableMargin)
  })

  it('includes before and after contract amount in order result data', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 1_000_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 58,
      contractAmount: 309_931,
      contractAmountRole: 'entryPrice',
      contractMultiplier: 1,
      currentPrice: 295_500,
      positionSide: 'long',
      orderContracts: 5,
      orderPrice: 295_500,
    })

    expect(result.beforeContractAmount).toBe(309_931)
    expect(result.afterContractAmount).toBeCloseTo(308_785.68253968254, 8)
  })

  it('롱 — 저가 매수 시 주문 후 가용증거금 개선', () => {
    const atMark = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 1,
    })
    const belowMark = calculateOrder({
      ...sampleInputs,
      mode: 'order',
      orderContracts: 1,
      orderPrice: 340,
    })
    expect(belowMark.afterMargins!.availableMargin).toBeGreaterThan(
      atMark.afterMargins!.availableMargin,
    )
  })

  it('보유 0·약정금액 없이 현재가+증거금률만으로 신규 매수 시뮬', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contractMultiplier: 10,
      currentPrice: 350,
      positionSide: 'long',
      orderContracts: 2,
    })
    expect(result.orderMessage).toBeNull()
    expect(result.beforeLiquidation).toBeNull()
    expect(result.beforeMargins?.entrustedMargin).toBe(0)
    expect(result.afterMargins?.entrustedMargin).toBeCloseTo(700, 5)
    expect(result.afterLiquidation).toBeNull()
  })

  it('전량 청산 후 약정가격 0 상태의 한도 초과 신규 매수 주문은 경고', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 0,
      contractAmount: 0,
      contractMultiplier: 10,
      currentPrice: 350,
      positionSide: 'long',
      orderContracts: 29,
    })

    expect(result.orderCapacityMessage).toBe('order_exceeds_max_buyable')
    expect(result.orderMessage).toBe('order_exceeds_max_buyable')
    expect(result.isAtRiskAfter).toBe(true)
  })

  it('전량 청산 후 약정가격 0 상태의 한도 초과 신규 매도 주문은 경고', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contracts: 0,
      contractAmount: 0,
      contractMultiplier: 10,
      currentPrice: 350,
      positionSide: 'short',
      orderContracts: 29,
    })

    expect(result.orderCapacityMessage).toBe('order_exceeds_max_sellable')
    expect(result.orderMessage).toBe('order_exceeds_max_sellable')
    expect(result.isAtRiskAfter).toBe(true)
  })

  it('현재가 없을 때 주문가를 기준가로 신규 매수 시뮬', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contractMultiplier: 1,
      positionSide: 'long',
      orderContracts: 1,
      orderPrice: 350,
    })
    expect(result.orderMessage).toBeNull()
    expect(result.afterMargins).not.toBeNull()
    expect(result.afterLiquidation).toBeNull()
  })

  it('보유 0·약정금액 없이 현재가+증거금률만으로 신규 매도(숏) 시뮬', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10_000_000,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'short',
      orderContracts: 1,
    })
    expect(result.orderMessage).toBeNull()
    expect(result.beforeLiquidation).toBeNull()
    expect(result.afterLiquidation).not.toBeNull()
    expect(result.afterLiquidation!).toBeGreaterThan(350)
  })

  it('숏 — 증거금 대비 계좌가 작으면 청산가 미표시', () => {
    const result = calculateOrder({
      mode: 'order',
      accountEval: 10,
      maintenanceMarginRate: 0.05,
      entrustedMarginRate: 0.1,
      contractMultiplier: 1,
      currentPrice: 350,
      positionSide: 'short',
      orderContracts: 1,
    })
    expect(result.afterLiquidation).toBeNull()
  })
})
