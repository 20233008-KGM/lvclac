import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  detectInitialLocale,
  fetchGeoLocale,
  SESSION_DETECTED_KEY,
  shouldFetchGeo,
  STORAGE_KEY,
} from './detectLocale'
import { isCalcMessageCode, type CalcMessageCode } from './calcMessages'
import { en } from './locales/en'
import { ko } from './locales/ko'
import type { Locale, Messages } from './types'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
  translateCalcMessage: (code: string | null | undefined) => string | null
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const MESSAGES: Record<Locale, Messages> = { ko, en }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = MESSAGES[locale]

  useEffect(() => {
    document.documentElement.lang = t.htmlLang
    document.title = t.siteTitle
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t.siteDescription)
  }, [t])

  useEffect(() => {
    if (!shouldFetchGeo()) return

    let cancelled = false
    void fetchGeoLocale().then((detected) => {
      if (cancelled || !detected) return
      sessionStorage.setItem(SESSION_DETECTED_KEY, detected)
      setLocaleState(detected)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const translateCalcMessage = useCallback(
    (code: string | null | undefined): string | null => {
      if (!code) return null
      if (isCalcMessageCode(code)) return t.calcMessages[code as CalcMessageCode]
      return code
    },
    [t],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, translateCalcMessage }),
    [locale, setLocale, t, translateCalcMessage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
