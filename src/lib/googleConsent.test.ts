import { describe, expect, it } from 'vitest'
import {
  decideGoogleConsent,
  OPTIONAL_TRACKING_KEY,
  readOptionalTrackingPreference,
  writeOptionalTrackingPreference,
} from './googleConsent'

const values = {
  adStoragePurposeConsentStatus: 1,
  adUserDataPurposeConsentStatus: 1,
  adPersonalizationPurposeConsentStatus: 1,
  analyticsStoragePurposeConsentStatus: 1,
}

describe('Google consent decision', () => {
  it('blocks ads and analytics while consent is unknown', () => {
    expect(
      decideGoogleConsent(
        { ...values, analyticsStoragePurposeConsentStatus: 0 },
        null,
      ),
    ).toEqual({
      ready: false,
      regulated: true,
      adsAllowed: false,
      analyticsAllowed: false,
    })
  })

  it('separates analytics and advertising decisions in regulated regions', () => {
    expect(
      decideGoogleConsent(
        {
          ...values,
          adPersonalizationPurposeConsentStatus: 2,
        },
        'allow',
      ),
    ).toMatchObject({
      ready: true,
      regulated: true,
      adsAllowed: false,
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
      adsAllowed: false,
      analyticsAllowed: false,
    })
    expect(decideGoogleConsent(notApplicable, 'allow').adsAllowed).toBe(true)
    expect(decideGoogleConsent(notApplicable, 'deny').analyticsAllowed).toBe(false)
  })

  it('keeps tracking blocked when Google cannot classify the purposes', () => {
    const notConfigured = {
      adStoragePurposeConsentStatus: 4,
      adUserDataPurposeConsentStatus: 4,
      adPersonalizationPurposeConsentStatus: 4,
      analyticsStoragePurposeConsentStatus: 4,
    }

    expect(decideGoogleConsent(notConfigured, 'allow')).toEqual({
      ready: false,
      regulated: true,
      adsAllowed: false,
      analyticsAllowed: false,
    })
  })

  it('stores only versioned allow or deny preferences', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    }
    writeOptionalTrackingPreference(storage, 'deny')
    expect(data.get(OPTIONAL_TRACKING_KEY)).toBe('deny')
    expect(readOptionalTrackingPreference(storage)).toBe('deny')
  })
})
