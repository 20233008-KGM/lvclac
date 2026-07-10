import { COMMON_PASSWORDS } from './commonPasswords'

/**
 * 비밀번호 강도 등급. 화면의 강도 막대·라벨에 사용한다.
 * 입력이 비어 있으면 null(표시 안 함).
 */
export type PasswordStrength = 'weak' | 'fair' | 'strong'

const MIN_STRONG_BASELINE = 12

/** 포함된 문자 종류 수(소문자·대문자·숫자·특수문자) 0~4. */
function countCharClasses(password: string): number {
  let classes = 0
  if (/[a-z]/.test(password)) classes += 1
  if (/[A-Z]/.test(password)) classes += 1
  if (/[0-9]/.test(password)) classes += 1
  if (/[^A-Za-z0-9]/.test(password)) classes += 1
  return classes
}

/**
 * 강도 평가는 NIST 권고를 따라 **길이를 가장 크게** 보고 문자 다양성은 가점만 준다.
 * 흔한 비밀번호이거나 최소 길이 미만이면 무조건 'weak'.
 * 이 함수는 입력을 막지 않는다(안내용). 실제 차단은 validateNewPassword가 한다.
 */
export function assessPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) return 'weak'
  if (password.length < MIN_STRONG_BASELINE) return 'weak'

  const classes = countCharClasses(password)
  let score = 1 // 최소 길이 이상 통과
  if (password.length >= 16) score += 1
  if (password.length >= 20) score += 1
  if (classes >= 3) score += 1
  if (classes >= 4) score += 1

  return score <= 2 ? 'fair' : 'strong'
}
