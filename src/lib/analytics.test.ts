import { afterEach, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const trackMock = vi.hoisted(() => vi.fn())

vi.mock('@vercel/analytics', () => ({
  track: trackMock,
}))

afterEach(() => {
  trackMock.mockClear()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('sets denied consent before configuring the discoverable head tag', () => {
  const html = readFileSync('index.html', 'utf8')
  const bootstrap = html.match(/<script id="google-consent-defaults">([\s\S]*?)<\/script>/)?.[1]
  expect(bootstrap).toBeTruthy()
  const context = { window: { dataLayer: [] as IArguments[] } }
  runInNewContext(bootstrap!, context)
  const commands = context.window.dataLayer.map((entry) => Array.from(entry))
  expect(commands[0]).toEqual(['consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied',
    ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 2000,
  }])
  expect(commands[1]).toEqual(['set', 'ads_data_redaction', true])
  expect(commands[3]).toEqual(['config', 'AW-18471363418'])
  expect(commands[4]).toEqual(['event', 'conversion', {
    send_to: 'AW-18471363418/OqVBCLahlYMdENrG6udE', value: 1.0, currency: 'KRW',
  }])
  expect(commands.filter((command) => command[0] === 'event')).toHaveLength(1)
  expect(html.indexOf('id="google-consent-defaults"')).toBeLessThan(html.indexOf('id="google-ads-tag"'))
})

it('loads Ads without GA4, preserving consent and avoiding duplicate initialization', async () => {
  vi.stubEnv('VITE_GA4_MEASUREMENT_ID', '')
  const queue: unknown[] = [['consent', 'default', { ad_storage: 'denied' }]]
  const gtag = (...args: unknown[]) => queue.push(args)
  const appendChild = vi.fn()
  vi.stubGlobal('window', { dataLayer: queue, gtag })
  vi.stubGlobal('document', {
    getElementById: () => null,
    createElement: () => ({}),
    head: { appendChild },
  })
  const { initAnalytics } = await import('./analytics')
  initAnalytics()
  initAnalytics()
  expect(window.gtag).toBe(gtag)
  expect(queue[0]).toEqual(['consent', 'default', { ad_storage: 'denied' }])
  expect(queue.filter((entry) => (entry as unknown[])[0] === 'config')).toEqual([
    ['config', 'AW-18471363418'],
  ])
  expect(appendChild).toHaveBeenCalledTimes(1)
  expect(appendChild.mock.calls[0][0].src).toBe(
    'https://www.googletagmanager.com/gtag/js?id=AW-18471363418',
  )
})

it('shares one loader with an optional GA4 destination', async () => {
  vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123456')
  vi.stubGlobal('window', {})
  vi.stubGlobal('document', {
    getElementById: () => ({}),
  })
  const { initAnalytics } = await import('./analytics')
  initAnalytics()
  const commands = window.dataLayer?.map((entry) => Array.from(entry as IArguments))
  expect(Object.prototype.toString.call(window.dataLayer?.[0])).toBe('[object Arguments]')
  expect(commands).not.toContainEqual(['config', 'AW-18471363418'])
  expect(commands).toContainEqual([
    'config', 'G-TEST123456', { send_page_view: true },
  ])
})

it('tracks anonymous calculator events through Vercel and configured GA4', async () => {
  vi.stubEnv('VITE_GA4_MEASUREMENT_ID', 'G-TEST123456')
  const queue: unknown[] = []
  const gtag = (...args: unknown[]) => queue.push(args)
  vi.stubGlobal('window', { gtag })

  const { trackLiqGuardEvent } = await import('./analytics')
  trackLiqGuardEvent('calculation_result_viewed', {
    mode: 'evaluate',
    field_count: 7,
    ignored: { nested: true } as unknown as string,
  })

  expect(trackMock).toHaveBeenCalledWith('calculation_result_viewed', {
    mode: 'evaluate',
    field_count: 7,
  })
  expect(queue).toContainEqual([
    'event',
    'calculation_result_viewed',
    {
      mode: 'evaluate',
      field_count: 7,
    },
  ])
})
