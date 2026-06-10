export const BOARD_IDS = ['dev-request', 'bugs', 'suggestions'] as const

export type BoardId = (typeof BOARD_IDS)[number]

/** @deprecated defects → bugs 통합. 구 URL 호환용 */
const LEGACY_BOARD_ALIASES: Record<string, BoardId> = {
  defects: 'bugs',
}

export function boardPath(id: BoardId): string {
  return `/boards/${id}`
}

export function parseBoardPath(pathname: string): BoardId | null {
  const match = pathname.match(/^\/boards\/([^/]+)\/?$/)
  if (!match) return null
  const raw = match[1]
  if (raw in LEGACY_BOARD_ALIASES) {
    return LEGACY_BOARD_ALIASES[raw]
  }
  const id = raw as BoardId
  return BOARD_IDS.includes(id) ? id : null
}
