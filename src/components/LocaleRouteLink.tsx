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
      {targetLocale === 'en' ? 'English' : '한국어'}
    </a>
  )
}
