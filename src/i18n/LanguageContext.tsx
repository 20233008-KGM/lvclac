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
import type { Locale, Messages, PresetId } from './types'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** 공개판의 단일 고정 선물 용어세트. 호환 소비자를 위해 읽기 전용 형태로 제공한다. */
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
  const preset: PresetId = 'futures'
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
    // 공개판 용어는 지수·종목·원자재 선물 공통 세트 하나로 고정한다.
    void next
  }, [])

  // 저장된 구버전 프리셋과 무관하게 언어별 공통 선물 문구를 그대로 사용한다.
  const t = messages

  useEffect(() => {
    if (!t) return
    document.documentElement.lang = t.htmlLang
  }, [t])

  useEffect(() => {
    if (!shouldFetchGeo()) return

    let cancelled = false
    void fetchGeoLocale().then((detected) => {
      // 조회가 진행되는 동안 사용자가 언어를 직접 선택했으면 그 선택을 보존한다.
      if (cancelled || !detected || !shouldFetchGeo()) return
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
