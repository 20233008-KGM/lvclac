import { useEffect, useId, useRef, useState } from 'react'
import { localizedPublicPath } from '../config/routes'
import { usePathname } from '../hooks/usePathname'
import { useLanguage, type Locale } from '../i18n'

const LOCALES: Locale[] = ['ko', 'en']

function localeLabel(locale: Locale) {
  return locale === 'ko' ? '한국어' : 'English'
}

export function LocaleRouteLink({ className }: { className?: string }) {
  const pathname = usePathname()
  const { locale } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusFrame = window.requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLElement>(`[data-locale="${locale}"]`)
        ?.focus()
    })

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, locale])

  return (
    <div className="header-locale-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-label={locale === 'ko' ? '언어 선택' : 'Select language'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          className="header-locale-link__icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </svg>
        <span>{localeLabel(locale)}</span>
        <svg
          className="header-locale-link__chevron"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="m4 6 4 4 4-4" />
        </svg>
      </button>

      <div
        ref={menuRef}
        id={menuId}
        className="header-locale-menu__popover"
        role="menu"
        aria-label={locale === 'ko' ? '언어 선택' : 'Select language'}
        hidden={!isOpen}
      >
        {LOCALES.map((code) => {
          const isCurrent = code === locale

          return (
            <a
              key={code}
              className={`header-locale-menu__item${isCurrent ? ' header-locale-menu__item--current' : ''}`}
              data-locale={code}
              href={localizedPublicPath(pathname, code)}
              hrefLang={code}
              lang={code}
              role="menuitem"
              aria-current={isCurrent ? 'page' : undefined}
              tabIndex={isOpen ? 0 : -1}
              onClick={() => setIsOpen(false)}
            >
              <span className="header-locale-menu__check" aria-hidden="true">
                {isCurrent && (
                  <svg viewBox="0 0 16 16">
                    <path d="m3.5 8 3 3 6-6" />
                  </svg>
                )}
              </span>
              <span>{localeLabel(code)}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
