import { useLanguage, type Locale } from '../i18n'
import { isLocalizablePublicPath, localizedPublicPath } from '../config/routes'
import { useNavigate, usePathname } from '../hooks/usePathname'

interface LanguageToggleProps {
  variant?: 'default' | 'header' | 'fixed'
}

const VARIANT_CLASS: Record<NonNullable<LanguageToggleProps['variant']>, string> = {
  default: 'lang-toggle',
  header: 'lang-toggle lang-toggle--header',
  fixed: 'lang-toggle lang-toggle--header lang-toggle--fixed',
}

export function LanguageToggle({ variant = 'default' }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLanguage()
  const pathname = usePathname()
  const navigate = useNavigate()
  const className = VARIANT_CLASS[variant]

  return (
    <div className={className} role="group" aria-label={t.langToggleLabel}>
      {(['ko', 'en'] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-btn ${locale === code ? 'active' : ''}`}
          aria-pressed={locale === code}
          onClick={() => {
            setLocale(code)
            if (isLocalizablePublicPath(pathname)) {
              navigate(localizedPublicPath(pathname, code))
            }
          }}
        >
          {code === 'ko' ? '한국어' : 'English'}
        </button>
      ))}
    </div>
  )
}
