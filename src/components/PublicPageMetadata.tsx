import { useEffect } from 'react'
import { publicPageMetadata, publicPageVariant } from '../config/publicPageMetadata'
import { localizedPublicPath } from '../config/routes'

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
  useEffect(() => {
    const variant = publicPageVariant(pathname)
    const metadata = publicPageMetadata(variant.locale, variant.basePath)
    const canonicalUrl = variant.path === '/' ? SITE_URL : `${SITE_URL}${variant.path}`
    const koreanPath = localizedPublicPath(variant.basePath, 'ko')
    const englishPath = localizedPublicPath(variant.basePath, 'en')
    const koreanUrl = koreanPath === '/' ? SITE_URL : `${SITE_URL}${koreanPath}`
    const englishUrl = `${SITE_URL}${englishPath}`

    document.title = metadata.title
    document.documentElement.lang = variant.locale
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
    ensureMeta('link[rel="alternate"][hreflang="ko"]', {
      rel: 'alternate',
      hreflang: 'ko',
      href: koreanUrl,
    })
    ensureMeta('link[rel="alternate"][hreflang="en"]', {
      rel: 'alternate',
      hreflang: 'en',
      href: englishUrl,
    })
    ensureMeta('link[rel="alternate"][hreflang="x-default"]', {
      rel: 'alternate',
      hreflang: 'x-default',
      href: koreanUrl,
    })
    ensureMeta('meta[property="og:locale"]', {
      property: 'og:locale',
      content: variant.locale === 'ko' ? 'ko_KR' : 'en_US',
    })
    ensureMeta('meta[property="og:locale:alternate"]', {
      property: 'og:locale:alternate',
      content: variant.locale === 'ko' ? 'en_US' : 'ko_KR',
    })
  }, [pathname])

  return null
}
