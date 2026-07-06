/**
 * 개발 전용: "테스트 계정 완전 삭제" 직후 다음 구글 로그인에서 동의/계정선택 화면을
 * 강제로 다시 띄우기 위한 1회성 플래그.
 *
 * 구글의 OAuth 승인은 우리 DB가 아니라 사용자의 구글 계정에 저장되므로, DB에서 계정을
 * 지워도 재로그인 시 동의 화면이 안 뜬다. 이 플래그가 켜져 있으면 signInWithGoogle이
 * `prompt=consent select_account`를 붙여 첫 로그인 경험을 재현한다.
 *
 * 이 모듈에는 민감 문자열이 없고, 소비 측(AuthContext)이 import.meta.env.DEV로 가드하므로
 * 프로덕션 번들에서는 트리셰이킹으로 제거된다.
 */
const FORCE_CONSENT_KEY = 'dev_force_oauth_consent'

/** 다음 구글 로그인에서 첫 로그인 화면을 강제하도록 표시. */
export function markForcedConsent(): void {
  try {
    localStorage.setItem(FORCE_CONSENT_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** 플래그가 켜져 있으면 true를 반환하고 즉시 소비(1회성). */
export function consumeForcedConsent(): boolean {
  try {
    if (localStorage.getItem(FORCE_CONSENT_KEY) === '1') {
      localStorage.removeItem(FORCE_CONSENT_KEY)
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}
