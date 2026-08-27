import { describe, expect, it } from 'vitest'
import type { UpdateEntry } from './updatesData'
import {
  resolveUpdatesPage,
  updatePageWindow,
  updatesForPage,
  updatesHrefForPage,
  updatesPageCount,
} from './updatesPagination'

function createEntries(count: number): UpdateEntry[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `update-${index + 1}`,
    publishedAt: `2026-07-${String(31 - index).padStart(2, '0')}`,
    content: {
      ko: {
        type: '개선',
        title: `업데이트 ${index + 1}`,
        description: `업데이트 ${index + 1} 설명`,
        body: `업데이트 ${index + 1} 본문`,
      },
      en: {
        type: 'Improved',
        title: `Update ${index + 1}`,
        description: `Update ${index + 1} summary`,
        body: `Update ${index + 1} body`,
      },
    },
  }))
}

describe('updates pagination', () => {
  it('splits 23 updates into pages of 10', () => {
    const entries = createEntries(23)

    expect(updatesPageCount(entries.length)).toBe(3)
    expect(updatesForPage(entries, 1).map((entry) => entry.id)).toEqual(
      entries.slice(0, 10).map((entry) => entry.id),
    )
    expect(updatesForPage(entries, 2).map((entry) => entry.id)).toEqual(
      entries.slice(10, 20).map((entry) => entry.id),
    )
    expect(updatesForPage(entries, 3).map((entry) => entry.id)).toEqual(
      entries.slice(20, 23).map((entry) => entry.id),
    )
  })

  it('keeps five desktop page numbers and three mobile page numbers around the current page', () => {
    expect(updatePageWindow(1, 10, 5)).toEqual([1, 2, 3, 4, 5])
    expect(updatePageWindow(5, 10, 5)).toEqual([3, 4, 5, 6, 7])
    expect(updatePageWindow(10, 10, 5)).toEqual([6, 7, 8, 9, 10])
    expect(updatePageWindow(5, 10, 3)).toEqual([4, 5, 6])
    expect(updatePageWindow(2, 3, 5)).toEqual([1, 2, 3])
  })

  it('uses a clean first-page URL and preserves unrelated query parameters', () => {
    expect(updatesHrefForPage(1, '?lang=en&page=2')).toBe('/updates?lang=en')
    expect(updatesHrefForPage(2, '?lang=en')).toBe('/updates?lang=en&page=2')
  })

  it('keeps the English route while changing pages', () => {
    expect(updatesHrefForPage(2, '', '/en/updates')).toBe('/en/updates?page=2')
    expect(resolveUpdatesPage('?page=1', 23, '/en/updates')).toEqual({
      page: 1,
      pageCount: 3,
      normalizedHref: '/en/updates',
      needsNormalization: true,
    })
  })

  it('resolves valid page queries without normalization', () => {
    expect(resolveUpdatesPage('?lang=en&page=2', 23)).toEqual({
      page: 2,
      pageCount: 3,
      normalizedHref: '/updates?lang=en&page=2',
      needsNormalization: false,
    })
  })

  it.each(['abc', '0', '-2', '1.5'])('normalizes invalid page value %s to page one', (value) => {
    expect(resolveUpdatesPage(`?lang=en&page=${value}`, 23)).toEqual({
      page: 1,
      pageCount: 3,
      normalizedHref: '/updates?lang=en',
      needsNormalization: true,
    })
  })

  it('clamps an out-of-range page to the last page', () => {
    expect(resolveUpdatesPage('?page=99&lang=en', 23)).toEqual({
      page: 3,
      pageCount: 3,
      normalizedHref: '/updates?page=3&lang=en',
      needsNormalization: true,
    })
  })

  it('removes an explicit page one query', () => {
    expect(resolveUpdatesPage('?page=1&lang=en', 23)).toEqual({
      page: 1,
      pageCount: 3,
      normalizedHref: '/updates?lang=en',
      needsNormalization: true,
    })
  })
})
