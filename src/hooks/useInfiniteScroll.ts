import { useEffect, useRef } from 'react'

interface UseInfiniteScrollOptions {
  /** 바닥 근처에 닿았을 때 호출. 보통 "더 보기"와 같은 로더. */
  onLoadMore: () => void
  /** false면 관찰을 멈춘다(더 없음 / 로딩 중 / 로그아웃 등). */
  enabled: boolean
  /** 바닥에 닿기 전에 미리 로드할 여유 거리. 기본 200px. */
  rootMargin?: string
}

/**
 * sentinel(감시용 빈 요소)이 뷰포트에 들어오면 onLoadMore를 호출하는 훅.
 * 반환한 ref를 리스트 맨 아래 요소에 붙인다.
 *
 * - onLoadMore는 매 렌더마다 바뀌어도 observer를 재생성하지 않도록 ref로 최신값을 참조한다.
 * - IntersectionObserver가 없는 환경(jsdom 테스트 등)에서는 조용히 no-op → 기존 테스트 안전.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  onLoadMore,
  enabled,
  rootMargin = '200px',
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    const node = sentinelRef.current
    if (!enabled || !node) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
