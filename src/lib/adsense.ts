const SCRIPT_ID = 'adsense-script'
let scriptPromise: Promise<void> | null = null

export function ensureAdSenseScript(clientId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.adsbygoogle) return Promise.resolve()

  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
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
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('AdSense script failed'))
    document.head.appendChild(script)
  })

  return scriptPromise
}
