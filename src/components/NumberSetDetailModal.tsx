import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import { useLanguage } from '../i18n'
import type { CalculatorNumberSet } from '../context/CalculatorContext'
import { InputPanel } from './InputPanel'
import { ResultPanel } from './ResultPanel'
import '../styles/auth-dialog.css'

interface NumberSetDetailModalProps {
  numberSet: CalculatorNumberSet
  /** 포커스 복원 대상 ref — 트리거 버튼이 유실될 수 있어 명시적으로 전달받는다. */
  restoreFocusRef?: RefObject<HTMLElement | null>
  onClose: () => void
}

const noopChange = () => undefined

/**
 * 숫자세트 전체 상세 읽기전용 모달. 장부 상세보기와 같은 계산기 본체를 재사용해
 * 세트에 저장된 입력값과 계산 결과를 그대로 보여준다. 편집·불러오기 기능은 없다.
 */
export function NumberSetDetailModal({
  numberSet,
  restoreFocusRef,
  onClose,
}: NumberSetDetailModalProps) {
  const { t } = useLanguage()
  const copy = t.myPage
  const calcRef = useRef<HTMLDivElement>(null)
  useModalFocusRestore(restoreFocusRef)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // 장부 상세보기와 동일하게 가용 높이에 맞춰 계산기 전체를 축소한다.
  useLayoutEffect(() => {
    const calc = calcRef.current
    const shell = calc?.parentElement
    if (!calc || !shell) return
    const apply = () => {
      calc.style.setProperty('zoom', '1')
      const cap = Math.min(window.innerHeight * 0.96, 980)
      const chromeHeight = shell.scrollHeight - calc.offsetHeight
      const available = cap - chromeHeight - 16
      const scale = Math.min(1, available / calc.offsetHeight)
      calc.style.setProperty('zoom', String(Math.max(0.55, Math.floor(scale * 1000) / 1000)))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [numberSet])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const modal = (
    <div
      className="disclaimer-overlay records-detail-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <section
        className="disclaimer-modal records-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="number-set-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={copy.numberSetDetailClose}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <div className="records-detail-head">
          <p id="number-set-detail-title" className="records-detail-meta">
            {numberSet.title}
          </p>
        </div>
        <div className="records-detail-calc" key={numberSet.id} ref={calcRef}>
          <InputPanel inputs={numberSet.inputs} onChange={noopChange} />
          <ResultPanel inputs={numberSet.inputs} onChange={noopChange} />
        </div>
      </section>
    </div>
  )

  return createPortal(modal, document.body)
}
