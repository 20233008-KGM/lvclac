import { describe, expect, it } from 'vitest'
import { en } from '../../i18n/locales/en'
import { ko } from '../../i18n/locales/ko'
import { authErrorMessage } from './authMessages'

describe('authErrorMessage', () => {
  it('maps known validation and Supabase auth codes in Korean', () => {
    expect(authErrorMessage('email_required', ko)).toBe(ko.auth.emailRequired)
    expect(authErrorMessage('password_mismatch', ko)).toBe(ko.auth.passwordMismatch)
    expect(authErrorMessage('not_configured', ko)).toBe(ko.auth.notConfigured)
  })

  it('maps known validation and Supabase auth codes in English', () => {
    expect(authErrorMessage('email_required', en)).toBe(en.auth.emailRequired)
    expect(authErrorMessage('password_mismatch', en)).toBe(en.auth.passwordMismatch)
    expect(authErrorMessage('not_configured', en)).toBe(en.auth.notConfigured)
  })

  it('returns null for empty codes and generic copy for unknown codes', () => {
    expect(authErrorMessage(null, en)).toBeNull()
    expect(authErrorMessage('unexpected_server_response', en)).toBe(en.auth.genericError)
  })
})
