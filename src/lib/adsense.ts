const SCRIPT_ID = 'adsense-script'
let scriptPromise: Promise<void> | null = null

export function setAdRequestsPaused(paused: boolean): void {
  if (typeof window === 'undefined') return
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.pauseAdRequests = paused ? 1 : 0
}

export function setPersonalizedAdRequestsAllowed(allowed: boolean): void {
  if (typeof window === 'undefined') return
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.requestNonPersonalizedAds = allowed ? 0 : 1
}

export function ensureAdSenseScript(clientId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (scriptPromise) return scriptPromise

  window.adsbygoogle = window.adsbygoogle || []
  if (window.adsbygoogle.pauseAdRequests == null) {
    window.adsbygoogle.pauseAdRequests = 1
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('AdSense script failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`
    script.onload = () => {
      script.setAttribute('data-loaded', 'true')
      resolve()
    }
    script.onerror = () => reject(new Error('AdSense script failed'))
    document.head.appendChild(script)
  })

  return scriptPromise
}
