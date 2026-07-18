export const PRIVACY_PREFERENCES_KEY = 'liqguard-privacy-preferences-v2'
export const LEGACY_OPTIONAL_TRACKING_KEY = 'liqguard-optional-tracking-v1'

export interface PrivacyPreferences {
  analytics: boolean
  personalizedAds: boolean
}

export interface GoogleConsentValues {
  adStoragePurposeConsentStatus: number
  adUserDataPurposeConsentStatus: number
  adPersonalizationPurposeConsentStatus: number
  analyticsStoragePurposeConsentStatus: number
}

export interface GoogleConsentDecision {
  ready: boolean
  regulated: boolean
  adRequestsAllowed: boolean
  adStorageAllowed: boolean
  adUserDataAllowed: boolean
  personalizedAdsAllowed: boolean
  analyticsAllowed: boolean
}

export function shouldRequestCustomPrivacySettings(
  decision: GoogleConsentDecision,
  preferences: PrivacyPreferences | null,
): boolean {
  return decision.ready && !decision.regulated && preferences === null
}

const UNKNOWN = 0
const GRANTED = 1
const DENIED = 2
const NOT_APPLICABLE = 3

function purposeAllowed(status: number): boolean {
  return status === GRANTED || status === NOT_APPLICABLE
}

export function readPrivacyPreferences(
  storage: Pick<Storage, 'getItem'>,
): PrivacyPreferences | null {
  try {
    const value = storage.getItem(PRIVACY_PREFERENCES_KEY)
    if (value) {
      const parsed = JSON.parse(value) as Partial<PrivacyPreferences>
      if (
        typeof parsed.analytics === 'boolean' &&
        typeof parsed.personalizedAds === 'boolean'
      ) {
        return {
          analytics: parsed.analytics,
          personalizedAds: parsed.personalizedAds,
        }
      }
    }

    const legacy = storage.getItem(LEGACY_OPTIONAL_TRACKING_KEY)
    if (legacy === 'allow') return { analytics: true, personalizedAds: true }
    if (legacy === 'deny') return { analytics: false, personalizedAds: false }
    return null
  } catch {
    return null
  }
}

export function writePrivacyPreferences(
  storage: Pick<Storage, 'setItem'>,
  preferences: PrivacyPreferences,
): void {
  try {
    storage.setItem(PRIVACY_PREFERENCES_KEY, JSON.stringify(preferences))
  } catch {
    // Storage can be blocked. The in-memory decision still applies to this page.
  }
}

export function decideGoogleConsent(
  values: GoogleConsentValues,
  preferences: PrivacyPreferences | null,
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
      adRequestsAllowed: false,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    }
  }

  const regulated = statuses.some((status) => status === GRANTED || status === DENIED)
  if (!regulated && statuses.every((status) => status === NOT_APPLICABLE)) {
    return {
      ready: true,
      regulated: false,
      adRequestsAllowed: preferences !== null,
      adStorageAllowed: preferences?.personalizedAds ?? false,
      adUserDataAllowed: preferences?.personalizedAds ?? false,
      personalizedAdsAllowed: preferences?.personalizedAds ?? false,
      analyticsAllowed: preferences?.analytics ?? false,
    }
  }

  if (!regulated) {
    return {
      ready: false,
      regulated: true,
      adRequestsAllowed: false,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    }
  }

  const adStorageAllowed = purposeAllowed(values.adStoragePurposeConsentStatus)
  const adUserDataAllowed = purposeAllowed(values.adUserDataPurposeConsentStatus)

  return {
    ready: true,
    regulated: true,
    adRequestsAllowed: true,
    adStorageAllowed,
    adUserDataAllowed,
    personalizedAdsAllowed:
      adStorageAllowed &&
      adUserDataAllowed &&
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
    ad_storage: decision.adStorageAllowed ? 'granted' : 'denied',
    ad_user_data: decision.adUserDataAllowed ? 'granted' : 'denied',
    ad_personalization: decision.personalizedAdsAllowed ? 'granted' : 'denied',
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
