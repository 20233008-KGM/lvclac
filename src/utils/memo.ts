export const FREE_MEMO_MAX_LENGTH = 1_000
export const MEMO_COUNTER_VISIBLE_FROM = 800
export const MEMO_PASTE_MAX_LENGTH = 50_000
export const MEMO_CHUNK_LENGTH = 50_000

// Unicode code points, matching PostgreSQL char_length (including spaces).
export function memoLength(value: string): number {
  let length = 0
  for (const character of value) { void character; length += 1 }
  return length
}

// Stop scanning hostile clipboard payloads as soon as the limit is exceeded.
export function memoExceedsLength(value: string, limit: number): boolean {
  let length = 0
  for (const character of value) {
    void character
    if (++length > limit) return true
  }
  return false
}

export function normalizeMemo(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return value
}

export function canEditMemo(previous: string, next: string, isPro: boolean): boolean {
  return isPro || memoLength(next) <= Math.max(FREE_MEMO_MAX_LENGTH, memoLength(previous))
}

export function memoPatch(previous: string, next: string) {
  const before = Array.from(previous)
  const after = Array.from(next)
  let offset = 0
  while (offset < before.length && offset < after.length && before[offset] === after[offset]) offset++
  let suffix = 0
  while (suffix < before.length - offset && suffix < after.length - offset &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++
  return { offset, deleteCount: before.length - offset - suffix,
    insert: after.slice(offset, after.length - suffix).join('') }
}

export function* memoChunks(value: string): Generator<string> {
  let chunk = ''
  let length = 0
  for (const character of value) {
    chunk += character
    if (++length === MEMO_CHUNK_LENGTH) { yield chunk; chunk = ''; length = 0 }
  }
  if (chunk || !value) yield chunk
}

export async function memoHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}
