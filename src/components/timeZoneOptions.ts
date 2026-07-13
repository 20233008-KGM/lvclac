/**
 * 전체 IANA 시간대 목록 + 검색/표시 헬퍼.
 * 자동 스냅샷 시간대 선택(TimeZoneSelect)이 쓴다.
 * 목록은 브라우저 내장 Intl.supportedValuesOf('timeZone')(약 340~450개)를 쓰고,
 * 지원하지 않는 구형 환경은 대표 시간대 목록으로 폴백한다.
 */

/** 구형 브라우저 폴백용 대표 시간대(대륙별 주요 도시 + UTC). */
const FALLBACK_TIME_ZONES: readonly string[] = [
  'UTC',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Atlantic/Reykjavik',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Athens',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

/** 브라우저가 아는 전체 IANA 시간대. 지원 안 하면 대표 목록으로 폴백. */
export function listTimeZones(): string[] {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf
    if (typeof supported === 'function') {
      const zones = supported('timeZone')
      if (Array.isArray(zones) && zones.length > 0) return zones
    }
  } catch {
    // ignore — 폴백으로 진행
  }
  return [...FALLBACK_TIME_ZONES]
}

/** 시간대 → 현재 UTC 오프셋 라벨(예: "GMT+9", "GMT+5:30"). 실패 시 빈 문자열. */
export function timeZoneOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date())
    const name = parts.find((part) => part.type === 'timeZoneName')?.value
    if (name) return name === 'GMT' ? 'GMT+0' : name
  } catch {
    // ignore
  }
  return ''
}

/** 오프셋 라벨("GMT+5:30")을 정렬용 분 단위 숫자로. 파싱 실패 시 0. */
function offsetLabelToMinutes(label: string): number {
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(label)
  if (!match) return 0
  const sign = match[1] === '-' ? -1 : 1
  const hours = Number.parseInt(match[2], 10)
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0
  return sign * (hours * 60 + minutes)
}

/** 시간대 문자열의 마지막 구획을 도시 이름으로(밑줄→공백). 예: "America/New_York" → "New York". */
function cityLabel(tz: string): string {
  const last = tz.split('/').pop() ?? tz
  return last.replace(/_/g, ' ')
}

export interface TimeZoneOption {
  /** IANA 시간대 문자열(저장값). 예: "Asia/Seoul". */
  tz: string
  /** 도시 이름. 예: "Seoul". */
  city: string
  /** 오프셋 라벨. 예: "GMT+9". */
  offset: string
  /** 정렬용 오프셋(분). */
  offsetMinutes: number
  /** 소문자 검색 대상 문자열(tz + 도시 + 오프셋). */
  search: string
}

/** 전체 시간대를 오프셋 오름차순 → 이름순으로 정렬한 옵션 목록. */
export function buildTimeZoneOptions(): TimeZoneOption[] {
  const options = listTimeZones().map((tz): TimeZoneOption => {
    const offset = timeZoneOffsetLabel(tz)
    const city = cityLabel(tz)
    return {
      tz,
      city,
      offset,
      offsetMinutes: offsetLabelToMinutes(offset),
      search: `${tz} ${city} ${offset}`.toLowerCase(),
    }
  })
  options.sort((a, b) =>
    a.offsetMinutes !== b.offsetMinutes
      ? a.offsetMinutes - b.offsetMinutes
      : a.tz.localeCompare(b.tz),
  )
  return options
}

/** 검색어로 옵션 필터. 공백으로 나눈 모든 토큰이 검색 문자열에 포함되어야 통과. */
export function filterTimeZoneOptions(
  options: readonly TimeZoneOption[],
  query: string,
): TimeZoneOption[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...options]
  return options.filter((option) => tokens.every((token) => option.search.includes(token)))
}

/** 입력창·선택 표시용 한 줄 라벨. 예: "Asia/Seoul (GMT+9)". */
export function formatTimeZoneLabel(tz: string): string {
  const offset = timeZoneOffsetLabel(tz)
  return offset ? `${tz} (${offset})` : tz
}
