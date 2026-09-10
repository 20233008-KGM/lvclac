import { describe, expect, it } from 'vitest'
import { isPrivateAppPath, robotsBody, shouldNoIndexPath, sitemapBody } from './middleware'
import { UPDATE_ENTRIES } from './src/components/updatesData'

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
