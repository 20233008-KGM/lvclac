import { useLanguage, type Locale } from '../i18n'

interface LanguageToggleProps {
  variant?: 'default' | 'header'
}

export function LanguageToggle({ variant = 'default' }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLanguage()
  const className = variant === 'header' ? 'lang-toggle lang-toggle--header' : 'lang-toggle'

  return (
    <div className={className} role="group" aria-label={t.langToggleLabel}>
      {(['ko', 'en'] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-btn ${locale === code ? 'active' : ''}`}
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
        >
          {code === 'ko' ? '한국어' : 'English'}
        </button>
      ))}
    </div>
  )
}
