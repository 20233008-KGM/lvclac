import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ADS_ENABLED, ADSENSE_CLIENT } from '../config/ads'
import { isAdFreePublicInfoPath } from '../config/routes'
import { PrivacyNotice } from '../components/PrivacyNotice'
import { useFirstVisitGateActive } from './FirstVisitFlowContext'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import {
  ensureAdSenseScript,
  setAdRequestsPaused,
  setPersonalizedAdRequestsAllowed,
} from '../lib/adsense'
import { initAnalytics } from '../lib/analytics'
import {
  applyGoogleConsentMode,
  decideGoogleConsent,
  initializeGoogleConsentDefaults,
  readPrivacyPreferences,
  shouldRequestCustomPrivacySettings,
  writePrivacyPreferences,
  type GoogleConsentDecision,
  type GoogleConsentValues,
  type PrivacyPreferences,
} from '../lib/googleConsent'
import { GoogleConsentContext } from './googleConsentState'

const INITIAL_DECISION: GoogleConsentDecision = {
  ready: false,
  regulated: true,
  adRequestsAllowed: false,
  adStorageAllowed: false,
  adUserDataAllowed: false,
  personalizedAdsAllowed: false,
  analyticsAllowed: false,
}

const DENIED_PREFERENCES: PrivacyPreferences = {
  analytics: false,
  personalizedAds: false,
}

function queueGoogleCallback(key: string, callback: () => void): void {
  window.googlefc = window.googlefc || {}
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || []
  window.googlefc.callbackQueue.push({ [key]: callback })
}

export function GoogleConsentProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const firstVisitGateActive = useFirstVisitGateActive()
  const adFreePath = isAdFreePublicInfoPath(pathname)
  const [decision, setDecision] = useState<GoogleConsentDecision>(INITIAL_DECISION)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deferredAutoOpen, setDeferredAutoOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [draftPreferences, setDraftPreferences] =
    useState<PrivacyPreferences>(DENIED_PREFERENCES)
  const configured = Boolean(ADS_ENABLED && ADSENSE_CLIENT)

  const applyDecision = useCallback((next: GoogleConsentDecision) => {
    setDecision(next)
    applyGoogleConsentMode(next)
    setPersonalizedAdRequestsAllowed(next.personalizedAdsAllowed)
    setAdRequestsPaused(!ADS_ENABLED || adFreePath || !next.adRequestsAllowed)
    if (next.analyticsAllowed) initAnalytics()
  }, [adFreePath])

  useEffect(() => {
    setAdRequestsPaused(!ADS_ENABLED || adFreePath || !decision.adRequestsAllowed)
  }, [adFreePath, decision.adRequestsAllowed])

  const syncGoogleDecision = useCallback(() => {
    const values = window.googlefc?.getGoogleConsentModeValues?.()
    if (!values) return
    const preferences = readPrivacyPreferences(localStorage)
    const next = decideGoogleConsent(values as GoogleConsentValues, preferences)
    applyDecision(next)
    if (shouldRequestCustomPrivacySettings(next, preferences)) {
      setDraftPreferences(DENIED_PREFERENCES)
      setDetailsOpen(false)
      if (firstVisitGateActive) setDeferredAutoOpen(true)
      else setSettingsOpen(true)
    }
  }, [applyDecision, firstVisitGateActive])

  useEffect(() => {
    initializeGoogleConsentDefaults()
    if (!ADS_ENABLED || !ADSENSE_CLIENT) {
      const preferences = readPrivacyPreferences(localStorage)
      if (preferences) {
        // The saved choice is the initialization source for this external consent bridge.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        applyDecision({
          ready: true,
          regulated: false,
          adRequestsAllowed: false,
          adStorageAllowed: false,
          adUserDataAllowed: false,
          personalizedAdsAllowed: false,
          analyticsAllowed: preferences.analytics,
        })
      } else {
        setDeferredAutoOpen(true)
      }
      return
    }

    queueGoogleCallback('CONSENT_MODE_DATA_READY', syncGoogleDecision)
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncGoogleDecision()
    }
    window.addEventListener('focus', syncGoogleDecision)
    document.addEventListener('visibilitychange', syncWhenVisible)

    void ensureAdSenseScript(ADSENSE_CLIENT).catch(() => {
      setDecision(INITIAL_DECISION)
    })

    return () => {
      window.removeEventListener('focus', syncGoogleDecision)
      document.removeEventListener('visibilitychange', syncWhenVisible)
    }
  }, [applyDecision, syncGoogleDecision])

  const choosePrivacyPreferences = useCallback(
    (preferences: PrivacyPreferences) => {
      writePrivacyPreferences(localStorage, preferences)
      applyDecision({
        ready: true,
        regulated: false,
        adRequestsAllowed: ADS_ENABLED,
        adStorageAllowed: ADS_ENABLED && preferences.personalizedAds,
        adUserDataAllowed: ADS_ENABLED && preferences.personalizedAds,
        personalizedAdsAllowed: ADS_ENABLED && preferences.personalizedAds,
        analyticsAllowed: preferences.analytics,
      })
      setDeferredAutoOpen(false)
      setSettingsOpen(false)
      setDetailsOpen(false)
    },
    [applyDecision],
  )

  const openPrivacySettings = useCallback(() => {
    if (decision.regulated && configured) {
      queueGoogleCallback('CONSENT_MODE_DATA_READY', syncGoogleDecision)
      queueGoogleCallback('CONSENT_API_READY', () => {
        window.googlefc?.showRevocationMessage?.()
      })
      return
    }
    const savedPreferences = readPrivacyPreferences(localStorage) ?? {
      analytics: decision.analyticsAllowed,
      personalizedAds: decision.personalizedAdsAllowed,
    }
    setDraftPreferences(savedPreferences)
    setDetailsOpen(true)
    setDeferredAutoOpen(false)
    setSettingsOpen(true)
  }, [
    configured,
    decision.analyticsAllowed,
    decision.personalizedAdsAllowed,
    decision.regulated,
    syncGoogleDecision,
  ])

  const value = useMemo(
    () => ({
      ...decision,
      adRequestsAllowed: ADS_ENABLED && decision.adRequestsAllowed && !adFreePath,
      configured,
      openPrivacySettings,
    }),
    [adFreePath, configured, decision, openPrivacySettings],
  )

  const copy = t.privacySettings
  const customSettingsVisible = settingsOpen || (deferredAutoOpen && !firstVisitGateActive)
  const closePrivacySettings = () => {
    setDeferredAutoOpen(false)
    setSettingsOpen(false)
    setDetailsOpen(false)
  }

  const openDetailedSettings = () => {
    setDraftPreferences({
      analytics: decision.analyticsAllowed,
      personalizedAds: decision.personalizedAdsAllowed,
    })
    setDetailsOpen(true)
  }

  return (
    <GoogleConsentContext.Provider value={value}>
      {children}
      {customSettingsVisible && (
        <PrivacyNotice
          title={copy.title}
          intro={copy.intro}
          desktopIntro={copy.desktopIntro}
          closeLabel={copy.close}
          onRequestClose={closePrivacySettings}
          footer={detailsOpen ? (
            <div className="privacy-settings-actions privacy-settings-actions--single">
              <button
                type="button"
                className="btn btn-primary privacy-settings-action"
                onClick={() => choosePrivacyPreferences(draftPreferences)}
              >
                {copy.save}
              </button>
            </div>
          ) : (
            <div className="privacy-settings-actions">
              <button
                type="button"
                className="btn btn-ghost privacy-settings-action privacy-settings-action--deny"
                onClick={() => choosePrivacyPreferences(DENIED_PREFERENCES)}
              >
                {copy.deny}
              </button>
              <button
                type="button"
                className="btn btn-primary privacy-settings-action privacy-settings-action--allow"
                onClick={() => choosePrivacyPreferences({
                  analytics: true,
                  personalizedAds: true,
                })}
              >
                {copy.allow}
              </button>
              <button
                type="button"
                className="btn btn-ghost privacy-settings-action privacy-settings-details"
                onClick={openDetailedSettings}
              >
                {copy.details}
              </button>
            </div>
          )}
        >
          {detailsOpen && (
            <div className="privacy-settings-facts">
              <div className="privacy-settings-fact">
                <span>
                  <strong>{copy.analyticsTitle}</strong>
                  <span>{copy.analyticsBody}</span>
                </span>
                <label className="privacy-settings-toggle">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={copy.analyticsTitle}
                    checked={draftPreferences.analytics}
                    onChange={(event) => setDraftPreferences((current) => ({
                      ...current,
                      analytics: event.target.checked,
                    }))}
                  />
                  <span className="privacy-settings-toggle-track" aria-hidden="true" />
                  <span className="privacy-settings-toggle-label">
                    {draftPreferences.analytics ? copy.statusAllowed : copy.statusDenied}
                  </span>
                </label>
              </div>
              <div className="privacy-settings-fact">
                <span>
                  <strong>{copy.personalizedAdsTitle}</strong>
                  <span>{copy.personalizedAdsBody}</span>
                </span>
                <label className="privacy-settings-toggle">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={copy.personalizedAdsTitle}
                    checked={draftPreferences.personalizedAds}
                    onChange={(event) => setDraftPreferences((current) => ({
                      ...current,
                      personalizedAds: event.target.checked,
                    }))}
                  />
                  <span className="privacy-settings-toggle-track" aria-hidden="true" />
                  <span className="privacy-settings-toggle-label">
                    {draftPreferences.personalizedAds ? copy.statusAllowed : copy.statusDenied}
                  </span>
                </label>
              </div>
              <p className="privacy-settings-ad-notice">{copy.adNotice}</p>
            </div>
          )}
        </PrivacyNotice>
      )}
    </GoogleConsentContext.Provider>
  )
}
