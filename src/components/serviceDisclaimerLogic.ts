import { isMyPagePath } from '../config/routes'

export interface StorageLike {
  getItem: (key: string) => string | null
}

export interface WritableStorageLike extends StorageLike {
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
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

/** 이번 세션에 면책을 확인했음을 기록(sessionStorage). 환영 플로우 완료 시에도 공유 호출. */
export function writeDisclaimerAck(session: WritableStorageLike): void {
  try {
    session.setItem(DISCLAIMER_ACK_KEY, '1')
  } catch {
    // ignore
  }
}

/** 면책 영구 스킵 on/off(localStorage). 환영 플로우 완료 시 true로 설정해 재노출을 막는다. */
export function writeDisclaimerSkip(local: WritableStorageLike, skip: boolean): void {
  try {
    if (skip) local.setItem(DISCLAIMER_SKIP_KEY, '1')
    else local.removeItem(DISCLAIMER_SKIP_KEY)
  } catch {
    // ignore
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
