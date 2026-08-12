import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PUBLIC_PAGE_METADATA } from '../src/config/publicPageMetadata'
import {
  publicRouteAssetName,
  publicRouteRewrites,
  transformPublicRouteHtml,
} from './publicSeoAssets'

const baseHtml = `<!doctype html><html lang="ko"><head>
<title>선물 계산기</title>
<meta name="description" content="default" />
<meta property="og:title" content="default" />
<meta property="og:description" content="default" />
</head><body></body></html>`

describe('public SEO assets', () => {
  it('renders route-specific metadata and canonical URLs into initial HTML', () => {
    const html = transformPublicRouteHtml(baseHtml, {
      path: '/guide',
      siteUrl: 'https://liqguard.com/',
    })

    expect(html).toContain(`<title>${PUBLIC_PAGE_METADATA.ko['/guide'].title}</title>`)
    expect(html).toContain(
      `content="${PUBLIC_PAGE_METADATA.ko['/guide'].description}"`,
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://liqguard.com/guide" />',
    )
    expect(html).toContain(
      '<meta property="og:url" content="https://liqguard.com/guide" />',
    )
    expect(html.match(/name="description"/g)).toHaveLength(1)
    expect(html.match(/rel="canonical"/g)).toHaveLength(1)
  })

  it('renders English URLs with English metadata and reciprocal language links', () => {
    const html = transformPublicRouteHtml(baseHtml, {
      path: '/en/guide',
      siteUrl: 'https://liqguard.com',
    })

    expect(html).toContain('<html lang="en">')
    expect(html).toContain(`<title>${PUBLIC_PAGE_METADATA.en['/guide'].title}</title>`)
    expect(html).toContain('<link rel="canonical" href="https://liqguard.com/en/guide" />')
    expect(html).toContain('<link rel="alternate" hreflang="ko" href="https://liqguard.com/guide" />')
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://liqguard.com/en/guide" />')
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://liqguard.com/guide" />')
    expect(html).toContain('<meta property="og:locale" content="en_US" />')
    expect(html).toContain('<meta property="og:locale:alternate" content="ko_KR" />')
  })

  it('keeps the root at index.html and emits one asset per public route', () => {
    expect(publicRouteAssetName('/')).toBe('index.html')
    expect(publicRouteAssetName('/refund-policy')).toBe('refund-policy.html')
    expect(publicRouteAssetName('/en')).toBe('en.html')
    expect(publicRouteAssetName('/en/guide')).toBe('en-guide.html')
    expect(publicRouteRewrites()).toContainEqual({
      source: '/formulas',
      destination: '/formulas.html',
    })
    expect(publicRouteRewrites()).toContainEqual({
      source: '/en/formulas',
      destination: '/en-formulas.html',
    })
  })

  it('keeps Vercel public-route rewrites aligned with generated assets', () => {
    const vercel = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8')) as {
      rewrites: Array<{ source: string; destination: string }>
    }

    for (const rewrite of publicRouteRewrites()) {
      expect(vercel.rewrites).toContainEqual(rewrite)
    }
  })
})
