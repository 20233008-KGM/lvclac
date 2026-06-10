import { next } from '@vercel/functions'

const NO_INDEX_HEADERS = { 'X-Robots-Tag': 'noindex, nofollow' }

function allowIndexing(): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}

function robotsBody(request: Request): string {
  if (!allowIndexing()) {
    return 'User-agent: *\nDisallow: /\n'
  }
  const url = new URL(request.url)
  const siteUrl = (process.env.VITE_SITE_URL || process.env.SITE_URL || url.origin).replace(/\/$/, '')
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
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

  if (pathname === '/sitemap.xml' && !allowIndexing()) {
    return new Response('Not Found', { status: 404 })
  }

  const country = request.headers.get('x-vercel-ip-country') ?? ''
  const extraHeaders: Record<string, string> = {}

  if (!allowIndexing()) {
    Object.assign(extraHeaders, NO_INDEX_HEADERS)
  }

  if (!country) {
    return Object.keys(extraHeaders).length ? next({ headers: extraHeaders }) : next()
  }

  const cookie = `leverage_geo_country=${encodeURIComponent(country)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  extraHeaders['Set-Cookie'] = cookie
  return next({ headers: extraHeaders })
}
