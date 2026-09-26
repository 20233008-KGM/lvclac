import posthog from 'posthog-js'
import { track } from '@vercel/analytics'

const GA4_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || undefined
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim() || undefined
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY?.trim() || undefined
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
const GOOGLE_ADS_ID = 'AW-18471363418'
const GOOGLE_SCRIPT_ID = 'ga4-script'
const CLARITY_SCRIPT_ID = 'microsoft-clarity-script'

type AnalyticsValue = string | number | boolean | null | undefined
type AnalyticsProperties = Record<string, AnalyticsValue>

let initialized = false
let posthogInitialized = false

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
    capture_pageview: 'history_change',
    capture_pageleave: 'if_capture_pageview',
    disable_session_recording: false,
    mask_personal_data_properties: true,
    custom_personal_data_properties: [
      'email', 'name', 'phone', 'account', 'amount', 'price', 'quantity',
    ],
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: 'input, textarea, select, [contenteditable="true"], .ph-mask',
      blockSelector: '[data-ph-no-capture], .ph-no-capture',
    },
    respect_dnt: true,
  })
  posthogInitialized = true
}

export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return

  initialized = true
  initGoogleMeasurement()
  initMicrosoftClarity()
  initPostHog()
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
  if (typeof window === 'undefined') return

  const clean = cleanProperties(properties)
  track(name, clean)

  if (GA4_ID && typeof window.gtag === 'function') {
    window.gtag('event', name, clean)
  }

  if (posthogInitialized) {
    posthog.capture(name, clean)
  }
}
