import { describe, expect, it } from 'vitest'
import { robotsBody, shouldNoIndexPath, sitemapBody } from './middleware'

describe('public-lite indexing middleware', () => {
  it('keeps every route blocked until the public launch flag is enabled', () => {
    const body = robotsBody(new Request('https://lvclac.example/robots.txt'), false)

    expect(body).toContain('Disallow: /')

    expect(shouldNoIndexPath('/', false)).toBe(true)
    expect(shouldNoIndexPath('/terms/', false)).toBe(true)
    expect(shouldNoIndexPath('/my', false)).toBe(true)
  })

  it('publishes only calculator, terms, and privacy URLs after launch', () => {
    const body = sitemapBody(new Request('https://lvclac.example/sitemap.xml'), true)

    expect(body).toContain('<loc>https://lvclac.example</loc>')
    expect(body).toContain('<loc>https://lvclac.example/terms</loc>')
    expect(body).toContain('<loc>https://lvclac.example/privacy</loc>')
    expect(body).not.toContain('/pricing')
    expect(body).not.toContain('/refund-policy')
  })
})
