import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyGoogleConsentMode,
  decideGoogleConsent,
  LEGACY_OPTIONAL_TRACKING_KEY,
  PRIVACY_PREFERENCES_KEY,
  readPrivacyPreferences,
  shouldRequestCustomPrivacySettings,
  writePrivacyPreferences,
} from './googleConsent'

const values = {
  adStoragePurposeConsentStatus: 1,
  adUserDataPurposeConsentStatus: 1,
  adPersonalizationPurposeConsentStatus: 1,
  analyticsStoragePurposeConsentStatus: 1,
}

const deniedPreferences = {
  analytics: false,
  personalizedAds: false,
}

describe('Google consent decision', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks ad requests and analytics while consent is unknown', () => {
    expect(
      decideGoogleConsent(
        { ...values, analyticsStoragePurposeConsentStatus: 0 },
        null,
      ),
    ).toEqual({
      ready: false,
      regulated: true,
      adRequestsAllowed: false,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    })
  })

  it('allows an ad request after a regulated choice while preserving each purpose', () => {
    expect(
      decideGoogleConsent(
        {
          ...values,
          adStoragePurposeConsentStatus: 2,
          adPersonalizationPurposeConsentStatus: 2,
        },
        { analytics: false, personalizedAds: true },
      ),
    ).toMatchObject({
      ready: true,
      regulated: true,
      adRequestsAllowed: true,
      adStorageAllowed: false,
      adUserDataAllowed: true,
      personalizedAdsAllowed: false,
      analyticsAllowed: true,
    })
  })

  it('waits for an explicit local choice when Google reports not applicable', () => {
    const notApplicable = {
      adStoragePurposeConsentStatus: 3,
      adUserDataPurposeConsentStatus: 3,
      adPersonalizationPurposeConsentStatus: 3,
      analyticsStoragePurposeConsentStatus: 3,
    }
    expect(decideGoogleConsent(notApplicable, null)).toMatchObject({
      ready: true,
      regulated: false,
      adRequestsAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    })
    expect(decideGoogleConsent(notApplicable, deniedPreferences)).toMatchObject({
      adRequestsAllowed: true,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    })
    expect(
      decideGoogleConsent(notApplicable, {
        analytics: true,
        personalizedAds: false,
      }),
    ).toMatchObject({
      adRequestsAllowed: true,
      personalizedAdsAllowed: false,
      analyticsAllowed: true,
    })
  })

  it('keeps requests blocked when Google cannot classify the purposes', () => {
    const notConfigured = {
      adStoragePurposeConsentStatus: 4,
      adUserDataPurposeConsentStatus: 4,
      adPersonalizationPurposeConsentStatus: 4,
      analyticsStoragePurposeConsentStatus: 4,
    }

    expect(
      decideGoogleConsent(notConfigured, {
        analytics: true,
        personalizedAds: true,
      }),
    ).toEqual({
      ready: false,
      regulated: true,
      adRequestsAllowed: false,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    })
  })

  it('stores versioned granular preferences', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    }
    writePrivacyPreferences(storage, {
      analytics: true,
      personalizedAds: false,
    })
    expect(data.get(PRIVACY_PREFERENCES_KEY)).toBe(
      JSON.stringify({ analytics: true, personalizedAds: false }),
    )
    expect(readPrivacyPreferences(storage)).toEqual({
      analytics: true,
      personalizedAds: false,
    })
  })

  it('migrates the legacy all-or-nothing preference', () => {
    const data = new Map([[LEGACY_OPTIONAL_TRACKING_KEY, 'deny']])
    expect(
      readPrivacyPreferences({
        getItem: (key: string) => data.get(key) ?? null,
      }),
    ).toEqual(deniedPreferences)
  })

  it('requests custom settings only for ready non-regulated users without a choice', () => {
    const nonRegulated = {
      ready: true,
      regulated: false,
      adRequestsAllowed: false,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: false,
    }

    expect(shouldRequestCustomPrivacySettings(nonRegulated, null)).toBe(true)
    expect(shouldRequestCustomPrivacySettings(nonRegulated, deniedPreferences)).toBe(false)
    expect(
      shouldRequestCustomPrivacySettings({ ...nonRegulated, regulated: true }, null),
    ).toBe(false)
    expect(
      shouldRequestCustomPrivacySettings({ ...nonRegulated, ready: false }, null),
    ).toBe(false)
  })

  it('applies each Google consent mode purpose independently', () => {
    const dataLayer: unknown[] = []
    vi.stubGlobal('window', { dataLayer })

    applyGoogleConsentMode({
      ready: true,
      regulated: false,
      adRequestsAllowed: true,
      adStorageAllowed: false,
      adUserDataAllowed: false,
      personalizedAdsAllowed: false,
      analyticsAllowed: true,
    })

    expect(dataLayer).toEqual([
      [
        'consent',
        'update',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'granted',
        },
      ],
    ])
  })
})
