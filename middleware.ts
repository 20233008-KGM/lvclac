/// <reference types="node" />

import { next } from '@vercel/functions'
import {
  ABOUT_PATH,
  COMPANY_PATH,
  CONTACT_PATH,
  FORMULAS_PATH,
  GUIDE_PATH,
  PRICING_PATH,
  PRIVACY_PATH,
  REFUND_POLICY_PATH,
  TERMS_PATH,
  UPDATES_PATH,
  localizedPublicPath,
} from './src/config/routes.js'

const NO_INDEX_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow' }
const PUBLIC_BASE_PATHS = [
  '/', GUIDE_PATH, FORMULAS_PATH, UPDATES_PATH, ABOUT_PATH, COMPANY_PATH,
  CONTACT_PATH, PRICING_PATH, TERMS_PATH, PRIVACY_PATH, REFUND_POLICY_PATH,
]
const PUBLIC_UPDATE_IDS = [
  '2026-08-12-beta-experience',
  '2026-08-16-calculator-flow-polish',
  '2026-09-10-saved-workflows-and-precision',
]
const PUBLIC_PATHS = (['ko', 'en'] as const).flatMap((locale) => [
  ...PUBLIC_BASE_PATHS.map((path) => localizedPublicPath(path, locale)),
  ...PUBLIC_UPDATE_IDS.map((id) => localizedPublicPath(`${UPDATES_PATH}/${id}`, locale)),
])

function allowIndexing(): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}

function siteUrlFromRequest(request: Request): string {
  const url = new URL(request.url)
  return (process.env.VITE_SITE_URL || process.env.SITE_URL || url.origin).replace(/\/$/, '')
}

function normalizedPath(pathname: string): string {
  if (pathname === '/') return pathname
  return pathname.replace(/\/$/, '')
}

export function isPrivateAppPath(pathname: string): boolean {
  const path = normalizedPath(pathname)
  return /^(?:\/en)?\/(?:my|billing|records)(?:\/|$)/.test(path)
    || /^(?:\/en)?\/(?:admin|boards|kit)(?:\/|$)/.test(path)
}

export function shouldNoIndexPath(pathname: string, indexingAllowed = allowIndexing()): boolean {
  return !indexingAllowed || isPrivateAppPath(pathname)
}

export function robotsBody(request: Request, indexingAllowed = allowIndexing()): string {
  const siteUrl = siteUrlFromRequest(request)
  if (!indexingAllowed) {
    return `User-agent: *\nDisallow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  }
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /my',
    'Disallow: /billing',
    'Disallow: /records',
    'Disallow: /admin/',
    'Disallow: /boards/',
    'Disallow: /kit',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
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
  if (shouldNoIndexPath(pathname)) Object.assign(extraHeaders, NO_INDEX_HEADERS)
  if (country) {
    extraHeaders['Set-Cookie'] = `leverage_geo_country=${encodeURIComponent(country)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }
  return Object.keys(extraHeaders).length ? next({ headers: extraHeaders }) : next()
}
