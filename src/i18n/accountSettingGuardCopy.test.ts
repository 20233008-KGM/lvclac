import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('account setting guard copy', () => {
  it('provides Korean confirmation copy', () => {
    expect(ko.accountSettingGuard.title).toBe('계좌 세팅을 변경할까요?')
    expect(ko.accountSettingGuard.confirm).toBe('그럼에도 불구하고 변경')
    expect(ko.accountSettingGuard.cancel).toBe('취소')
    expect(ko.accountSettingGuard.body).toContain('현재가 입력창')
    expect(ko.accountSettingGuard.body).toContain('주문패드')
    expect(ko.accountSettingGuard.skipModalLabel).toBe('다시 띄우지 않기')
  })

  it('provides English confirmation copy', () => {
    expect(en.accountSettingGuard.title).toBe('Change account setup?')
    expect(en.accountSettingGuard.confirm).toBe('Change anyway')
    expect(en.accountSettingGuard.cancel).toBe('Cancel')
    expect(en.accountSettingGuard.body).toContain('current-price field')
    expect(en.accountSettingGuard.body).toContain('order pad')
    expect(en.accountSettingGuard.skipModalLabel).toBe("Don't show this again")
  })
})
