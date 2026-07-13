import { describe, expect, it } from 'vitest'
import {
  buildTimeZoneOptions,
  filterTimeZoneOptions,
  formatTimeZoneLabel,
  listTimeZones,
  timeZoneOffsetLabel,
  type TimeZoneOption,
} from './timeZoneOptions'

const OPTIONS: TimeZoneOption[] = [
  { tz: 'Asia/Seoul', city: 'Seoul', offset: 'GMT+9', offsetMinutes: 540, search: 'asia/seoul seoul gmt+9' },
  {
    tz: 'America/New_York',
    city: 'New York',
    offset: 'GMT-4',
    offsetMinutes: -240,
    search: 'america/new_york new york gmt-4',
  },
  {
    tz: 'Europe/London',
    city: 'London',
    offset: 'GMT+1',
    offsetMinutes: 60,
    search: 'europe/london london gmt+1',
  },
]

describe('filterTimeZoneOptions', () => {
  it('빈 검색어는 전체를 그대로 반환한다', () => {
    expect(filterTimeZoneOptions(OPTIONS, '')).toHaveLength(3)
    expect(filterTimeZoneOptions(OPTIONS, '   ')).toHaveLength(3)
  })

  it('도시 이름으로 대소문자 무시하고 찾는다', () => {
    const result = filterTimeZoneOptions(OPTIONS, 'YORK')
    expect(result).toHaveLength(1)
    expect(result[0].tz).toBe('America/New_York')
  })

  it('여러 토큰은 모두 포함되어야 통과한다(AND)', () => {
    expect(filterTimeZoneOptions(OPTIONS, 'new york')).toHaveLength(1)
    expect(filterTimeZoneOptions(OPTIONS, 'new seoul')).toHaveLength(0)
  })

  it('오프셋 문자열로도 찾는다', () => {
    const result = filterTimeZoneOptions(OPTIONS, 'gmt+9')
    expect(result).toHaveLength(1)
    expect(result[0].tz).toBe('Asia/Seoul')
  })
})

describe('formatTimeZoneLabel', () => {
  it('시간대와 오프셋을 한 줄로 합친다', () => {
    // 실제 Intl 결과(오프셋)는 환경/DST에 따라 다르므로 형태만 확인한다.
    expect(formatTimeZoneLabel('Asia/Seoul')).toMatch(/^Asia\/Seoul( \(GMT[+-]\d)/)
  })
})

describe('buildTimeZoneOptions', () => {
  it('오프셋 오름차순으로 정렬된다', () => {
    const options = buildTimeZoneOptions()
    expect(options.length).toBeGreaterThan(0)
    for (let i = 1; i < options.length; i += 1) {
      expect(options[i].offsetMinutes).toBeGreaterThanOrEqual(options[i - 1].offsetMinutes)
    }
  })

  it('한국 표준시가 목록에 포함된다', () => {
    expect(buildTimeZoneOptions().some((option) => option.tz === 'Asia/Seoul')).toBe(true)
  })
})

describe('listTimeZones / timeZoneOffsetLabel', () => {
  it('시간대 목록은 비어있지 않다', () => {
    expect(listTimeZones().length).toBeGreaterThan(0)
  })

  it('유효한 시간대의 오프셋 라벨은 GMT 형식이다', () => {
    expect(timeZoneOffsetLabel('Asia/Seoul')).toMatch(/^GMT[+-]\d/)
  })
})
