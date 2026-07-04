import { describe, expect, it } from 'vitest'
import {
  validateEmail,
  validateNickname,
  validatePassword,
  validatePasswordConfirmation,
  validateTermsAccepted,
} from './validation'

describe('auth validation', () => {
  it('validates email format and trims surrounding whitespace', () => {
    expect(validateEmail('')).toBe('email_required')
    expect(validateEmail('not-an-email')).toBe('email_invalid')
    expect(validateEmail(' user@example.com ')).toBeNull()
  })

  it('rejects missing, short, long, and common passwords', () => {
    expect(validatePassword('')).toBe('password_required')
    expect(validatePassword('1234567')).toBe('password_too_short')
    expect(validatePassword('a'.repeat(129))).toBe('password_too_long')
    expect(validatePassword('password')).toBe('password_too_common')
    expect(validatePassword('market-safe-42')).toBeNull()
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
