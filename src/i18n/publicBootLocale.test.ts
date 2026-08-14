import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { transformPublicRouteHtml } from '../../scripts/publicSeoAssets'

const indexHtml = readFileSync(resolve('index.html'), 'utf8')

describe('public boot loading locale', () => {
  it('ships both localized loading labels and selects English from the route html lang', () => {
    const englishHtml = transformPublicRouteHtml(indexHtml, {
      path: '/en',
      siteUrl: 'https://liqguard.com',
    })

    expect(indexHtml).toContain(
      '<span class="app-boot__title--ko" lang="ko">선물 계산기</span>',
    )
    expect(indexHtml).toContain(
      '<span class="app-boot__title--en" lang="en">Futures Calculator</span>',
    )
    expect(englishHtml).toContain('<html lang="en">')
    expect(englishHtml).toContain("html[lang^='en'] .app-boot__title--ko")
    expect(englishHtml).toContain("html[lang^='en'] .app-boot__title--en")
  })
})
