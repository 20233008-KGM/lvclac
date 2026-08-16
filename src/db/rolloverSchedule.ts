// 선물 롤오버(만기 이월) 일정 계산 — 순수 함수 모음.
//
// 전세계 선물의 만기·최종거래일·실제 롤오버 시점은 상품마다 다르다. 앱은 이를
// 요일 규칙으로 추정하지 않고, 유저가 직접 지정한 다음 알림일을 일정의 기준으로 삼는다.
// 알림이 도래하면 선택한 주기만큼 달을 더해 다음 알림일을 제안한다.

/** 롤오버 주기(개월). 매월=1, 격월=2, 분기=3, 반기=6. */
export type RolloverIntervalMonths = 1 | 2 | 3 | 6

export const ROLLOVER_INTERVALS: readonly RolloverIntervalMonths[] = [1, 2, 3, 6]

export function isRolloverInterval(value: unknown): value is RolloverIntervalMonths {
  return typeof value === 'number' && (ROLLOVER_INTERVALS as readonly number[]).includes(value)
}

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isLocalDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !LOCAL_DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
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

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/**
 * 직접 지정한 날짜에서 interval개월씩 전진해 notBeforeLocalDate보다 확실히 큰 날짜를 낸다.
 * 같은 일자를 유지하되 다음 달에 그 날짜가 없으면 그 달의 마지막 날로 보정한다.
 */
export function advanceRolloverDate(
  currentNextDate: string,
  interval: RolloverIntervalMonths,
  notBeforeLocalDate: string,
): string {
  const start = parseLocalDate(currentNextDate)
  const notBefore = parseLocalDate(notBeforeLocalDate)
  const notBeforeValue = Date.UTC(notBefore.year, notBefore.month - 1, notBefore.day)

  for (let step = 1; step <= 240; step += 1) {
    const zeroBasedMonth = start.month - 1 + interval * step
    const year = start.year + Math.floor(zeroBasedMonth / 12)
    const month = (zeroBasedMonth % 12) + 1
    const day = Math.min(start.day, daysInMonth(year, month))
    const candidate = toLocalDateString(year, month, day)
    if (Date.UTC(year, month - 1, day) > notBeforeValue) return candidate
  }

  throw new Error('rollover_date_advance_failed')
}

/** 오늘(유저 로컬 날짜)이 예정일에 도달했는가? 놓친 날도 포함하도록 >= 비교. */
export function isRolloverDue(
  nextDate: string | null | undefined,
  todayLocalDate: string,
): boolean {
  if (!isLocalDateString(nextDate) || !isLocalDateString(todayLocalDate)) return false
  return todayLocalDate >= nextDate
}
