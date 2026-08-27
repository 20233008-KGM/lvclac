export const MEMO_MAX_LENGTH = 20_000
export const MEMO_COUNTER_VISIBLE_FROM = 18_000

export function normalizeMemo(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return value.slice(0, MEMO_MAX_LENGTH)
}
