import { useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'
import '../styles/auth-dialog.css'

/**
 * 계좌스냅샷 저장은 Pro 전용 기능이다. 비로그인/무료 유저가 계산기의 '스냅샷 저장'을
 * 누르면 이 안내 모달로 로그인·Pro 업그레이드를 유도한다(paywall/feature-gate 패턴).
 * - mode 'guest'(비로그인): [로그인] + [Pro 요금제 보기]
 * - mode 'free'(로그인·무료): [Pro 업그레이드]
 */
export type SnapshotProGateMode = 'guest' | 'free'

interface SnapshotProGateModalProps {
  mode: SnapshotProGateMode
  onClose: () => void
  /** 로그인 유도(비로그인 전용). 로그인 모달을 연다. */
  onLogin: () => void
  /** 결제/요금제 페이지로 이동. */
  onUpgrade: () => void
  /** 포커스 복원 대상 ref(트리거 버튼). */
  restoreFocusRef?: RefObject<HTMLElement | null>
  copy: {
    title: string
    guestBody: string
    freeBody: string
    loginCta: string
    viewPlansCta: string
    upgradeCta: string
    close: string
  }
}

export function SnapshotProGateModal({
  mode,
  onClose,
  onLogin,
  onUpgrade,
  restoreFocusRef,
  copy,
}: SnapshotProGateModalProps) {
  useModalFocusRestore(restoreFocusRef)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const isGuest = mode === 'guest'

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal snapshot-pro-gate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-pro-gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal-close"
          onClick={onClose}
          aria-label={copy.close}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <h2 id="snapshot-pro-gate-title" className="disclaimer-modal-title">
          {copy.title}
        </h2>
        <p className="disclaimer-modal-text">{isGuest ? copy.guestBody : copy.freeBody}</p>
        <div className="snapshot-pro-gate-modal__actions">
          {isGuest ? (
            <>
              <button type="button" className="btn btn-primary" onClick={onLogin}>
                {copy.loginCta}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onUpgrade}>
                {copy.viewPlansCta}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onUpgrade}>
              {copy.upgradeCta}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
