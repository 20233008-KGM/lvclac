import { createContext, useContext } from 'react'
import type { GoogleConsentDecision } from '../lib/googleConsent'

export interface GoogleConsentContextValue extends GoogleConsentDecision {
  configured: boolean
  openPrivacySettings: () => void
}

export const GoogleConsentContext =
  createContext<GoogleConsentContextValue | null>(null)

export function useGoogleConsent(): GoogleConsentContextValue {
  const context = useContext(GoogleConsentContext)
  if (!context) {
    throw new Error('useGoogleConsent must be used within GoogleConsentProvider')
  }
  return context
}
