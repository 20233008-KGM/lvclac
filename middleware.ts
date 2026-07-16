import { next } from '@vercel/functions'
import { PRIVACY_PATH, TERMS_PATH } from './src/config/routes.js'

const NO_INDEX_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow' }
const PUBLIC_PATHS = ['/', TERMS_PATH, PRIVACY_PATH]

function allowIndexing(): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}

function siteUrlFromRequest(request: Request): string {
  const url = new URL(request.url)
  return (process.env.VITE_SITE_URL || process.env.SITE_URL || url.origin).replace(/\/$/, '')
}

export function shouldNoIndexPath(_pathname: string, indexingAllowed = allowIndexing()): boolean {
  return !indexingAllowed
}

export function robotsBody(request: Request, indexingAllowed = allowIndexing()): string {
  const siteUrl = siteUrlFromRequest(request)
  if (!indexingAllowed) {
    return `User-agent: *\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

export function sitemapBody(request: Request, indexingAllowed = allowIndexing()): string {
  const siteUrl = siteUrlFromRequest(request)
  const urls = (indexingAllowed ? PUBLIC_PATHS : [])
    .map((path) => {
      const loc = path === '/' ? siteUrl : `${siteUrl}${path}`
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const config = {
  matcher: ['/robots.txt', '/sitemap.xml', '/((?!assets/|favicon|.*\\..*).*)'],
}

export default function middleware(request: Request) {
  const { pathname } = new URL(request.url)

  if (pathname === '/robots.txt') {
    return new Response(robotsBody(request), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  if (pathname === '/sitemap.xml') {
    return new Response(sitemapBody(request), {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }

  const country = request.headers.get('x-vercel-ip-country') ?? ''
  const extraHeaders: Record<string, string> = {}

  if (shouldNoIndexPath(pathname)) {
    Object.assign(extraHeaders, NO_INDEX_HEADERS)
  }

  if (!country) {
    return Object.keys(extraHeaders).length ? next({ headers: extraHeaders }) : next()
  }

  const cookie = `leverage_geo_country=${encodeURIComponent(country)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  extraHeaders['Set-Cookie'] = cookie
  return next({ headers: extraHeaders })
}
