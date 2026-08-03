import {
  readDisclaimerAck,
  readDisclaimerSkip,
  type StorageLike,
  type WritableStorageLike,
} from './serviceDisclaimerLogic'
import { readPublicSaveConsent } from './publicSaveConsent'

/** 첫 진입 환영 온보딩 완료 여부(영구, localStorage). */
export const WELCOME_COMPLETED_KEY = 'leverage-welcome-completed-v1'

export function readWelcomeCompleted(local: StorageLike): boolean {
  try {
    return local.getItem(WELCOME_COMPLETED_KEY) === '1'
  } catch {
    return false
  }
}

export function writeWelcomeCompleted(local: WritableStorageLike): void {
  try {
    local.setItem(WELCOME_COMPLETED_KEY, '1')
  } catch {
    // ignore
  }
}

/**
 * 환영 플로우를 띄울지 판정하는 순수 게이트. 기존 면책 게이트 규칙을 재사용하되,
 * 신규 방문자에게만 노출한다:
 * - 공개 계산기 홈이 아니면 안 띄운다.
 * - 이미 온보딩을 마쳤으면 안 띄운다.
 * - **기존 유저 마이그레이션**: 옛 면책에서 "다시 안 보기"를 누른 사람(skip)에겐 안 띄운다.
 * - 이번 세션에 이미 면책을 확인한 사람(ack)도 방해하지 않는다.
 * - 공개 저장 방식을 이미 고른 기존 방문자에게도 새 온보딩을 다시 띄우지 않는다.
 */
export function shouldShowWelcome(
  pathname: string,
  local: StorageLike,
  session: StorageLike,
): boolean {
  if (pathname !== '/') return false
  if (readWelcomeCompleted(local)) return false
  if (readDisclaimerSkip(local)) return false
  if (readDisclaimerAck(session)) return false
  if (readPublicSaveConsent(local) != null) return false
  return true
}
