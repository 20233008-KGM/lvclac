import posthog from 'posthog-js'
import { track } from '@vercel/analytics'
import { analyticsExcluded, setEarlyAnalyticsConsent } from './earlyAnalytics'

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || undefined
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim() || undefined
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY?.trim() || undefined
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
const GOOGLE_ADS_ID = 'AW-18471363418'
const GOOGLE_ADS_CONVERSION_LABELS = {
  qualifiedCalculation: import.meta.env.VITE_GOOGLE_ADS_QUALIFIED_CALCULATION_LABEL?.trim() || undefined,
  signup: import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL?.trim() || undefined,
  checkoutStart: import.meta.env.VITE_GOOGLE_ADS_CHECKOUT_START_LABEL?.trim() || undefined,
  purchase: import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL?.trim() || undefined,
} as const
const GOOGLE_SCRIPT_ID = 'ga4-script'
const CLARITY_SCRIPT_ID = 'microsoft-clarity-script'
const POSTHOG_DISTINCT_ID_KEY = 'liqguard-posthog-distinct-id-v1'

type AnalyticsValue = string | number | boolean | null | undefined
type AnalyticsProperties = Record<string, AnalyticsValue>
type GoogleAdsConversionName = keyof typeof GOOGLE_ADS_CONVERSION_LABELS
type GoogleAdsConversionOptions = {
  value?: number
  currency?: string
  transactionId?: string
}

let initialized = false
let posthogInitialized = false
let analyticsAllowed = false

function initGoogleMeasurement(): void {
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    // Google distinguishes gtag Arguments entries from dataLayer command arrays.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  const adsBootstrapped = Boolean(document.getElementById('google-ads-tag'))
  if (!adsBootstrapped) {
    window.gtag('js', new Date())
    window.gtag('config', GOOGLE_ADS_ID)
  }
  // GA4 remains opt-in; Ads uses default-denied Consent Mode in the document head.
  if (GA4_ID) window.gtag('config', GA4_ID, { send_page_view: true })

  if (!adsBootstrapped && !document.getElementById(GOOGLE_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`
    document.head.appendChild(script)
  }
}

function initMicrosoftClarity(): void {
  if (!CLARITY_PROJECT_ID || document.getElementById(CLARITY_SCRIPT_ID)) return

  window.clarity = window.clarity || function clarity() {
    // Microsoft Clarity's loader reads queued calls from this function property.
    // eslint-disable-next-line prefer-rest-params
    ;(window.clarity!.q = window.clarity!.q || []).push(arguments)
  }

  window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' })

  const script = document.createElement('script')
  script.id = CLARITY_SCRIPT_ID
  script.async = true
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`
  document.head.appendChild(script)
}

function initPostHog(): void {
  if (!POSTHOG_KEY || posthogInitialized) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: 'if_capture_pageview',
    request_batching: false,
    disable_session_recording: false,
    mask_personal_data_properties: true,
    custom_personal_data_properties: [
      'email', 'name', 'phone', 'account', 'amount', 'price', 'quantity',
    ],
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: 'input, textarea, select, [contenteditable="true"], .ph-mask, [data-clarity-mask]',
      blockSelector: '[data-ph-no-capture], .ph-no-capture',
    },
    respect_dnt: true,
  })
  posthogInitialized = true
}


function createFallbackId(): string {
  if (typeof window.crypto?.randomUUID === 'function') return window.crypto.randomUUID()
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function getPostHogDistinctId(): string {
  try {
    const stored = window.localStorage.getItem(POSTHOG_DISTINCT_ID_KEY)
    if (stored) return stored
    const next = createFallbackId()
    window.localStorage.setItem(POSTHOG_DISTINCT_ID_KEY, next)
    return next
  } catch {
    return createFallbackId()
  }
}

function capturePostHogEvent(name: string, properties: AnalyticsProperties): void {
  if (!POSTHOG_KEY || typeof window.fetch !== 'function') return

  const endpoint = `${POSTHOG_HOST.replace(/\/$/, '')}/i/v0/e/`
  const payload = {
    api_key: POSTHOG_KEY,
    event: name,
    distinct_id: getPostHogDistinctId(),
    properties: {
      ...properties,
      $current_url: window.location.href,
      $host: window.location.host,
      $pathname: window.location.pathname,
      $process_person_profile: false,
    },
  }

  void window.fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Analytics transport must never affect calculator behavior.
  })
}

export function initAnalytics(): void {
  if (analyticsExcluded()) return
  const wasAllowed = analyticsAllowed
  analyticsAllowed = true
  setEarlyAnalyticsConsent('granted')
  if (initialized) {
    if (!wasAllowed && posthogInitialized) {
      posthog.opt_in_capturing()
      posthog.startSessionRecording()
    }
    return
  }

  initialized = true
  initGoogleMeasurement()
  initMicrosoftClarity()
  initPostHog()
}

export function stopOptionalAnalytics(): void {
  analyticsAllowed = false
  setEarlyAnalyticsConsent('denied')
  if (posthogInitialized) {
    posthog.stopSessionRecording()
    posthog.opt_out_capturing()
  }
}

function cleanProperties(properties: AnalyticsProperties = {}): AnalyticsProperties {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => (
      value == null || ['string', 'number', 'boolean'].includes(typeof value)
    )),
  )
}

export function trackLiqGuardEvent(
  name: string,
  properties: AnalyticsProperties = {},
): void {
  if (analyticsExcluded()) return

  const clean = cleanProperties(properties)
  track(name, clean)

  if (analyticsAllowed && GA4_ID && typeof window.gtag === 'function') {
    window.gtag('event', name, clean)
  }

  if (analyticsAllowed && posthogInitialized) {
    capturePostHogEvent(name, clean)
  }
}

export function trackGoogleAdsConversion(
  name: GoogleAdsConversionName,
  options: GoogleAdsConversionOptions = {},
): void {
  if (analyticsExcluded() || typeof window.gtag !== 'function') return

  const label = GOOGLE_ADS_CONVERSION_LABELS[name]
  if (!label) return

  window.gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    ...(options.value != null ? { value: options.value } : {}),
    ...(options.currency ? { currency: options.currency } : {}),
    ...(options.transactionId ? { transaction_id: options.transactionId } : {}),
  })
}
