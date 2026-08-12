import { describe, expect, it } from 'vitest'
import { robotsBody, shouldNoIndexPath, sitemapBody } from './middleware'

describe('public-lite indexing middleware', () => {
  it('keeps every route blocked until the public launch flag is enabled', () => {
    const body = robotsBody(new Request('https://lvclac.example/robots.txt'), false)

    expect(body).toContain('User-agent: Mediapartners-Google\nAllow: /')
    expect(body).toContain('User-agent: Google-Display-Ads-Bot\nAllow: /')
    expect(body).toContain('User-agent: *\nDisallow: /')

    expect(shouldNoIndexPath('/', false)).toBe(true)
    expect(shouldNoIndexPath('/terms/', false)).toBe(true)
    expect(shouldNoIndexPath('/my', false)).toBe(true)
  })

  it('publishes the public product and legal URLs after launch', () => {
    const body = sitemapBody(new Request('https://lvclac.example/sitemap.xml'), true)

    expect(body).toContain('<loc>https://lvclac.example</loc>')
    expect(body).toContain('<loc>https://lvclac.example/guide</loc>')
    expect(body).toContain('<loc>https://lvclac.example/formulas</loc>')
    expect(body).toContain('<loc>https://lvclac.example/about</loc>')
    expect(body).toContain('<loc>https://lvclac.example/pricing</loc>')
    expect(body).toContain('<loc>https://lvclac.example/terms</loc>')
    expect(body).toContain('<loc>https://lvclac.example/privacy</loc>')
    expect(body).toContain('<loc>https://lvclac.example/refund-policy</loc>')
    expect(body).toContain('<loc>https://lvclac.example/updates</loc>')
    expect(body).toContain('<loc>https://lvclac.example/company</loc>')
    expect(body).toContain('<loc>https://lvclac.example/contact</loc>')
    expect(body).toContain('<loc>https://lvclac.example/en</loc>')
    expect(body).toContain('<loc>https://lvclac.example/en/guide</loc>')
    expect(body).toContain('<loc>https://lvclac.example/en/formulas</loc>')
    expect(body.match(/<url>/g)).toHaveLength(22)
  })
})
