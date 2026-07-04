const MAX_NICKNAME_LENGTH = 20
const MIN_NICKNAME_LENGTH = 2
const MIN_PASSWORD_LENGTH = 8
// Supabase 기본 정책과 동일하게 8자 이상 권장. 대시보드 정책과 맞추세요.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** null 이면 유효, 아니면 에러 코드(i18n 키) 반환. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'email_required'
  if (!EMAIL_RE.test(trimmed)) return 'email_invalid'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'password_required'
  if (password.length < MIN_PASSWORD_LENGTH) return 'password_too_short'
  return null
}

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim()
  if (trimmed.length < MIN_NICKNAME_LENGTH) return 'nickname_too_short'
  if (trimmed.length > MAX_NICKNAME_LENGTH) return 'nickname_too_long'
  return null
}
