// 선물 롤오버(만기 이월) 일정 계산 — 순수 함수 모음.
//
// 우리는 "전세계 시장·종목의 만기 캘린더"를 조사·소유하지 않는다. 대신 Pro 유저가
// 자기 슬롯의 롤오버 "주기(interval)"와 "기준일 규칙(anchor)"만 고르면, 그 조합으로
// 다음 롤오버 예정일을 계산한다. 계산은 알림용이라 하루 정도 어긋나도 무해하다.
//
// 주기 phase(예: 격월이 짝수달이냐 홀수달이냐)는 기본적으로 시장 관행(month % interval)을
// 따르되, 유저가 "다음 예정일"을 직접 지정(override)하면 그 날짜가 phase 기준이 되고
// advanceRolloverDate가 그 위상을 유지한 채 interval개월씩 전진한다(곡물 등 불규칙월 흡수).

/** 기준일 규칙. 한국식 = 매월 둘째 주 목요일, 미국식 = 셋째 주 금요일. */
export type RolloverAnchor = 'second_thursday' | 'third_friday'

/** 롤오버 주기(개월). 매월=1, 격월=2, 분기=3, 반기=6. */
export type RolloverIntervalMonths = 1 | 2 | 3 | 6

export const ROLLOVER_INTERVALS: readonly RolloverIntervalMonths[] = [1, 2, 3, 6]
export const ROLLOVER_ANCHORS: readonly RolloverAnchor[] = ['second_thursday', 'third_friday']

export function isRolloverInterval(value: unknown): value is RolloverIntervalMonths {
  return typeof value === 'number' && (ROLLOVER_INTERVALS as readonly number[]).includes(value)
}

export function isRolloverAnchor(value: unknown): value is RolloverAnchor {
  return value === 'second_thursday' || value === 'third_friday'
}

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isLocalDateString(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_DATE_PATTERN.test(value)
}

interface YearMonth {
  year: number
  month: number // 1-12
}

function parseLocalDate(localDate: string): { year: number; month: number; day: number } {
  if (!isLocalDateString(localDate)) throw new Error('invalid_local_date')
  const [year, month, day] = localDate.split('-').map(Number)
  return { year, month, day }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalDateString(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/**
 * 해당 연·월의 n번째 특정 요일 날짜(YYYY-MM-DD)를 계산한다.
 * weekday: 0=일 … 6=토. n: 1부터.
 * UTC 기준으로만 산술하므로 시간대·DST 영향 없음(순수 달력 계산).
 */
export function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number,
): string {
  const firstDay = new Date(Date.UTC(year, month - 1, 1))
  const firstWeekday = firstDay.getUTCDay()
  const offset = (weekday - firstWeekday + 7) % 7
  const day = 1 + offset + (n - 1) * 7
  return toLocalDateString(year, month, day)
}

/** 기준일 규칙에 해당하는 그 달의 날짜. */
export function anchorDateInMonth(year: number, month: number, anchor: RolloverAnchor): string {
  if (anchor === 'second_thursday') return nthWeekdayOfMonth(year, month, 4, 2)
  return nthWeekdayOfMonth(year, month, 5, 3)
}

/** 시장 관행 기본 위상: 이 달이 해당 주기의 롤오버 달인가? */
function isQualifyingMonth(month: number, interval: RolloverIntervalMonths): boolean {
  if (interval === 1) return true
  // 격월=짝수달(금·은 관행), 분기=3·6·9·12, 반기=6·12.
  return month % interval === 0
}

function stepMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = month - 1 + delta
  const year2 = year + Math.floor(zeroBased / 12)
  const month2 = ((zeroBased % 12) + 12) % 12 + 1
  return { year: year2, month: month2 }
}

/**
 * fromLocalDate(포함) 이후 첫 롤오버 예정일을 기본 위상(시장 관행)으로 계산한다.
 * 유저가 예정일을 직접 지정하지 않았을 때의 초기값 산출에 쓴다.
 */
export function computeNextRolloverDate(
  fromLocalDate: string,
  interval: RolloverIntervalMonths,
  anchor: RolloverAnchor,
): string {
  const { year, month } = parseLocalDate(fromLocalDate)
  let cursor: YearMonth = { year, month }
  for (let i = 0; i < 24; i += 1) {
    if (isQualifyingMonth(cursor.month, interval)) {
      const candidate = anchorDateInMonth(cursor.year, cursor.month, anchor)
      if (candidate >= fromLocalDate) return candidate
    }
    cursor = stepMonth(cursor, 1)
  }
  // 이론상 도달 불가(24개월 안에 반드시 존재). 방어적 반환.
  return anchorDateInMonth(cursor.year, cursor.month, anchor)
}

/**
 * 기존 예정일에서 interval개월씩 전진하며, notBeforeLocalDate보다 "확실히 큰" 첫 날짜를 낸다.
 * 저장된 예정일의 월 위상을 그대로 이어가므로(override로 홀수달·불규칙월을 잡아도 유지),
 * 크론이 롤오버일을 처리한 뒤 다음 예정일을 안전하게 밀어둔다.
 */
export function advanceRolloverDate(
  currentNextDate: string,
  interval: RolloverIntervalMonths,
  anchor: RolloverAnchor,
  notBeforeLocalDate: string,
): string {
  const { year, month } = parseLocalDate(currentNextDate)
  let cursor: YearMonth = { year, month }
  for (let i = 0; i < 240; i += 1) {
    cursor = stepMonth(cursor, interval)
    const candidate = anchorDateInMonth(cursor.year, cursor.month, anchor)
    if (candidate > notBeforeLocalDate) return candidate
  }
  return anchorDateInMonth(cursor.year, cursor.month, anchor)
}

/** 오늘(유저 로컬 날짜)이 예정일에 도달했는가? 놓친 날도 포함하도록 >= 비교. */
export function isRolloverDue(
  nextDate: string | null | undefined,
  todayLocalDate: string,
): boolean {
  if (!isLocalDateString(nextDate)) return false
  return todayLocalDate >= nextDate
}
