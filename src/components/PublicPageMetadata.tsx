import { useEffect } from 'react'
import { publicPageMetadata } from '../config/publicPageMetadata'
import { useLanguage } from '../i18n'

const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || 'https://liqguard.com').replace(
  /\/$/,
  '',
)

function ensureMeta(selector: string, attributes: Record<string, string>): HTMLElement {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value))
  return element
}

export function PublicPageMetadata({ pathname }: { pathname: string }) {
  const { locale } = useLanguage()

  useEffect(() => {
    const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : '/'
    const metadata = publicPageMetadata(locale, normalized)
    const canonicalUrl = normalized === '/' ? SITE_URL : `${SITE_URL}${normalized}`

    document.title = metadata.title
    ensureMeta('meta[name="description"]', {
      name: 'description',
      content: metadata.description,
    })
    ensureMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: metadata.title,
    })
    ensureMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metadata.description,
    })
    ensureMeta('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl,
    })
    ensureMeta('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl,
    })
  }, [locale, pathname])

  return null
}
