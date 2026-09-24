import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
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
  expect(window.dataLayer).toContainEqual(['config', 'AW-18471363418'])
  expect(window.dataLayer).toContainEqual([
    'config', 'G-TEST123456', { send_page_view: true },
  ])
})
