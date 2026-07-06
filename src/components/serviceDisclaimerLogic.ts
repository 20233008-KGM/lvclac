import { isMyPagePath } from '../config/routes'

export interface StorageLike {
  getItem: (key: string) => string | null
}

export const DISCLAIMER_ACK_KEY = 'leverage-disclaimer-ack-v3'
export const DISCLAIMER_SKIP_KEY = 'leverage-disclaimer-skip-v3'

export function readDisclaimerSkip(storage: StorageLike): boolean {
  try {
    return storage.getItem(DISCLAIMER_SKIP_KEY) === '1'
  } catch {
    return false
  }
}

export function readDisclaimerAck(storage: StorageLike): boolean {
  try {
    return storage.getItem(DISCLAIMER_ACK_KEY) === '1'
  } catch {
    return false
  }
}

export function shouldAutoShowDisclaimer(
  pathname: string,
  local: StorageLike,
  session: StorageLike,
): boolean {
  if (isMyPagePath(pathname)) return false
  if (readDisclaimerSkip(local)) return false
  if (readDisclaimerAck(session)) return false
  return true
}
