import { useLayoutEffect, useRef, type RefObject } from 'react'

/**
 * 모달이 열릴 때 포커스를 되돌릴 대상을 기억해 뒀다가, 닫힐 때(언마운트) 그 요소로
 * focus()를 복원한다. explicitTargetRef를 넘기면 그 ref의 .current를 우선 사용한다 —
 * 트리거 버튼이 비동기 처리 중 disabled로 바뀌어 document.activeElement가 유실되는
 * 경우(예: 스냅샷 저장 버튼) 대응. 넘기지 않으면 마운트 시점의 document.activeElement를
 * 그대로 기억한다.
 */
export function useModalFocusRestore(
  explicitTargetRef?: RefObject<HTMLElement | null>,
): void {
  const targetRef = useRef<HTMLElement | null>(null)

  useLayoutEffect(() => {
    targetRef.current =
      explicitTargetRef !== undefined
        ? explicitTargetRef.current
        : document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null

    return () => {
      targetRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- capture once at mount, not on every ref change
  }, [])
}
