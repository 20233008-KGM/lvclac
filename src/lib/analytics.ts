const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || undefined
const SCRIPT_ID = 'ga4-script'

let initialized = false

export function initAnalytics(): void {
  if (initialized || !GA4_ID || typeof window === 'undefined') return

  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA4_ID, { send_page_view: true })

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`
    document.head.appendChild(script)
  }
}
