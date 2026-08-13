import { localizedPublicPath } from '../config/routes'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'

export function LocaleRouteLink({ className }: { className?: string }) {
  const pathname = usePathname()
  const { locale } = useLanguage()
  const targetLocale = locale === 'ko' ? 'en' : 'ko'
  const href = localizedPublicPath(pathname, targetLocale)

  return (
    <a
      className={className}
      href={href}
      hrefLang={targetLocale}
      lang={targetLocale}
    >
      <svg
        className="header-locale-link__icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </svg>
      <span>{targetLocale === 'en' ? 'English' : '한국어'}</span>
    </a>
  )
}
