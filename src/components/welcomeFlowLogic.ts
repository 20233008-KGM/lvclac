import { isMyPagePath } from '../config/routes'
import {
  readDisclaimerAck,
  readDisclaimerSkip,
  type StorageLike,
  type WritableStorageLike,
} from './serviceDisclaimerLogic'

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
 * - 마이페이지 경로면 안 띄운다(면책과 동일).
 * - 이미 온보딩을 마쳤으면 안 띄운다.
 * - **기존 유저 마이그레이션**: 옛 면책에서 "다시 안 보기"를 누른 사람(skip)에겐 안 띄운다.
 * - 이번 세션에 이미 면책을 확인한 사람(ack)도 방해하지 않는다.
 */
export function shouldShowWelcome(
  pathname: string,
  local: StorageLike,
  session: StorageLike,
): boolean {
  if (isMyPagePath(pathname)) return false
  if (readWelcomeCompleted(local)) return false
  if (readDisclaimerSkip(local)) return false
  if (readDisclaimerAck(session)) return false
  return true
}
