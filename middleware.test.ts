import { describe, expect, it } from 'vitest'
import middleware, { isPrivateAppPath, paidLandingRedirect, robotsBody, shouldNoIndexPath, sitemapBody } from './middleware'
import { UPDATE_ENTRIES } from './src/components/updatesData'

describe('paid landing locale routing', () => {
  it.each(['KR', 'US', 'JP', 'DE', 'GB', 'SG', ''])('routes %s without losing attribution', (country) => {
    const result = paidLandingRedirect(new Request('https://liqguard.com/?gclid=test&utm_campaign=example'), country)
    const url = new URL(result!)
    expect(url.pathname).toBe(country === 'KR' ? '/' : '/en')
    expect(url.searchParams.get('lang')).toBe(country === 'KR' ? 'ko' : 'en')
    expect(url.searchParams.get('gclid')).toBe('test')
    expect(url.searchParams.get('utm_campaign')).toBe('example')
    expect(paidLandingRedirect(new Request(url), country)).toBeNull()
  })

  it.each(['gbraid=test', 'wbraid=test', 'utm_medium=cpc', 'utm_medium=PPC'])('handles %s and nested landing pages', (query) => {
    expect(paidLandingRedirect(new Request(`https://liqguard.com/guide?${query}`), 'US'))
      .toBe(`https://liqguard.com/en/guide?${query}&lang=en`)
  })

  it('honors explicit languages and leaves normal visits and API requests alone', () => {
    for (const path of ['/?gclid=test&lang=ko', '/en?gclid=test&lang=en', '/', '/en', '/api/billing/checkout?gclid=test']) {
      expect(paidLandingRedirect(new Request(`https://liqguard.com${path}`), 'US')).toBeNull()
    }
    expect(paidLandingRedirect(new Request('https://liqguard.com/?gclid=test', { method: 'POST' }), 'US')).toBeNull()
  })

  it('uses a temporary non-cacheable redirect based on the current edge country', () => {
    const response = middleware(new Request('https://liqguard.com/en?gclid=test', {
      headers: { 'x-vercel-ip-country': 'KR', Cookie: 'leverage_geo_country=US' },
    }))
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://liqguard.com/?gclid=test&lang=ko')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})

describe('public indexing boundary', () => {
  it('blocks every route when indexing is disabled for Preview', () => {
    const body = robotsBody(new Request('https://preview.example/robots.txt'), false)
    expect(body).toContain('Disallow: /')
    expect(shouldNoIndexPath('/guide', false)).toBe(true)
  })

  it('always marks private application paths noindex', () => {
    for (const path of ['/my', '/billing/', '/records', '/admin/feedback', '/boards/bugs', '/kit', '/en/boards/bugs']) {
      expect(isPrivateAppPath(path), path).toBe(true)
      expect(shouldNoIndexPath(path, true), path).toBe(true)
    }
    expect(shouldNoIndexPath('/en/guide', true)).toBe(false)
  })

  it('lists bilingual public routes and update details, never private paths', () => {
    const body = sitemapBody(new Request('https://liqguard.com/sitemap.xml'), true)
    expect(body).toContain('<loc>https://liqguard.com</loc>')
    expect(body).toContain('<loc>https://liqguard.com/en/guide</loc>')
    expect(body).toContain('<loc>https://liqguard.com/contact</loc>')
    expect(body).toContain('<loc>https://liqguard.com/en/updates/2026-08-16-calculator-flow-polish</loc>')
    expect(body).not.toContain('/my</loc>')
    expect(body).not.toContain('/boards/')
  })

  it('includes every published Markdown update in both languages', () => {
    const body = sitemapBody(new Request('https://liqguard.com/sitemap.xml'), true)
    for (const entry of UPDATE_ENTRIES) {
      for (const prefix of ['', '/en']) {
        expect(body).toContain(`${prefix}/updates/${entry.id}</loc>`)
      }
    }
  })
})
