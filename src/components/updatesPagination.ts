import type { UpdateEntry } from './updatesData'

export const UPDATES_PAGE_SIZE = 10

export interface ResolvedUpdatesPage {
  page: number
  pageCount: number
  normalizedHref: string
  needsNormalization: boolean
}

export function updatesPageCount(totalEntries: number): number {
  return Math.max(1, Math.ceil(totalEntries / UPDATES_PAGE_SIZE))
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function updatesHrefForPage(
  page: number,
  search: string,
  pathname = '/updates',
): string {
  const params = new URLSearchParams(search)
  if (page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(page))
  }
  const query = params.toString()
  const basePath = pathname === '/en/updates' || pathname === '/en/updates/'
    ? '/en/updates'
    : '/updates'
  return `${basePath}${query ? `?${query}` : ''}`
}

export function resolveUpdatesPage(
  search: string,
  totalEntries: number,
  pathname = '/updates',
): ResolvedUpdatesPage {
  const params = new URLSearchParams(search)
  const rawPage = params.get('page')
  const parsedPage = parsePositiveInteger(rawPage)
  const pageCount = updatesPageCount(totalEntries)
  const page = Math.min(parsedPage ?? 1, pageCount)
  const normalizedHref = updatesHrefForPage(page, search, pathname)
  const currentHref = `${pathname.replace(/\/$/, '')}${search}`
  const needsNormalization =
    rawPage !== null && (parsedPage === null || parsedPage !== page || page === 1)

  return {
    page,
    pageCount,
    normalizedHref,
    needsNormalization: needsNormalization && normalizedHref !== currentHref,
  }
}

export function updatesForPage(
  entries: readonly UpdateEntry[],
  page: number,
): readonly UpdateEntry[] {
  const start = (page - 1) * UPDATES_PAGE_SIZE
  return entries.slice(start, start + UPDATES_PAGE_SIZE)
}

export function updatePageWindow(
  currentPage: number,
  pageCount: number,
  maxVisible: number,
): number[] {
  const visibleCount = Math.max(1, Math.min(maxVisible, pageCount))
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), pageCount)
  const preferredStart = safeCurrentPage - Math.floor(visibleCount / 2)
  const start = Math.min(Math.max(preferredStart, 1), pageCount - visibleCount + 1)
  return Array.from({ length: visibleCount }, (_, index) => start + index)
}
