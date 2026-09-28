import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectInitialLocale, shouldFetchGeo } from './detectLocale'
import { isPaidLanding } from './adLanding'

const html = readFileSync('index.html', 'utf8')
const boot = html.match(/<script>\s*(;\(function[\s\S]*?)<\/script>/)![1]
afterEach(() => vi.unstubAllGlobals())

describe('paid landing language before and after React', () => {
  const scenarios = [
    { country: 'KR', search: '?gclid=test', expected: 'ko' },
    ...['US', 'JP', 'DE', 'GB', 'SG', ''].map((country) => ({ country, search: '?gclid=test', expected: 'en' })),
    { country: 'KR', search: '?gclid=test&lang=en', expected: 'en' },
    { country: 'US', search: '?wbraid=test&lang=ko', expected: 'ko' },
    { country: 'US', search: '?gbraid=test', expected: 'en' },
    { country: 'US', search: '?utm_medium=cpc', expected: 'en' },
  ]
  it.each(scenarios)('$country $search starts in $expected despite old preferences', ({ country, search, expected }) => {
    const oldLocale = expected === 'ko' ? 'en' : 'ko'
    const document = { cookie: country ? `leverage_geo_country=${country}` : '', documentElement: { lang: '' } }
    const globals = {
      window: { location: { search, pathname: '/' } }, document,
      navigator: { language: 'ko-KR' }, URLSearchParams,
      localStorage: { getItem: () => oldLocale },
      sessionStorage: { getItem: () => oldLocale },
    }
    for (const [key, value] of Object.entries(globals)) vi.stubGlobal(key, value)
    runInNewContext(boot, globals)
    expect(document.documentElement.lang).toBe(expected)
    expect(detectInitialLocale()).toBe(expected)
    expect(shouldFetchGeo()).toBe(false)
  })

  it('does not classify ordinary or organic visits as paid', () => {
    expect(isPaidLanding('')).toBe(false)
    expect(isPaidLanding('?utm_medium=organic')).toBe(false)
  })
})
