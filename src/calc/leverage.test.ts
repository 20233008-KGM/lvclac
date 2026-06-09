import { describe, expect, it } from 'vitest'
import {
  calcLiquidationPrice,
  calcLeverageRatio,
  calcMaxBuyable,
  calcToleranceDelta,
  calcToleranceRate,
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
  it('롱: 계좌평가 − 유지증거금 만큼 하락 시 청산', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'long')
    expect(price).toBeCloseTo(-6632.5, 1)
  })

  it('숏: 계좌평가 − 유지증거금 만큼 상승 시 청산', () => {
    const pointValue = getPointValue(250_000, 1, 350)!
    const maintenance = calcMarginFromNotional(calcContractNotional(2, 250_000, 1), 0.05)
    const price = calcLiquidationPrice(10_000_000, maintenance, 2, 350, pointValue, 'short')
    expect(price).toBeCloseTo(7332.5, 1)
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
    expect(result.liquidationPrice).toBeCloseTo(-6632.5, 1)
    expect(result.toleranceRate).toBeCloseTo(1995, 0)
    expect(result.margins?.maintenanceMargin).toBeCloseTo(25_000, 5)
    expect(result.margins?.entrustedMargin).toBeCloseTo(50_000, 5)
    expect(result.margins?.availableMargin).toBeCloseTo(9_950_000, 5)
    expect(result.margins?.perContractEntrusted).toBeCloseTo(25_000, 5)
    expect(result.margins?.perContractMaintenance).toBeCloseTo(12_500, 5)
    expect(result.margins?.contractNotional).toBeCloseTo(500_000, 5)
    expect(result.toleranceDelta).toBeCloseTo(6982.5, 1)
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
})

describe('calculateEvaluate (direct margin)', () => {
  it('약정금액·직접 증거금으로 청산가 산출', () => {
    const result = calculateEvaluate(directMarginSampleInputs)
    expect(result.margins?.contractNotional).toBe(500_000)
    expect(result.margins?.maintenanceMargin).toBe(2_000)
    expect(result.margins?.entrustedMargin).toBe(12_000)
    expect(result.liquidationPrice).toBeCloseTo(4_520, 1)
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
})
