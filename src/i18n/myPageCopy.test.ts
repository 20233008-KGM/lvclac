import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('my page copy', () => {
  it('provides Korean account-hub copy without promising live billing or instant deletion', () => {
    expect(ko.myPage.title).toBe('마이페이지')
    expect(ko.myPage.profileTitle).toBe('프로필')
    expect(ko.myPage.storageLoading).toBe('저장 데이터 상태를 불러오는 중')
    expect(ko.myPage.planStatusValue).toBe('Paddle 결제 연동 중')
    expect(ko.myPage.deleteAccountBody).toContain('요청')
    expect(ko.myPage.deleteAccountBody).not.toContain('즉시 삭제')
    expect(ko.myPage.linkedLoginTitle).toBe('연동된 로그인')
    expect(ko.myPage.linkGoogleAction).toBe('Google 연동')
    expect(ko.myPage.unlinkGoogleAction).toBe('해제')
    expect(ko.myPage.setPasswordAction).toBe('비밀번호 설정')
  })

  it('provides English account-hub copy without promising live billing or instant deletion', () => {
    expect(en.myPage.title).toBe('My page')
    expect(en.myPage.profileTitle).toBe('Profile')
    expect(en.myPage.storageLoading).toBe('Loading saved data status')
    expect(en.myPage.planStatusValue).toBe('Paddle integration in progress')
    expect(en.myPage.deleteAccountBody).toContain('request')
    expect(en.myPage.deleteAccountBody).not.toContain('immediately delete')
    expect(en.myPage.linkedLoginTitle).toBe('Linked logins')
    expect(en.myPage.linkGoogleAction).toBe('Link Google')
    expect(en.myPage.unlinkGoogleAction).toBe('Unlink')
    expect(en.myPage.setPasswordAction).toBe('Set password')
  })

  it('provides the order-history auto-save toggle copy in both languages', () => {
    expect(ko.myPage.autoSaveOrderHistoryLabel).toBe('주문 기록 자동 저장')
    expect(ko.myPage.autoSaveOrderHistoryHint).toContain('자동 저장')
    expect(en.myPage.autoSaveOrderHistoryLabel).toBe('Auto-save order history')
    expect(en.myPage.autoSaveOrderHistoryHint).toContain('order simulation history')
  })

  it('provides the account-setting-guard preferences toggle copy in both languages', () => {
    expect(ko.myPage.preferencesTitle).toBe('환경설정')
    expect(ko.myPage.accountSettingGuardToggleLabel).toBe('계좌 세팅 변경 시 경고모달 띄우기')
    expect(ko.myPage.accountSettingGuardToggleHint).toContain('이 기기에서만')
    expect(en.myPage.preferencesTitle).toBe('Preferences')
    expect(en.myPage.accountSettingGuardToggleLabel).toBe('Show warning when changing account setup')
    expect(en.myPage.accountSettingGuardToggleHint).toContain('this device only')
  })

  it('provides number-set management copy for preferences in both languages', () => {
    expect(ko.myPage.numberSetsTitle).toBe('숫자세트')
    expect(ko.myPage.numberSetsLimitNote).toContain('각 위치 최대 10개')
    expect(ko.myPage.addLocalNumberSet).toBe('이 기기 세트 추가')
    expect(ko.myPage.addCloudNumberSet).toBe('클라우드 세트 추가')
    expect(en.myPage.numberSetsTitle).toBe('Number sets')
    expect(en.myPage.numberSetsLimitNote).toContain('up to 10 per location')
    expect(en.myPage.addLocalNumberSet).toBe('Add device set')
    expect(en.myPage.addCloudNumberSet).toBe('Add cloud set')
  })

  it('provides number-set detail modal copy for both languages', () => {
    expect(ko.myPage.numberSetDetailOpen).toBe('전체 상세 보기')
    expect(ko.myPage.numberSetDetailInputsHeading).toBe('입력값')
    expect(ko.myPage.numberSetDetailResultsHeading).toBe('계산 결과')
    expect(ko.myPage.numberSetDetailPositionLabel).toBe('포지션')
    expect(ko.myPage.numberSetDetailClose).toBe('닫기')
    expect(en.myPage.numberSetDetailOpen).toBe('View full details')
    expect(en.myPage.numberSetDetailInputsHeading).toBe('Inputs')
    expect(en.myPage.numberSetDetailResultsHeading).toBe('Results')
    expect(en.myPage.numberSetDetailPositionLabel).toBe('Position')
    expect(en.myPage.numberSetDetailClose).toBe('Close')
  })

  it('provides the side/pill nav copy for both languages', () => {
    expect(ko.myPage.navLabel).toBe('마이페이지 섹션 바로가기')
    expect(ko.myPage.navAccount).toBe('계정')
    expect(ko.myPage.navData).toBe('데이터')
    expect(ko.myPage.navPlanPreferences).toBe('구독·환경설정')
    expect(ko.myPage.navSupport).toBe('지원')
    expect(en.myPage.navLabel).toBe('Jump to my page section')
    expect(en.myPage.navAccount).toBe('Account')
    expect(en.myPage.navData).toBe('Data')
    expect(en.myPage.navPlanPreferences).toBe('Plan & preferences')
    expect(en.myPage.navSupport).toBe('Support')
  })

  it('provides compact records summary copy for both languages', () => {
    expect(ko.myPage.recordsSummaryTitle).toBe('계정 기록')
    expect(ko.myPage.latestSnapshotTitle).toBe('최근 계좌스냅샷')
    expect(ko.myPage.recentOrdersTitle).toBe('최근 주문')
    expect(ko.myPage.recordsArchiveLink).toBe('기록 장부 열기')
    expect(ko.myPage.latestSnapshotEmpty).toContain('계좌스냅샷')

    expect(en.myPage.recordsSummaryTitle).toBe('Account records')
    expect(en.myPage.latestSnapshotTitle).toBe('Latest account snapshot')
    expect(en.myPage.recentOrdersTitle).toBe('Recent orders')
    expect(en.myPage.recordsArchiveLink).toBe('Open records ledger')
    expect(en.myPage.latestSnapshotEmpty).toContain('snapshot')
  })
})
