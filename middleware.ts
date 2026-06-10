import { next } from '@vercel/functions'

export const config = {
  matcher: ['/((?!assets/|favicon|.*\\..*).*)'],
}

export default function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') ?? ''
  if (!country) return next()

  const cookie = `leverage_geo_country=${encodeURIComponent(country)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  return next({ headers: { 'Set-Cookie': cookie } })
}
