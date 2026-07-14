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
    eyebrow: string
    title: string
    guestBody: string
    freeBody: string
    loginCta: string
    viewPlansCta: string
    upgradeCta: string
    close: string
    /** Pro 혜택 요약(선택). 있으면 본문 아래에 인셋 리스트로 노출. */
    benefits?: readonly string[]
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

  const benefits = copy.benefits ?? []

  const modal = (
    <div
      className="disclaimer-overlay snap-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="disclaimer-modal snap-modal snap-modal--gate"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snapshot-pro-gate-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="snap-shimmer" aria-hidden="true" />
        <button
          type="button"
          className="auth-modal-close snap-modal__close"
          onClick={onClose}
          aria-label={copy.close}
        >
          <span className="auth-modal-close__mark" aria-hidden="true" />
        </button>
        <span className="snap-emblem snap-emblem--lock" aria-hidden="true">
          <span className="snap-emblem__disc" />
          <span className="snap-emblem__glow" />
          <span className="snap-emblem__halo" />
          <svg className="snap-emblem__mark" viewBox="0 0 48 48">
            <path className="snap-emblem__shackle" d="M16 21 V16 a8 8 0 0 1 16 0 V21" />
            <rect className="snap-emblem__lock-body" x="12" y="21" width="24" height="18" rx="4" />
            <circle className="snap-emblem__keyhole" cx="24" cy="29" r="2.4" />
            <path className="snap-emblem__keyhole-stem" d="M24 30 v4" />
          </svg>
        </span>
        <p className="snap-eyebrow">{copy.eyebrow}</p>
        <h2 id="snapshot-pro-gate-title" className="snap-title">
          {copy.title}
        </h2>
        <p className="snap-body">{isGuest ? copy.guestBody : copy.freeBody}</p>
        {benefits.length > 0 && (
          <ul className="snap-feats">
            {benefits.map((feat) => (
              <li key={feat} className="snap-feats__item">
                <span className="snap-feats__icon" aria-hidden="true">
                  <svg viewBox="0 0 20 20">
                    <path d="M5 10.5 L8.5 14 L15 6.5" />
                  </svg>
                </span>
                <span className="snap-feats__label">{feat}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="snapshot-pro-gate-modal__actions">
          {isGuest ? (
            <>
              <button type="button" className="btn btn-primary snap-primary" onClick={onLogin}>
                {copy.loginCta}
              </button>
              <button type="button" className="btn btn-ghost snap-ghost" onClick={onUpgrade}>
                {copy.viewPlansCta}
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary snap-primary" onClick={onUpgrade}>
              {copy.upgradeCta}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
