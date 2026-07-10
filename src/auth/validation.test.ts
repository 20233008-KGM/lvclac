import { describe, expect, it } from 'vitest'
import {
  validateEmail,
  validateLoginPassword,
  validateNewPassword,
  validateNickname,
  validatePasswordConfirmation,
  validateTermsAccepted,
} from './validation'

describe('auth validation', () => {
  it('validates email format and trims surrounding whitespace', () => {
    expect(validateEmail('')).toBe('email_required')
    expect(validateEmail('not-an-email')).toBe('email_invalid')
    expect(validateEmail(' user@example.com ')).toBeNull()
  })

  it('rejects missing, short, long, common, and low-variety new passwords', () => {
    expect(validateNewPassword('')).toBe('password_required')
    // 11자 — 최소 12자 미만
    expect(validateNewPassword('aB3$aB3$aB3')).toBe('password_too_short')
    expect(validateNewPassword('a1!'.repeat(43))).toBe('password_too_long') // 129자
    // 흔한 비밀번호는 조합 검사보다 먼저 걸러진다
    expect(validateNewPassword('passwordpassword')).toBe('password_too_common')
    // 12자 이상이지만 숫자·특수문자가 없음
    expect(validateNewPassword('abcdefghijkl')).toBe('password_missing_char_types')
    // 영문·숫자는 있으나 특수문자가 없음
    expect(validateNewPassword('abcdefghij12')).toBe('password_missing_char_types')
    // 영문+숫자+특수문자를 모두 포함하고 흔하지 않음
    expect(validateNewPassword('market-safe-42')).toBeNull()
  })

  it('only requires a non-empty password for login submissions', () => {
    expect(validateLoginPassword('')).toBe('password_required')
    expect(validateLoginPassword('1234567')).toBeNull()
    expect(validateLoginPassword('password')).toBeNull()
  })

  it('validates password confirmation', () => {
    expect(validatePasswordConfirmation('market-safe-42', '')).toBe(
      'password_confirmation_required',
    )
    expect(validatePasswordConfirmation('market-safe-42', 'different')).toBe(
      'password_mismatch',
    )
    expect(validatePasswordConfirmation('market-safe-42', 'market-safe-42')).toBeNull()
  })

  it('validates nickname length after trimming', () => {
    expect(validateNickname(' a ')).toBe('nickname_too_short')
    expect(validateNickname('a'.repeat(21))).toBe('nickname_too_long')
    expect(validateNickname(' trader ')).toBeNull()
  })

  it('requires terms consent for signup', () => {
    expect(validateTermsAccepted(false)).toBe('terms_required')
    expect(validateTermsAccepted(true)).toBeNull()
  })
})
