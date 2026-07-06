import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('my page copy', () => {
  it('provides Korean account-hub copy without promising live billing or instant deletion', () => {
    expect(ko.myPage.title).toBe('마이페이지')
    expect(ko.myPage.profileTitle).toBe('프로필')
    expect(ko.myPage.storageLoading).toBe('저장 데이터 상태를 불러오는 중')
    expect(ko.myPage.planStatusValue).toBe('결제 연동 준비 중')
    expect(ko.myPage.deleteAccountBody).toContain('요청')
    expect(ko.myPage.deleteAccountBody).not.toContain('즉시 삭제')
    expect(ko.myPage.linkedLoginTitle).toBe('연동된 로그인')
    expect(ko.myPage.linkGoogleAction).toBe('Google 연동')
    expect(ko.myPage.unlinkGoogleAction).toBe('해제')
  })

  it('provides English account-hub copy without promising live billing or instant deletion', () => {
    expect(en.myPage.title).toBe('My page')
    expect(en.myPage.profileTitle).toBe('Profile')
    expect(en.myPage.storageLoading).toBe('Loading saved data status')
    expect(en.myPage.planStatusValue).toBe('Billing integration pending')
    expect(en.myPage.deleteAccountBody).toContain('request')
    expect(en.myPage.deleteAccountBody).not.toContain('immediately delete')
    expect(en.myPage.linkedLoginTitle).toBe('Linked logins')
    expect(en.myPage.linkGoogleAction).toBe('Link Google')
    expect(en.myPage.unlinkGoogleAction).toBe('Unlink')
  })
})
