const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || undefined
const GOOGLE_ADS_ID = 'AW-18471363418'
const SCRIPT_ID = 'ga4-script'

let initialized = false

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return

  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    // Google distinguishes gtag Arguments entries from dataLayer command arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  window.gtag('js', new Date())
  // Called only after analytics consent; preserve the existing consent queue.
  window.gtag('config', GOOGLE_ADS_ID)
  if (GA4_ID) window.gtag('config', GA4_ID, { send_page_view: true })

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`
    document.head.appendChild(script)
  }
}
