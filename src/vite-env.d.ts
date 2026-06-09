/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_AD_SLOT_LEFT_SIDEBAR_TOP?: string
  readonly VITE_AD_SLOT_LEFT_SIDEBAR_BOTTOM?: string
  readonly VITE_AD_SLOT_TOP_BANNER?: string
  readonly VITE_AD_SLOT_BOTTOM_BANNER?: string
  readonly VITE_AD_SLOT_RIGHT_SIDEBAR_TOP?: string
  readonly VITE_AD_SLOT_RIGHT_SIDEBAR_BOTTOM?: string
  readonly VITE_AD_ENABLE_SIDEBAR_TALL?: string
  readonly VITE_GA4_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  adsbygoogle?: Record<string, unknown>[]
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}
