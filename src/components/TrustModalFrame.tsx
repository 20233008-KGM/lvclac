import {
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useModalFocusRestore } from '../hooks/useModalFocusRestore'

type TrustModalVariant = 'service' | 'storage' | 'privacy'

type TrustModalFrameProps = {
  variant: TrustModalVariant
  titleId: string
  eyebrow: string
  title: string
  intro: string
  icon: ReactNode
  children: ReactNode
  footer: ReactNode
  descriptionId?: string
  closeLabel?: string
  onRequestClose?: () => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function TrustModalFrame({
  variant,
  titleId,
  eyebrow,
  title,
  intro,
  icon,
  children,
  footer,
  descriptionId,
  closeLabel,
  onRequestClose,
}: TrustModalFrameProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const closeHandlerRef = useRef(onRequestClose)
  useModalFocusRestore()

  useEffect(() => {
    closeHandlerRef.current = onRequestClose
  }, [onRequestClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    titleRef.current?.focus({ preventScroll: true })

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current
      if (!dialog) return

      if (event.key === 'Escape' && closeHandlerRef.current) {
        event.preventDefault()
        closeHandlerRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true')

      if (focusable.length === 0) {
        event.preventDefault()
        titleRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const modal = (
    <div
      className="disclaimer-overlay trust-modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeHandlerRef.current?.()
      }}
    >
      <div
        ref={dialogRef}
        className={`trust-modal trust-modal--${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {onRequestClose && closeLabel && (
          <button
            type="button"
            className="trust-modal__close"
            aria-label={closeLabel}
            onClick={onRequestClose}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 3.5 12.5 12.5" />
              <path d="m12.5 3.5-9 9" />
            </svg>
          </button>
        )}
        <header className="trust-modal__header">
          <span className="trust-modal__icon" aria-hidden="true">
            {icon}
          </span>
          <div className="trust-modal__heading">
            <span className="trust-modal__eyebrow">{eyebrow}</span>
            <h2 ref={titleRef} id={titleId} className="trust-modal__title" tabIndex={-1}>
              {title}
            </h2>
            <p id={descriptionId} className="trust-modal__intro">
              {intro}
            </p>
          </div>
        </header>
        <div className="trust-modal__body">{children}</div>
        <footer className="trust-modal__footer">{footer}</footer>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
