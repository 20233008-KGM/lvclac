import { readDisclaimerAck, readDisclaimerSkip, type StorageLike } from './serviceDisclaimerLogic'
import { readWelcomeCompleted } from './welcomeFlowLogic'
import { LOCAL_NUMBER_SETS_KEY } from '../storage/localNumberSets'

export const EXAMPLES_VIEWED_KEY = 'liqguard-examples-viewed-v1'

/** Use prior product activity, never language/privacy preferences, to recognize returning visitors. */
export function hasPriorCalculatorVisit(local: StorageLike, session: StorageLike): boolean {
  if (readWelcomeCompleted(local) || readDisclaimerSkip(local) || readDisclaimerAck(session)) return true
  try {
    if (local.getItem(EXAMPLES_VIEWED_KEY) === '1') return true
    if (local.getItem('leverage_save_enabled') === '1') return true
    if (local.getItem('leverage-public-save-consent-v1') != null) return true
    if (local.getItem('leverage_trader_stage') != null) return true
    for (const key of [LOCAL_NUMBER_SETS_KEY, 'leverage_calculator_draft']) {
      const raw = local.getItem(key)
      if (!raw) continue
      try {
        const value: unknown = JSON.parse(raw)
        if (Array.isArray(value) ? value.length > 0 : value && typeof value === 'object' && Object.keys(value).length > 0) return true
      } catch { /* Ignore invalid legacy data. */ }
    }
  } catch { /* Storage restrictions must not prevent using the calculator. */ }
  return false
}

export function shouldShowExamplesWelcome(priorVisit: boolean, sessionLoading: boolean, signedIn: boolean): boolean {
  return !priorVisit && !sessionLoading && !signedIn
}
