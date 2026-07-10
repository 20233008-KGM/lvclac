import { describe, expect, it } from 'vitest'
import { robotsBody, shouldNoIndexPath, sitemapBody } from './middleware'

describe('middleware public review pages', () => {
  it('keeps the site blocked by default while allowing Paddle review pages', () => {
    const body = robotsBody(new Request('https://lvclac.example/robots.txt'), false)

    expect(body).toContain('Allow: /product')
    expect(body).toContain('Allow: /pricing')
    expect(body).toContain('Allow: /terms')
    expect(body).toContain('Allow: /privacy')
    expect(body).toContain('Allow: /refund-policy')
    expect(body).toContain('Disallow: /')

    expect(shouldNoIndexPath('/refund-policy', false)).toBe(false)
    expect(shouldNoIndexPath('/terms/', false)).toBe(false)
    expect(shouldNoIndexPath('/my', false)).toBe(true)
  })

  it('lists public review page URLs in the sitemap', () => {
    const body = sitemapBody(new Request('https://lvclac.example/sitemap.xml'), false)

    expect(body).toContain('<loc>https://lvclac.example/product</loc>')
    expect(body).toContain('<loc>https://lvclac.example/pricing</loc>')
    expect(body).toContain('<loc>https://lvclac.example/terms</loc>')
    expect(body).toContain('<loc>https://lvclac.example/privacy</loc>')
    expect(body).toContain('<loc>https://lvclac.example/refund-policy</loc>')
  })
})
