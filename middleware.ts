import { next } from '@vercel/functions'
import {
  PRICING_PATH,
  PRIVACY_PATH,
  PRODUCT_PATH,
  REFUND_POLICY_PATH,
  TERMS_PATH,
} from './src/config/routes'

const NO_INDEX_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow' }
const PUBLIC_REVIEW_PATHS = [
  PRODUCT_PATH,
  PRICING_PATH,
  TERMS_PATH,
  PRIVACY_PATH,
  REFUND_POLICY_PATH,
]

function allowIndexing(): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}

function siteUrlFromRequest(request: Request): string {
  const url = new URL(request.url)
  return (process.env.VITE_SITE_URL || process.env.SITE_URL || url.origin).replace(/\/$/, '')
}

function normalizePath(pathname: string): string {
  if (pathname === '/') return pathname
  return pathname.replace(/\/$/, '')
}

function isPublicReviewPath(pathname: string): boolean {
  return PUBLIC_REVIEW_PATHS.includes(normalizePath(pathname))
}

export function shouldNoIndexPath(pathname: string, indexingAllowed = allowIndexing()): boolean {
  return !indexingAllowed && !isPublicReviewPath(pathname)
}

export function robotsBody(request: Request, indexingAllowed = allowIndexing()): string {
  const siteUrl = siteUrlFromRequest(request)
  if (!indexingAllowed) {
    const allowed = PUBLIC_REVIEW_PATHS.map((path) => `Allow: ${path}`).join('\n')
    return `User-agent: *\n${allowed}\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

export function sitemapBody(request: Request, indexingAllowed = allowIndexing()): string {
  const siteUrl = siteUrlFromRequest(request)
  const paths = indexingAllowed ? ['/', ...PUBLIC_REVIEW_PATHS] : PUBLIC_REVIEW_PATHS
  const urls = paths
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
