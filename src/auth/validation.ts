import { COMMON_PASSWORDS } from './commonPasswords'

const MAX_NICKNAME_LENGTH = 20
const MIN_NICKNAME_LENGTH = 2
const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
// 최소 8자. Supabase 대시보드 Auth 최소 길이도 동일하게 맞춰 클라이언트 우회를 막는다.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 영문(대소문자 무관) / 숫자 / 특수문자 각 최소 1자 포함 요건 검사용.
const HAS_LETTER_RE = /[A-Za-z]/
const HAS_DIGIT_RE = /[0-9]/
// 영문·숫자·공백이 아닌 문자는 모두 특수문자로 간주 (Supabase 허용 기호 집합과 호환).
const HAS_SYMBOL_RE = /[^A-Za-z0-9]/

/** null 이면 유효, 아니면 에러 코드(i18n 키) 반환. */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'email_required'
  if (!EMAIL_RE.test(trimmed)) return 'email_invalid'
  return null
}

export function validateLoginPassword(password: string): string | null {
  if (!password) return 'password_required'
  return null
}

export function validateNewPassword(password: string): string | null {
  if (!password) return 'password_required'
  if (password.length < MIN_PASSWORD_LENGTH) return 'password_too_short'
  if (password.length > MAX_PASSWORD_LENGTH) return 'password_too_long'
  // 흔한 비밀번호는 조합 검사보다 먼저 걸러 더 구체적인 안내("너무 흔함")를 준다.
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) return 'password_too_common'
  // 영문·숫자·특수문자를 각각 최소 1자씩 포함해야 한다. (대/소문자 구분은 강제하지 않음)
  if (
    !HAS_LETTER_RE.test(password) ||
    !HAS_DIGIT_RE.test(password) ||
    !HAS_SYMBOL_RE.test(password)
  ) {
    return 'password_missing_char_types'
  }
  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (!confirmation) return 'password_confirmation_required'
  if (password !== confirmation) return 'password_mismatch'
  return null
}

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim()
  if (trimmed.length < MIN_NICKNAME_LENGTH) return 'nickname_too_short'
  if (trimmed.length > MAX_NICKNAME_LENGTH) return 'nickname_too_long'
  return null
}

export function validateTermsAccepted(accepted: boolean): string | null {
  return accepted ? null : 'terms_required'
}
