import { isCalculatorHomePath } from '../config/routes'
import { shouldShowWelcome } from './welcomeFlowLogic'
import type { StorageLike, WritableStorageLike } from './serviceDisclaimerLogic'

export const WELCOME_INTRO_SEEN_KEY = 'liqguard-welcome-intro-seen-v1'

export function shouldShowWelcomeIntroduction(
  pathname: string,
  search: string,
  local: StorageLike,
  session: StorageLike,
): boolean {
  if (!isCalculatorHomePath(pathname)) return false
  // A shareable preview also works after the one-time introduction was dismissed.
  if (new URLSearchParams(search).get('welcome') === '1') return true
  try {
    if (local.getItem(WELCOME_INTRO_SEEN_KEY) === '1') return false
    // Existing public visitors may have chosen storage without the legacy welcome flow.
    if (local.getItem('leverage-public-save-consent-v1') != null) return false
  } catch {
    // Storage restrictions should never prevent someone from using the calculator.
  }
  return shouldShowWelcome(pathname, local, session)
}

export function dismissWelcomeIntroduction(local: WritableStorageLike): void {
  try {
    local.setItem(WELCOME_INTRO_SEEN_KEY, '1')
  } catch {
    // The caller still closes the introduction for this page session.
  }
}
