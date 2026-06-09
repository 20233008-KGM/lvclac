import { describe, expect, it } from 'vitest'
import {
  formatContractsCount,
  formatLeverage,
  formatNumber,
  formatPercent,
  formatToleranceDelta,
  formatTolerancePercent,
  roundTo,
} from './format'

describe('roundTo', () => {
  it('정수 반올림', () => {
    expect(roundTo(1234.56, 0)).toBe(1235)
    expect(roundTo(1234.44, 0)).toBe(1234)
  })

  it('소수 둘째 자리 반올림', () => {
    expect(roundTo(5714.2857, 2)).toBe(5714.29)
    expect(roundTo(0.7144, 2)).toBe(0.71)
  })
})

describe('formatNumber', () => {
  it('금액·가격은 정수로 표시', () => {
    expect(formatNumber(1_234_567.89)).toBe('1,234,568')
    expect(formatNumber(266_377.36)).toBe('266,377')
    expect(formatNumber(347.5)).toBe('348')
  })
})

describe('formatPercent', () => {
  it('불필요한 0 제거', () => {
    expect(formatPercent(5)).toBe('5%')
    expect(formatPercent(0.714)).toBe('0.71%')
    expect(formatPercent(12.1)).toBe('12.1%')
  })
})

describe('formatContractsCount', () => {
  it('NaN은 -', () => {
    expect(formatContractsCount(Number.NaN, '계약')).toBe('-')
  })

  it('정상 계약 수', () => {
    expect(formatContractsCount(3, '계약')).toBe('3\u00a0계약')
  })
})

describe('formatLeverage', () => {
  it('레버리지 배수', () => {
    expect(formatLeverage(10, '배')).toBe('10배')
    expect(formatLeverage(3.5, 'x')).toBe('3.5x')
  })

  it('NaN은 -', () => {
    expect(formatLeverage(Number.NaN, '배')).toBe('-')
  })
})

describe('formatTolerancePercent', () => {
  it('롱은 마이너스', () => {
    expect(formatTolerancePercent(17.06, 'long')).toBe('-17.06')
  })

  it('숏은 플러스', () => {
    expect(formatTolerancePercent(10.92, 'short')).toBe('+10.92')
  })

  it('0은 부호 없음', () => {
    expect(formatTolerancePercent(0, 'long')).toBe('0')
  })
})

describe('formatToleranceDelta', () => {
  it('롱은 하락폭에 마이너스', () => {
    expect(formatToleranceDelta(6982.5, 'long')).toBe('-6,983')
    expect(formatToleranceDelta(2.5, 'long')).toBe('-3')
  })

  it('숏은 상승폭에 플러스', () => {
    expect(formatToleranceDelta(6982.5, 'short')).toBe('+6,983')
    expect(formatToleranceDelta(2.5, 'short')).toBe('+3')
  })

  it('0은 부호 없음', () => {
    expect(formatToleranceDelta(0, 'long')).toBe('0')
    expect(formatToleranceDelta(0, 'short')).toBe('0')
  })
})
