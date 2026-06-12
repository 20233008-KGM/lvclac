import { useCallback, useEffect, useState } from 'react'

export function usePathname(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return pathname
}

export function useNavigate() {
  return useCallback((path: string) => {
    if (path === window.location.pathname) return
    window.history.pushState(null, '', path)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [])
}
