import { next } from '@vercel/functions'

export const config = {
  matcher: ['/((?!assets/|favicon|.*\\..*).*)'],
}

export default function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') ?? ''
  const response = next()
  response.cookies.set('leverage_geo_country', country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  })
  return response
}
