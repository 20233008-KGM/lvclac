import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ADSENSE_CLIENT } from '../config/ads'
import { isAdFreePublicInfoPath } from '../config/routes'
import { TrustModalFrame } from '../components/TrustModalFrame'
import { useFirstVisitGateActive } from './FirstVisitFlowContext'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { ensureAdSenseScript, setAdRequestsPaused } from '../lib/adsense'
import { initAnalytics } from '../lib/analytics'
import {
  applyGoogleConsentMode,
  decideGoogleConsent,
  initializeGoogleConsentDefaults,
  readOptionalTrackingPreference,
  shouldRequestCustomPrivacySettings,
  writeOptionalTrackingPreference,
  type GoogleConsentDecision,
  type GoogleConsentValues,
  type OptionalTrackingPreference,
} from '../lib/googleConsent'
import { GoogleConsentContext } from './googleConsentState'

const INITIAL_DECISION: GoogleConsentDecision = {
  ready: false,
  regulated: true,
  adsAllowed: false,
  analyticsAllowed: false,
}

function queueGoogleCallback(key: string, callback: () => void): void {
  window.googlefc = window.googlefc || {}
  window.googlefc.callbackQueue = window.googlefc.callbackQueue || []
  window.googlefc.callbackQueue.push({ [key]: callback })
}

function PrivacyControlsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.5 7.7-7 9.3-4.5-1.6-7-4.9-7-9.3V6z" />
      <path d="M9 10h6" />
      <path d="M9 14h6" />
      <circle cx="11" cy="10" r="1" />
      <circle cx="13" cy="14" r="1" />
    </svg>
  )
}

export function GoogleConsentProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const firstVisitGateActive = useFirstVisitGateActive()
  const adFreePath = isAdFreePublicInfoPath(pathname)
  const [decision, setDecision] = useState<GoogleConsentDecision>(INITIAL_DECISION)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deferredAutoOpen, setDeferredAutoOpen] = useState(false)
  const configured = Boolean(ADSENSE_CLIENT)

  const applyDecision = useCallback((next: GoogleConsentDecision) => {
    setDecision(next)
    applyGoogleConsentMode(next)
    setAdRequestsPaused(adFreePath || !next.adsAllowed)
    if (next.analyticsAllowed) initAnalytics()
  }, [adFreePath])

  useEffect(() => {
    setAdRequestsPaused(adFreePath || !decision.adsAllowed)
  }, [adFreePath, decision.adsAllowed])

  const syncGoogleDecision = useCallback(() => {
    const values = window.googlefc?.getGoogleConsentModeValues?.()
    if (!values) return
    const preference = readOptionalTrackingPreference(localStorage)
    const next = decideGoogleConsent(values as GoogleConsentValues, preference)
    applyDecision(next)
    if (shouldRequestCustomPrivacySettings(next, preference)) {
      if (firstVisitGateActive) setDeferredAutoOpen(true)
      else setSettingsOpen(true)
    }
  }, [applyDecision, firstVisitGateActive])

  useEffect(() => {
    initializeGoogleConsentDefaults()
    if (!ADSENSE_CLIENT) return

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
  }, [syncGoogleDecision])

  const chooseOptionalTracking = useCallback(
    (preference: OptionalTrackingPreference) => {
      writeOptionalTrackingPreference(localStorage, preference)
      applyDecision({
        ready: true,
        regulated: false,
        adsAllowed: preference === 'allow',
        analyticsAllowed: preference === 'allow',
      })
      setDeferredAutoOpen(false)
      setSettingsOpen(false)
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
    setDeferredAutoOpen(false)
    setSettingsOpen(true)
  }, [configured, decision.regulated, syncGoogleDecision])

  const value = useMemo(
    () => ({
      ...decision,
      adsAllowed: decision.adsAllowed && !adFreePath,
      configured,
      openPrivacySettings,
    }),
    [adFreePath, configured, decision, openPrivacySettings],
  )

  const copy = t.privacySettings
  const customSettingsVisible = settingsOpen || (deferredAutoOpen && !firstVisitGateActive)
  const optionalAllowed = decision.ready && (decision.adsAllowed || decision.analyticsAllowed)
  const optionalStatus = !decision.ready
    ? copy.statusDefaultBlocked
    : optionalAllowed
      ? copy.statusAllowed
      : copy.statusDenied
  const closePrivacySettings = () => {
    setDeferredAutoOpen(false)
    setSettingsOpen(false)
  }

  return (
    <GoogleConsentContext.Provider value={value}>
      {children}
      {customSettingsVisible && (
        <TrustModalFrame
          variant="privacy"
          titleId="privacy-settings-title"
          descriptionId="privacy-settings-intro"
          eyebrow={copy.eyebrow}
          title={copy.title}
          intro={copy.intro}
          icon={<PrivacyControlsIcon />}
          closeLabel={copy.close}
          onRequestClose={closePrivacySettings}
          footer={(
            <div className="privacy-settings-actions">
              <button
                type="button"
                className="btn btn-ghost privacy-settings-action"
                onClick={() => chooseOptionalTracking('deny')}
              >
                {copy.deny}
              </button>
              <button
                type="button"
                className="btn btn-ghost privacy-settings-action"
                onClick={() => chooseOptionalTracking('allow')}
              >
                {copy.allow}
              </button>
            </div>
          )}
        >
          <div className="privacy-settings-facts">
            <div className="privacy-settings-fact">
              <span>
                <strong>{copy.coreTitle}</strong>
                <span>{copy.coreBody}</span>
              </span>
              <span className="privacy-settings-status privacy-settings-status--core">
                {copy.coreStatus}
              </span>
            </div>
            <div className="privacy-settings-fact">
              <span>
                <strong>{copy.optionalTitle}</strong>
                <span>{copy.optionalBody}</span>
              </span>
              <span
                className={`privacy-settings-status ${
                  optionalAllowed ? 'privacy-settings-status--allowed' : ''
                }`}
              >
                {optionalStatus}
              </span>
            </div>
          </div>
        </TrustModalFrame>
      )}
    </GoogleConsentContext.Provider>
  )
}
