import posthog, { type PostHog } from 'posthog-js'
import { readPrivacyPreferences } from './googleConsent'

type Consent = 'pending' | 'granted' | 'denied'
type Properties = Record<string, string | number | boolean>
let consent: Consent = 'pending'
let started = false
let client: PostHog | undefined
let clarityStarted = false
let startedAt = 0
let eventCount = 0

export function analyticsExcluded(): boolean {
  if (typeof window === 'undefined') return true
  if (import.meta.env.MODE !== 'test' && (import.meta.env.DEV || import.meta.env.VITE_DEPLOYMENT_CHANNEL === 'dev')) return true
  if (typeof navigator !== 'undefined' && (navigator.webdriver || navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl)) return true
  const host = window.location?.hostname
  return Boolean(host && !['liqguard.com', 'www.liqguard.com'].includes(host))
}

function publicLanding(): boolean {
  return ['/', '/en', '/en/'].includes(window.location.pathname)
}

/** Only fixed event names and categorical/numeric properties enter this path. */
export function trackEarlyEvent(name: string, properties: Properties = {}): void {
  if (!started || consent !== 'pending' || analyticsExcluded() || !publicLanding() || eventCount >= 80) return
  eventCount++
  client?.capture(name, { ...properties, consent_state: 'pending', collection_mode: 'cookieless',
    elapsed_seconds: Math.floor((performance.now() - startedAt) / 1000) })
  if (clarityStarted && !name.startsWith('$')) window.clarity?.('event', name)
}

export function setEarlyAnalyticsConsent(next: Consent): void {
  consent = next
  if (analyticsExcluded()) return
  if (window.clarity) {
    window.clarity('consentv2', { analytics_Storage: next === 'granted' ? 'granted' : 'denied', ad_Storage: 'denied' })
    window.clarity('set', 'consent_state', next)
    if (next === 'denied') window.clarity('stop')
    else if (next === 'granted') window.clarity('start')
  }
}

export function restrictEarlyAnalyticsRoute(): void {
  if (consent === 'pending' && clarityStarted && !publicLanding()) {
    window.clarity?.('stop')
    clarityStarted = false
  }
}

export function startEarlyAnalytics(): void {
  if (started || analyticsExcluded() || !publicLanding()) return
  let preference
  try { preference = readPrivacyPreferences(window.localStorage) } catch { return }
  if (preference) {
    consent = preference.analytics ? 'granted' : 'denied'
    return
  }
  started = true
  startedAt = performance.now()
  const key = import.meta.env.VITE_POSTHOG_KEY?.trim()
  if (key) client = posthog.init(key, {
    api_host: import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
    cookieless_mode: 'always', person_profiles: 'never', persistence: 'memory',
    autocapture: false, capture_pageview: false, capture_pageleave: false,
    capture_performance: false, capture_exceptions: false,
    disable_session_recording: true, disable_surveys: true,
    advanced_disable_feature_flags: true, disable_external_dependency_loading: true,
    request_batching: false, respect_dnt: true, save_campaign_params: false, save_referrer: false,
    before_send: event => {
      if (!event || consent !== 'pending' || !publicLanding()) return null
      // Drop attribution URLs, referrers, IDs and any SDK-added user properties.
      const props = event.properties
      event.properties = Object.fromEntries(Object.entries(props).filter(([key]) =>
        ['token', 'distinct_id', '$cookieless_mode', '$lib', '$lib_version', '$process_person_profile',
          'consent_state', 'collection_mode', 'elapsed_seconds', 'surface', 'kind', 'depth',
          'visible', 'seconds', 'width_bucket', 'language', 'source', 'metric', 'value'].includes(key)))
      event.properties.$current_url = window.location.origin + window.location.pathname
      event.properties.$pathname = window.location.pathname
      event.properties.$process_person_profile = false
      Reflect.deleteProperty(event, '$set')
      Reflect.deleteProperty(event, '$set_once')
      return event
    },
  }, 'landingCookieless')

  // Do not send URL tokens or ad-click identifiers to the replay service before consent.
  const query = new URLSearchParams(window.location.search)
  const replaySafeUrl = Array.from(query.entries()).every(([key, value]) => key === 'lang' && ['ko', 'en'].includes(value))
    && ['', '#calculator', '#calculator-examples-title'].includes(window.location.hash)
  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim()
  if (clarityId && replaySafeUrl) {
    window.clarity = window.clarity || function () {
      // eslint-disable-next-line prefer-rest-params
      ;(window.clarity!.q = window.clarity!.q || []).push(arguments)
    }
    window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' })
    window.clarity('set', 'consent_state', 'pending')
    document.documentElement.setAttribute('data-clarity-mask', 'True')
    const script = document.createElement('script')
    script.id = 'microsoft-clarity-script'
    script.async = true
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`
    document.head.appendChild(script)
    clarityStarted = true
  }
  let source = 'direct'
  try { if (document.referrer) source = /(^|\.)google\./.test(new URL(document.referrer).hostname) ? 'google' : 'referral' } catch { /* No raw referrer. */ }
  if (query.has('gclid') || query.has('gbraid') || query.has('wbraid')) source = 'google_ads'
  const landing = { width_bucket: window.innerWidth < 768 ? 'mobile' : 'desktop',
    language: document.documentElement.lang === 'ko' ? 'ko' : 'en', source }
  trackEarlyEvent('$pageview', landing)
  trackEarlyEvent('landing_started', landing)
  let lastDepth = 0
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight
    const depth = total > 0 ? Math.floor((window.scrollY / total) * 4) * 25 : 0
    if (depth > lastDepth) { lastDepth = depth; trackEarlyEvent('landing_scroll', { depth }) }
  }, { passive: true })
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const surface = target.closest('.privacy-notice') ? 'privacy' : target.closest('[role="dialog"]') ? 'dialog'
      : target.closest('.calculator-examples') ? 'examples' : target.closest('#calculator') ? 'calculator' : 'page'
    const kind = target.closest('button') ? 'button' : target.closest('a') ? 'link' : target.closest('input') ? 'input' : 'other'
    trackEarlyEvent('landing_interaction', { surface, kind })
    const link = target.closest('a')
    if (link && clarityStarted) {
      const destination = new URL(link.href, window.location.origin)
      if (destination.origin !== window.location.origin || !['/', '/en', '/en/'].includes(destination.pathname)) {
        window.clarity?.('stop')
        clarityStarted = false
      }
    }
  }, true)
  window.addEventListener('error', event => {
    trackEarlyEvent('landing_error', { kind: event.target instanceof HTMLScriptElement ? 'script_load'
      : event.target instanceof HTMLLinkElement ? 'style_load' : 'javascript' })
  }, true)
  window.addEventListener('unhandledrejection', () => trackEarlyEvent('landing_error', { kind: 'promise' }))
  document.addEventListener('visibilitychange', () => trackEarlyEvent('landing_visibility', { visible: document.visibilityState === 'visible' }))
  window.addEventListener('pagehide', () => {
    trackEarlyEvent('landing_exit')
    trackEarlyEvent('$pageleave')
  })
  for (const seconds of [3, 10, 30]) window.setTimeout(() => {
    if (document.visibilityState === 'visible') trackEarlyEvent('landing_still_viewing', { seconds })
  }, seconds * 1000)
  try {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) trackEarlyEvent('landing_paint', { metric: entry.name, value: Math.round(entry.startTime) })
    })
    observer.observe({ type: 'paint', buffered: true })
  } catch { /* Unsupported browsers still report the other lifecycle events. */ }
}
