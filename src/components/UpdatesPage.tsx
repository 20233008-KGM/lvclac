import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLanguage, type Locale } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'
import { UPDATE_ENTRIES } from './updatesData'
import {
  resolveUpdatesPage,
  updatePageWindow,
  updatesForPage,
  updatesHrefForPage,
  UPDATES_PAGE_SIZE,
} from './updatesPagination'

const updatesCopy = {
  ko: {
    eyebrow: 'LiqGuard · 업데이트',
    title: '업데이트',
    lead: 'LiqGuard의 주요 변경 사항을 확인할 수 있는 공간입니다.',
    tableLabel: 'LiqGuard 업데이트 내역',
    dateHeader: '날짜',
    typeHeader: '구분',
    detailsHeader: '업데이트 내용',
    empty:
      '아직 공개된 업데이트가 없습니다. 새 기능과 개선 사항을 이곳에 기록합니다.',
    paginationLabel: '업데이트 페이지 이동',
    firstPage: '첫 페이지',
    previousPage: '이전 페이지',
    nextPage: '다음 페이지',
    lastPage: '마지막 페이지',
    pageLabel: (page: number) => `${page}페이지`,
    pageStatus: (page: number, pageCount: number) =>
      `전체 ${pageCount}페이지 중 ${page}페이지`,
  },
  en: {
    eyebrow: 'LiqGuard · Updates',
    title: 'Updates',
    lead: 'A place to review notable changes to LiqGuard.',
    tableLabel: 'LiqGuard update history',
    dateHeader: 'Date',
    typeHeader: 'Type',
    detailsHeader: 'What changed',
    empty:
      'No updates have been published yet. New features and improvements will be recorded here.',
    paginationLabel: 'Update page navigation',
    firstPage: 'First page',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    lastPage: 'Last page',
    pageLabel: (page: number) => `Page ${page}`,
    pageStatus: (page: number, pageCount: number) =>
      `Page ${page} of ${pageCount}`,
  },
} as const

const sortedUpdates = [...UPDATE_ENTRIES].sort((left, right) =>
  right.publishedAt.localeCompare(left.publishedAt),
)

type UpdatesTransitionState = 'idle' | 'leaving' | 'entering'

const UPDATES_LEAVE_DURATION_MS = 160
const UPDATES_ENTER_DURATION_MS = 240

function formatUpdateDate(publishedAt: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: locale === 'ko' ? '2-digit' : 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${publishedAt}T00:00:00Z`))
}

export function UpdatesPage() {
  const { locale } = useLanguage()
  const copy = updatesCopy[locale]
  const listRef = useRef<HTMLDivElement>(null)
  const leaveTimerRef = useRef<number | null>(null)
  const enterTimerRef = useRef<number | null>(null)
  const frameRef = useRef<number | null>(null)
  const transitionInProgressRef = useRef(false)
  const [search, setSearch] = useState(() => window.location.search)
  const [transitionState, setTransitionState] = useState<UpdatesTransitionState>('idle')
  const resolvedPage = useMemo(
    () => resolveUpdatesPage(search, sortedUpdates.length),
    [search],
  )
  const visibleUpdates = updatesForPage(sortedUpdates, resolvedPage.page)
  const desktopPages = updatePageWindow(resolvedPage.page, resolvedPage.pageCount, 5)
  const mobilePages = new Set(
    updatePageWindow(resolvedPage.page, resolvedPage.pageCount, 3),
  )

  const scrollToUpdates = useCallback(() => {
    listRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [])

  const clearTransitionSchedule = useCallback(() => {
    if (leaveTimerRef.current !== null) window.clearTimeout(leaveTimerRef.current)
    if (enterTimerRef.current !== null) window.clearTimeout(enterTimerRef.current)
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
    leaveTimerRef.current = null
    enterTimerRef.current = null
    frameRef.current = null
  }, [])

  const runPageTransition = useCallback(
    (commitNavigation: () => void, restartActiveTransition = false) => {
      if (transitionInProgressRef.current) {
        if (!restartActiveTransition) return
        clearTransitionSchedule()
        transitionInProgressRef.current = false
      }

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        setTransitionState('idle')
        commitNavigation()
        frameRef.current = window.requestAnimationFrame(scrollToUpdates)
        return
      }

      transitionInProgressRef.current = true
      setTransitionState('leaving')

      leaveTimerRef.current = window.setTimeout(() => {
        commitNavigation()
        frameRef.current = window.requestAnimationFrame(() => {
          scrollToUpdates()
          setTransitionState('entering')
          enterTimerRef.current = window.setTimeout(() => {
            transitionInProgressRef.current = false
            setTransitionState('idle')
          }, UPDATES_ENTER_DURATION_MS)
        })
      }, UPDATES_LEAVE_DURATION_MS)
    },
    [clearTransitionSchedule, scrollToUpdates],
  )

  useEffect(() => {
    const onPopState = () => {
      const nextSearch = window.location.search
      runPageTransition(() => setSearch(nextSearch), true)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [runPageTransition])

  useEffect(
    () => () => {
      clearTransitionSchedule()
      transitionInProgressRef.current = false
    },
    [clearTransitionSchedule],
  )

  useEffect(() => {
    if (!resolvedPage.needsNormalization) return
    window.history.replaceState(null, '', resolvedPage.normalizedHref)
  }, [resolvedPage.needsNormalization, resolvedPage.normalizedHref])

  const goToPage = (page: number) => {
    const href = updatesHrefForPage(page, window.location.search)
    const currentHref = `${window.location.pathname}${window.location.search}`
    if (href === currentHref) return
    runPageTransition(() => {
      window.history.pushState(null, '', href)
      setSearch(window.location.search)
    })
  }

  return (
    <PublicInfoShell
      activePath={null}
      tone="product-doc"
      eyebrow={copy.eyebrow}
      title={copy.title}
      lead={copy.lead}
      showNavigation={false}
    >
      {sortedUpdates.length === 0 ? (
        <p className="updates-empty">{copy.empty}</p>
      ) : (
        <div
          ref={listRef}
          className="updates-list"
          data-transition-state={transitionState}
          aria-busy={transitionState !== 'idle'}
        >
          <div className="updates-table-wrap">
            <table className="updates-table" aria-label={copy.tableLabel}>
              <thead>
                <tr>
                  <th scope="col">{copy.dateHeader}</th>
                  <th scope="col">{copy.typeHeader}</th>
                  <th scope="col">{copy.detailsHeader}</th>
                </tr>
              </thead>
              <tbody>
                {visibleUpdates.map((entry) => {
                  const content = entry.content[locale]
                  return (
                    <tr key={entry.id}>
                      <td className="updates-table__date">
                        <time dateTime={entry.publishedAt}>
                          {formatUpdateDate(entry.publishedAt, locale)}
                        </time>
                      </td>
                      <td className="updates-table__type">
                        <span>{content.type}</span>
                      </td>
                      <td className="updates-table__details">
                        <strong>{content.title}</strong>
                        <p>{content.summary}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {sortedUpdates.length > UPDATES_PAGE_SIZE && (
            <nav className="updates-pagination" aria-label={copy.paginationLabel}>
              <button
                type="button"
                aria-label={copy.firstPage}
                disabled={resolvedPage.page === 1}
                onClick={() => goToPage(1)}
              >
                <span aria-hidden="true">«</span>
              </button>
              <button
                type="button"
                aria-label={copy.previousPage}
                disabled={resolvedPage.page === 1}
                onClick={() => goToPage(resolvedPage.page - 1)}
              >
                <span aria-hidden="true">‹</span>
              </button>

              {desktopPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  className={mobilePages.has(page) ? undefined : 'updates-pagination__mobile-hidden'}
                  aria-label={copy.pageLabel(page)}
                  aria-current={page === resolvedPage.page ? 'page' : undefined}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                aria-label={copy.nextPage}
                disabled={resolvedPage.page === resolvedPage.pageCount}
                onClick={() => goToPage(resolvedPage.page + 1)}
              >
                <span aria-hidden="true">›</span>
              </button>
              <button
                type="button"
                aria-label={copy.lastPage}
                disabled={resolvedPage.page === resolvedPage.pageCount}
                onClick={() => goToPage(resolvedPage.pageCount)}
              >
                <span aria-hidden="true">»</span>
              </button>
              <p className="updates-pagination__status" aria-live="polite">
                {copy.pageStatus(resolvedPage.page, resolvedPage.pageCount)}
              </p>
            </nav>
          )}
        </div>
      )}
    </PublicInfoShell>
  )
}
