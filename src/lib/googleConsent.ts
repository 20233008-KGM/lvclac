export const OPTIONAL_TRACKING_KEY = 'liqguard-optional-tracking-v1'

export type OptionalTrackingPreference = 'allow' | 'deny'

export interface GoogleConsentValues {
  adStoragePurposeConsentStatus: number
  adUserDataPurposeConsentStatus: number
  adPersonalizationPurposeConsentStatus: number
  analyticsStoragePurposeConsentStatus: number
}

export interface GoogleConsentDecision {
  ready: boolean
  regulated: boolean
  adsAllowed: boolean
  analyticsAllowed: boolean
}

const UNKNOWN = 0
const GRANTED = 1
const DENIED = 2
const NOT_APPLICABLE = 3

function purposeAllowed(status: number): boolean {
  return status === GRANTED || status === NOT_APPLICABLE
}

export function readOptionalTrackingPreference(
  storage: Pick<Storage, 'getItem'>,
): OptionalTrackingPreference | null {
  try {
    const value = storage.getItem(OPTIONAL_TRACKING_KEY)
    return value === 'allow' || value === 'deny' ? value : null
  } catch {
    return null
  }
}

export function writeOptionalTrackingPreference(
  storage: Pick<Storage, 'setItem'>,
  preference: OptionalTrackingPreference,
): void {
  try {
    storage.setItem(OPTIONAL_TRACKING_KEY, preference)
  } catch {
    // Storage can be blocked. The in-memory decision still applies to this page.
  }
}

export function decideGoogleConsent(
  values: GoogleConsentValues,
  optionalPreference: OptionalTrackingPreference | null,
): GoogleConsentDecision {
  const statuses = [
    values.adStoragePurposeConsentStatus,
    values.adUserDataPurposeConsentStatus,
    values.adPersonalizationPurposeConsentStatus,
    values.analyticsStoragePurposeConsentStatus,
  ]

  if (statuses.some((status) => status === UNKNOWN)) {
    return {
      ready: false,
      regulated: true,
      adsAllowed: false,
      analyticsAllowed: false,
    }
  }

  const regulated = statuses.some((status) => status === GRANTED || status === DENIED)
  if (!regulated && statuses.every((status) => status === NOT_APPLICABLE)) {
    const allowed = optionalPreference === 'allow'
    return {
      ready: true,
      regulated: false,
      adsAllowed: allowed,
      analyticsAllowed: allowed,
    }
  }

  if (!regulated) {
    return {
      ready: false,
      regulated: true,
      adsAllowed: false,
      analyticsAllowed: false,
    }
  }

  return {
    ready: true,
    regulated: true,
    adsAllowed:
      purposeAllowed(values.adStoragePurposeConsentStatus) &&
      purposeAllowed(values.adUserDataPurposeConsentStatus) &&
      purposeAllowed(values.adPersonalizationPurposeConsentStatus),
    analyticsAllowed: purposeAllowed(values.analyticsStoragePurposeConsentStatus),
  }
}

export function applyGoogleConsentMode(decision: GoogleConsentDecision): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  window.gtag('consent', 'update', {
    ad_storage: decision.adsAllowed ? 'granted' : 'denied',
    ad_user_data: decision.adsAllowed ? 'granted' : 'denied',
    ad_personalization: decision.adsAllowed ? 'granted' : 'denied',
    analytics_storage: decision.analyticsAllowed ? 'granted' : 'denied',
  })
}

export function initializeGoogleConsentDefaults(): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args)
    }
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 2000,
  })
  window.gtag('set', 'ads_data_redaction', true)
  window.adsbygoogle = window.adsbygoogle || []
  window.adsbygoogle.pauseAdRequests = 1
}
