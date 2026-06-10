import type { BoardId } from '../config/boards'

export interface BoardPost {
  id: string
  title: string
  body: string
  author: string
  createdAt: string
}

const STORAGE_PREFIX = 'leverage-board-'
const DEFECTS_MERGED_KEY = 'leverage-board-defects-merged'

function storageKey(boardId: BoardId): string {
  return `${STORAGE_PREFIX}${boardId}`
}

/** defects 게시판을 bugs로 일회 병합 (로컬 저장 글 보존) */
function mergeLegacyDefectsIntoBugs(): void {
  try {
    if (localStorage.getItem(DEFECTS_MERGED_KEY) === '1') return
    const legacyKey = `${STORAGE_PREFIX}defects`
    const raw = localStorage.getItem(legacyKey)
    if (!raw) {
      localStorage.setItem(DEFECTS_MERGED_KEY, '1')
      return
    }
    const parsed = JSON.parse(raw) as unknown
    const legacyPosts = Array.isArray(parsed) ? parsed.filter(isBoardPost) : []
    if (legacyPosts.length > 0) {
      writePosts('bugs', [...legacyPosts, ...readPosts('bugs')])
    }
    localStorage.removeItem(legacyKey)
    localStorage.setItem(DEFECTS_MERGED_KEY, '1')
  } catch {
    // ignore
  }
}

function readPosts(boardId: BoardId): BoardPost[] {
  try {
    const raw = localStorage.getItem(storageKey(boardId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBoardPost)
  } catch {
    return []
  }
}

function isBoardPost(value: unknown): value is BoardPost {
  if (!value || typeof value !== 'object') return false
  const post = value as Record<string, unknown>
  return (
    typeof post.id === 'string' &&
    typeof post.title === 'string' &&
    typeof post.body === 'string' &&
    typeof post.author === 'string' &&
    typeof post.createdAt === 'string'
  )
}

function writePosts(boardId: BoardId, posts: BoardPost[]): void {
  try {
    localStorage.setItem(storageKey(boardId), JSON.stringify(posts))
  } catch {
    // ignore quota / privacy mode
  }
}

export function listBoardPosts(boardId: BoardId): BoardPost[] {
  if (boardId === 'bugs') mergeLegacyDefectsIntoBugs()
  return readPosts(boardId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function addBoardPost(
  boardId: BoardId,
  input: Pick<BoardPost, 'title' | 'body' | 'author'>,
): BoardPost {
  const post: BoardPost = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    body: input.body.trim(),
    author: input.author.trim(),
    createdAt: new Date().toISOString(),
  }
  const posts = readPosts(boardId)
  writePosts(boardId, [post, ...posts])
  return post
}
