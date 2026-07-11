import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  applyPreset,
  detectInitialPreset,
  getPresetOverride,
  persistPreset,
} from './presets'
import type { Locale, Messages, PresetId } from './types'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** 활성 용어 프리셋(상품군 어휘). 'default' = 현재 국내선물 어휘 */
  preset: PresetId
  setPreset: (preset: PresetId) => void
  t: Messages
  translateCalcMessage: (code: string | null | undefined) => string | null
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const localeLoaders: Record<Locale, () => Promise<Messages>> = {
  ko: () => import('./locales/ko').then((mod) => mod.ko),
  en: () => import('./locales/en').then((mod) => mod.en),
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectInitialLocale)
  const [preset, setPresetState] = useState<PresetId>(detectInitialPreset)
  const [messages, setMessages] = useState<Messages | null>(null)
  const cacheRef = useRef<Partial<Record<Locale, Messages>>>({})

  const loadLocale = useCallback(async (next: Locale) => {
    const cached = cacheRef.current[next]
    if (cached) {
      setMessages(cached)
      return
    }
    const loaded = await localeLoaders[next]()
    cacheRef.current[next] = loaded
    setMessages(loaded)
  }, [])

  useEffect(() => {
    void loadLocale(locale)
  }, [locale, loadLocale])

  useEffect(() => {
    const other: Locale = locale === 'ko' ? 'en' : 'ko'
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(() => {
        void localeLoaders[other]().then((loaded) => {
          cacheRef.current[other] = loaded
        })
      })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = window.setTimeout(() => {
      void localeLoaders[other]().then((loaded) => {
        cacheRef.current[other] = loaded
      })
    }, 2000)
    return () => window.clearTimeout(timeoutId)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const setPreset = useCallback((next: PresetId) => {
    setPresetState(next)
    persistPreset(next)
  }, [])

  // 로드된 로케일 위에 프리셋 오버라이드를 얕게 병합(로더/캐시 바깥에서만).
  // 프리셋은 언어와 직교하므로 로케일 로딩 로직은 전혀 건드리지 않는다.
  const t = useMemo(
    () => (messages ? applyPreset(messages, getPresetOverride(locale, preset)) : null),
    [messages, locale, preset],
  )

  useEffect(() => {
    if (!t) return
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
      if (!code || !t) return null
      if (isCalcMessageCode(code)) return t.calcMessages[code as CalcMessageCode]
      return code
    },
    [t],
  )

  const value = useMemo(() => {
    if (!t) return null
    return { locale, setLocale, preset, setPreset, t, translateCalcMessage }
  }, [locale, setLocale, preset, setPreset, t, translateCalcMessage])

  if (!value) return null

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
