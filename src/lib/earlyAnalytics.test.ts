import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const capture = vi.hoisted(() => vi.fn())
const init = vi.hoisted(() => vi.fn(() => ({ capture })))
vi.mock('posthog-js', () => ({ default: { init } }))
let storage: Map<string, string>
let appended: Array<Record<string, unknown>>
let setItem: ReturnType<typeof vi.fn>
let listeners: Map<string, (event: unknown) => void>

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubEnv('VITE_POSTHOG_KEY', 'test-key')
  vi.stubEnv('VITE_CLARITY_PROJECT_ID', 'test-clarity')
  storage = new Map()
  appended = []
  listeners = new Map()
  setItem = vi.fn((key: string, value: string) => storage.set(key, value))
  const on = (name: string, callback: (event: unknown) => void) => listeners.set(name, callback)
  vi.stubGlobal('window', {
    location: { hostname: 'liqguard.com', pathname: '/', origin: 'https://liqguard.com', search: '', hash: '' },
    innerWidth: 360, innerHeight: 656, scrollY: 0,
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem },
    addEventListener: on, setTimeout,
  })
  vi.stubGlobal('navigator', { webdriver: false, doNotTrack: '0' })
  vi.stubGlobal('document', {
    referrer: '', visibilityState: 'visible', addEventListener: on,
    documentElement: { lang: 'ko', scrollHeight: 2000, setAttribute: vi.fn() },
    createElement: () => ({}), head: { appendChild: (node: Record<string, unknown>) => appended.push(node) },
  })
})
afterEach(() => {
  vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); vi.resetModules()
})

it('starts before any privacy choice, with no storage or PostHog replay, and queues denied consent first', async () => {
  const { startEarlyAnalytics } = await import('./earlyAnalytics')
  startEarlyAnalytics(); startEarlyAnalytics()
  expect(init).toHaveBeenCalledTimes(1)
  expect(init).toHaveBeenCalledWith('test-key', expect.objectContaining({
    cookieless_mode: 'always', person_profiles: 'never', disable_session_recording: true,
    persistence: 'memory', autocapture: false, capture_pageview: false,
  }), 'landingCookieless')
  expect(capture).toHaveBeenCalledWith('landing_started', expect.objectContaining({ consent_state: 'pending' }))
  expect(Array.from(window.clarity!.q![0])).toEqual(['consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' }])
  expect(appended).toHaveLength(1)
  expect(setItem).not.toHaveBeenCalled()
})

it('strips query tokens, referrers, user properties and SDK identifiers from early events', async () => {
  const { startEarlyAnalytics } = await import('./earlyAnalytics')
  startEarlyAnalytics()
  const config = (init.mock.calls[0] as unknown as [string, { before_send: (event: unknown) => { properties: Record<string, unknown> } }])[1]
  const event = config.before_send({ event: 'landing_started', properties: {
    token: 'test-project-key', distinct_id: '$posthog_cookieless', $cookieless_mode: true, $current_url: 'https://liqguard.com/?email=private',
    $referrer: 'https://example.com/?secret=private', email: 'private', $device_id: 'private',
    $initial_person_info: { email: 'private' }, consent_state: 'pending',
  } })
  expect(JSON.stringify(event)).not.toContain('private')
  expect(event.properties.$current_url).toBe('https://liqguard.com/')
  expect(event.properties.$cookieless_mode).toBe(true)
  expect(event.properties.token).toBe('test-project-key')
})

it.each(['denied', 'granted'] as const)('stops early event delivery on %s without flushing it later', async next => {
  const { startEarlyAnalytics, setEarlyAnalyticsConsent, trackEarlyEvent } = await import('./earlyAnalytics')
  startEarlyAnalytics()
  capture.mockClear()
  setEarlyAnalyticsConsent(next)
  trackEarlyEvent('landing_exit')
  vi.advanceTimersByTime(30000)
  expect(capture).not.toHaveBeenCalled()
  if (next === 'denied') expect(window.clarity!.q!.map(x => Array.from(x))).toContainEqual(['stop'])
})

it('records early hide/exit and sanitized failures, with an event budget', async () => {
  const { startEarlyAnalytics, trackEarlyEvent } = await import('./earlyAnalytics')
  startEarlyAnalytics()
  listeners.get('unhandledrejection')!({ reason: 'private financial data' })
  listeners.get('pagehide')!({})
  expect(capture).toHaveBeenCalledWith('landing_error', expect.objectContaining({ kind: 'promise' }))
  expect(capture).toHaveBeenCalledWith('landing_exit', expect.anything())
  expect(JSON.stringify(capture.mock.calls)).not.toContain('private financial data')
  for (let index = 0; index < 100; index++) trackEarlyEvent('landing_scroll', { depth: 25 })
  expect(capture.mock.calls.length).toBe(80)
})

it.each(['reject', 'grant', 'webdriver', 'dnt', 'gpc', 'localhost', 'preview', 'private-route'])('does not start early collection for %s', async reason => {
  if (reason === 'reject' || reason === 'grant') storage.set('liqguard-privacy-preferences-v2', JSON.stringify({ analytics: reason === 'grant', personalizedAds: false }))
  if (reason === 'webdriver') vi.stubGlobal('navigator', { webdriver: true })
  if (reason === 'dnt') vi.stubGlobal('navigator', { doNotTrack: '1' })
  if (reason === 'gpc') vi.stubGlobal('navigator', { globalPrivacyControl: true })
  if (reason === 'localhost') Object.assign(window.location, { hostname: 'localhost' })
  if (reason === 'preview') Object.assign(window.location, { hostname: 'preview.vercel.app' })
  if (reason === 'private-route') Object.assign(window.location, { pathname: '/mypage' })
  const { startEarlyAnalytics } = await import('./earlyAnalytics')
  startEarlyAnalytics()
  expect(init).not.toHaveBeenCalled()
  expect(appended).toHaveLength(0)
})

it('keeps identifier-bearing ad landings in event-only mode', async () => {
  Object.assign(window.location, { search: '?gclid=private' })
  const { startEarlyAnalytics } = await import('./earlyAnalytics')
  startEarlyAnalytics()
  expect(appended).toHaveLength(0)
  expect(capture).toHaveBeenCalledWith('landing_started', expect.anything())
})
