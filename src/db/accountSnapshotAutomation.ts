export interface AccountSnapshotAutomationSettingsInput {
  enabled: boolean
  label: string
  timeZone: string
  timeOfDay: string
}

export interface AccountSnapshotAutomationSettings extends AccountSnapshotAutomationSettingsInput {
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunLocalDate: string | null
  lastError: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone).format(new Date())
    return true
  } catch {
    return false
  }
}

export function isValidTimeOfDay(timeOfDay: string): boolean {
  return TIME_OF_DAY_PATTERN.test(timeOfDay)
}

function partsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = formatterFor(timeZone).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  )

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  }
}

function utcMsFromParts(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0)
  for (let i = 0; i < 3; i += 1) {
    const zonedParts = partsInTimeZone(new Date(utcMs), timeZone)
    const offsetMs = utcMsFromParts(zonedParts) - utcMs
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMs
  }
  return new Date(utcMs)
}

function addLocalDays(parts: DateParts, days: number): DateParts {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 0, 0, 0))
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }
}

function parseTimeOfDay(timeOfDay: string): { hour: number; minute: number } {
  if (!isValidTimeOfDay(timeOfDay)) throw new Error('invalid_time_of_day')
  const [hour, minute] = timeOfDay.split(':').map(Number)
  return { hour, minute }
}

export function computeNextSnapshotRunAt(
  now: Date,
  timeZone: string,
  timeOfDay: string,
): Date {
  if (!isValidTimeZone(timeZone)) throw new Error('invalid_time_zone')
  const { hour, minute } = parseTimeOfDay(timeOfDay)
  const localNow = partsInTimeZone(now, timeZone)
  let candidate = zonedLocalToUtc(
    localNow.year,
    localNow.month,
    localNow.day,
    hour,
    minute,
    timeZone,
  )

  if (candidate.getTime() <= now.getTime()) {
    const tomorrow = addLocalDays(localNow, 1)
    candidate = zonedLocalToUtc(
      tomorrow.year,
      tomorrow.month,
      tomorrow.day,
      hour,
      minute,
      timeZone,
    )
  }

  return candidate
}

export function localDateStringForTimeZone(date: Date, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) throw new Error('invalid_time_zone')
  const parts = partsInTimeZone(date, timeZone)
  const month = String(parts.month).padStart(2, '0')
  const day = String(parts.day).padStart(2, '0')
  return `${parts.year}-${month}-${day}`
}

export function normalizeSnapshotAutomationSettings(
  settings: AccountSnapshotAutomationSettingsInput,
): AccountSnapshotAutomationSettingsInput {
  const label = settings.label.trim()
  if (!label) throw new Error('missing_label')
  if (!isValidTimeZone(settings.timeZone)) throw new Error('invalid_time_zone')
  if (!isValidTimeOfDay(settings.timeOfDay)) throw new Error('invalid_time_of_day')
  return {
    enabled: settings.enabled,
    label,
    timeZone: settings.timeZone,
    timeOfDay: settings.timeOfDay,
  }
}
