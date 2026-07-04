import { describe, expect, it } from 'vitest'
import { en } from '../../i18n/locales/en'
import { ko } from '../../i18n/locales/ko'

describe('auth flow copy', () => {
  it('provides Korean copy for single-card login and signup flow', () => {
    expect(ko.auth.loginTitle).toBe('로그인')
    expect(ko.auth.loginSubtitle).toBe('저장된 입력값과 설정을 불러옵니다.')
    expect(ko.auth.registerTitle).toBe('회원가입')
    expect(ko.auth.registerSubtitle).toBe('다른 기기에서도 입력값을 이어서 사용합니다.')
    expect(ko.auth.loginSubmitting).toBe('로그인 중...')
    expect(ko.auth.registerSubmitting).toBe('가입 처리 중...')
    expect(ko.auth.switchToRegisterPrompt).toBe('처음이신가요?')
    expect(ko.auth.switchToRegisterAction).toBe('회원가입')
    expect(ko.auth.switchToLoginPrompt).toBe('이미 계정이 있나요?')
    expect(ko.auth.switchToLoginAction).toBe('로그인')
  })

  it('provides English copy for single-card login and signup flow', () => {
    expect(en.auth.loginTitle).toBe('Log in')
    expect(en.auth.loginSubtitle).toBe('Load your saved inputs and settings.')
    expect(en.auth.registerTitle).toBe('Sign up')
    expect(en.auth.registerSubtitle).toBe('Continue your inputs across devices.')
    expect(en.auth.loginSubmitting).toBe('Logging in...')
    expect(en.auth.registerSubmitting).toBe('Creating account...')
    expect(en.auth.switchToRegisterPrompt).toBe('New here?')
    expect(en.auth.switchToRegisterAction).toBe('Sign up')
    expect(en.auth.switchToLoginPrompt).toBe('Already have an account?')
    expect(en.auth.switchToLoginAction).toBe('Log in')
  })
})
