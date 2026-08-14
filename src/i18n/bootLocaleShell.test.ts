import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(resolve('index.html'), 'utf8')

describe('boot locale shell', () => {
  it('matches the app locale priority before the locale bundle loads', () => {
    const signals = [
      "get('lang')",
      "pathname === '/en'",
      "localStorage.getItem('leverage_locale')",
      "sessionStorage.getItem('leverage_locale_detected')",
      'leverage_geo_country=',
      'navigator.language',
    ]
    const positions = signals.map((signal) => indexHtml.indexOf(signal))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(indexHtml).toContain('document.documentElement.lang = locale')
  })

  it('shows only the loading label selected by the initial html language', () => {
    expect(indexHtml).toContain(
      '<span class="app-boot__title--ko" lang="ko">선물 계산기</span>',
    )
    expect(indexHtml).toContain(
      '<span class="app-boot__title--en" lang="en">Futures Calculator</span>',
    )
    expect(indexHtml).toContain("html[lang^='en'] .app-boot__title--ko")
    expect(indexHtml).toContain("html[lang^='en'] .app-boot__title--en")
  })
})
