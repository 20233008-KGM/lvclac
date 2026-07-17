import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ADSENSE_CLIENT } from '../config/ads'
import { isAdFreePublicInfoPath } from '../config/routes'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { ensureAdSenseScript, setAdRequestsPaused } from '../lib/adsense'
import { initAnalytics } from '../lib/analytics'
import {
  applyGoogleConsentMode,
  decideGoogleConsent,
  initializeGoogleConsentDefaults,
  readOptionalTrackingPreference,
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

export function GoogleConsentProvider({ children }: { children: ReactNode }) {
  const { locale } = useLanguage()
  const pathname = usePathname()
  const adFreePath = isAdFreePublicInfoPath(pathname)
  const [decision, setDecision] = useState<GoogleConsentDecision>(INITIAL_DECISION)
  const [settingsOpen, setSettingsOpen] = useState(false)
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
    if (next.ready && !next.regulated && preference === null) {
      setSettingsOpen(true)
    }
  }, [applyDecision])

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

  const copy =
    locale === 'ko'
      ? {
          title: '개인정보·쿠키 설정',
          body:
            '분석과 광고에 필요한 선택 기술을 허용하거나 거부할 수 있습니다. 거부해도 계산기와 기기 내 저장 기능은 계속 사용할 수 있습니다.',
          deny: '선택 기능 거부',
          allow: '분석·광고 허용',
          close: '닫기',
        }
      : {
          title: 'Privacy and cookie settings',
          body:
            'Allow or deny optional technologies used for analytics and advertising. The calculator and device storage remain available if you deny them.',
          deny: 'Deny optional use',
          allow: 'Allow analytics and ads',
          close: 'Close',
        }

  return (
    <GoogleConsentContext.Provider value={value}>
      {children}
      {settingsOpen && (
        <div
          className="disclaimer-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSettingsOpen(false)
          }}
        >
          <div
            className="disclaimer-modal privacy-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-settings-title"
          >
            <button
              type="button"
              className="modal-icon-btn"
              aria-label={copy.close}
              onClick={() => setSettingsOpen(false)}
            >
              ×
            </button>
            <h2 id="privacy-settings-title" className="disclaimer-modal-title">
              {copy.title}
            </h2>
            <p className="disclaimer-modal-text">{copy.body}</p>
            <div className="account-setting-guard-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => chooseOptionalTracking('deny')}
              >
                {copy.deny}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => chooseOptionalTracking('allow')}
              >
                {copy.allow}
              </button>
            </div>
          </div>
        </div>
      )}
    </GoogleConsentContext.Provider>
  )
}
