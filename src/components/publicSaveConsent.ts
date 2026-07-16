import type { StorageLike, WritableStorageLike } from './serviceDisclaimerLogic'

export const PUBLIC_SAVE_CONSENT_KEY = 'leverage-public-save-consent-v1'

export type PublicSaveConsent = 'off' | 'local'

export function readPublicSaveConsent(storage: StorageLike): PublicSaveConsent | null {
  try {
    const value = storage.getItem(PUBLIC_SAVE_CONSENT_KEY)
    return value === 'off' || value === 'local' ? value : null
  } catch {
    return null
  }
}

export function writePublicSaveConsent(
  storage: WritableStorageLike,
  consent: PublicSaveConsent,
): void {
  try {
    storage.setItem(PUBLIC_SAVE_CONSENT_KEY, consent)
  } catch {
    // 저장소 접근이 막혀도 현재 세션의 계산기 사용은 계속 허용한다.
  }
}

export function shouldShowPublicSaveConsent(
  pathname: string,
  storage: StorageLike,
): boolean {
  return pathname === '/' && readPublicSaveConsent(storage) == null
}
