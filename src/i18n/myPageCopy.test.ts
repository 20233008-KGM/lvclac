import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('my page copy', () => {
  it('confirms cancellation in both languages while keeping the remaining Pro period clear', () => {
    expect(ko.myPage.billing.page.cancellation.successTitle).toBe('구독이 취소되었습니다')
    expect(ko.myPage.billing.page.cancelScheduledBody).toBe('구독이 취소되었습니다. 종료일까지 Pro 기능은 그대로 유지됩니다.')
    expect(ko.myPage.billing.page.cancelScheduledBadge).toBe('구독 취소됨')
    expect(ko.myPage.billing.page.cancellation.successBody).toContain('자동갱신이 중단되었습니다')
    expect(en.myPage.billing.page.cancellation.successTitle).toBe('Your subscription has been canceled')
    expect(en.myPage.billing.page.cancelScheduledBody).toBe('Your subscription has been canceled. Pro remains available until the end date.')
    expect(en.myPage.billing.page.cancelScheduledBadge).toBe('Subscription canceled')
    expect(en.myPage.billing.page.cancellation.successBody).toContain('Automatic renewal is off')
  })

  it('provides Korean account-hub copy for live billing without promising instant deletion', () => {
    expect(ko.myPage.title).toBe('마이페이지')
    expect(ko.myPage.profileTitle).toBe('프로필')
    expect(ko.myPage.storageLoading).toBe('저장 데이터 상태를 불러오는 중')
    expect(ko.myPage.planStatusValue).toBe('Paddle Live 결제 사용 가능')
    expect(ko.myPage.deleteAccountBody).toContain('요청')
    expect(ko.myPage.deleteAccountBody).not.toContain('즉시 삭제')
    expect(ko.myPage.linkedLoginTitle).toBe('연동된 로그인')
    expect(ko.myPage.linkGoogleAction).toBe('Google 연동')
    expect(ko.myPage.unlinkGoogleAction).toBe('해제')
    expect(ko.myPage.setPasswordAction).toBe('비밀번호 설정')
  })

  it('provides English account-hub copy for live billing without promising instant deletion', () => {
    expect(en.myPage.title).toBe('My page')
    expect(en.myPage.profileTitle).toBe('Profile')
    expect(en.myPage.storageLoading).toBe('Loading saved data status')
    expect(en.myPage.planStatusValue).toBe('Paddle Live billing available')
    expect(en.myPage.deleteAccountBody).toContain('request')
    expect(en.myPage.deleteAccountBody).not.toContain('immediately delete')
    expect(en.myPage.linkedLoginTitle).toBe('Linked logins')
    expect(en.myPage.linkGoogleAction).toBe('Link Google')
    expect(en.myPage.unlinkGoogleAction).toBe('Unlink')
    expect(en.myPage.setPasswordAction).toBe('Set password')
  })

  it('identifies Paddle as the payment and receipt partner before and after checkout', () => {
    const koPartnerNotice = '결제와 영수증 발송은 공식 결제 파트너 Paddle이 처리합니다.'

    expect(ko.myPage.billing.page.upgrade.finalFinePrint).toBe(koPartnerNotice)
    expect(ko.myPage.billing.checkoutSuccess).toContain(koPartnerNotice)
    expect(ko.myPage.billing.page.successBody).toContain(koPartnerNotice)
    expect(ko.myPage.billing.taxNote).toContain('공식 결제 파트너 Paddle')

    expect(en.myPage.billing.page.upgrade.finalFinePrint).toContain('official payment partner')
    expect(en.myPage.billing.page.upgrade.finalFinePrint).toContain('receipts')
    expect(en.myPage.billing.checkoutSuccess).toContain('official payment partner')
    expect(en.myPage.billing.page.successBody).toContain('official payment partner')
    expect(en.myPage.billing.taxNote).toContain('official payment partner')
  })

  it('keeps checkout-return copy in an updating state instead of a Free-plan state', () => {
    expect(ko.myPage.billing.checkoutPendingTitle).toBe('결제 상태를 반영하는 중')
    expect(ko.myPage.billing.checkoutPendingBody).toContain('Pro 상태로 자동 전환')
    expect(en.myPage.billing.checkoutPendingTitle).toBe('Updating subscription status')
    expect(en.myPage.billing.checkoutPendingBody).toContain('switch to Pro automatically')
  })

  it('explains monthly to yearly switching through in-app Paddle preview and update', () => {
    expect(ko.myPage.billing.page.switchYearlyAction).toBe('연간으로 전환')
    expect(ko.myPage.billing.page.switchYearlyPreviewBusy).toContain('결제 금액')
    expect(ko.myPage.billing.page.switchYearlyPreviewBody).toContain('저장된 결제 수단')
    expect(ko.myPage.billing.page.switchYearlySuccess).toContain('크레딧')
    expect(
      ko.myPage.billing.page.upgrade.faq.find((item) => item.q.includes('월간'))?.a,
    ).toContain('연간 결제에 반영')

    expect(en.myPage.billing.page.switchYearlyAction).toBe('Switch to yearly')
    expect(en.myPage.billing.page.switchYearlyPreviewBusy).toContain('payment amount')
    expect(en.myPage.billing.page.switchYearlyPreviewBody).toContain('saved payment method')
    expect(en.myPage.billing.page.switchYearlySuccess).toContain('credit')
    expect(
      en.myPage.billing.page.upgrade.faq.find((item) => item.q.includes('monthly'))?.a,
    ).toContain('annual charge')
  })

  it('explains yearly switch failure cases without a generic dead-button message', () => {
    expect(ko.myPage.billing.page.switchYearlyUnsupportedPlan).toContain('월간 플랜')
    expect(ko.myPage.billing.page.switchYearlyUpdateFailed).toContain('Paddle')
    expect(ko.myPage.billing.page.switchYearlyNoSubscription).toContain('구독 정보')

    expect(en.myPage.billing.page.switchYearlyUnsupportedPlan).toContain('monthly plan')
    expect(en.myPage.billing.page.switchYearlyUpdateFailed).toContain('Paddle')
    expect(en.myPage.billing.page.switchYearlyNoSubscription).toContain('subscription')
  })

  it('provides the order-history auto-save toggle copy in both languages', () => {
    expect(ko.myPage.autoSaveOrderHistoryLabel).toBe('주문 기록 저장')
    expect(ko.myPage.autoSaveOrderHistoryHint).toContain('주문 적용 시')
    expect(ko.myPage.autoSaveOrderHistoryHint).toContain('기존 기록은 유지')
    expect(en.myPage.autoSaveOrderHistoryLabel).toBe('Save order history')
    expect(en.myPage.autoSaveOrderHistoryHint).toContain('saves its simulation history')
  })

  it('describes account snapshots as a shared schedule controlled by per-slot switches', () => {
    expect(ko.myPage.autoSnapshotTitle).toBe('계좌스냅샷 저장 시각')
    expect(ko.myPage.autoSnapshotBody).toContain('매일 기록을 켠 클라우드 세트')
    expect(ko.myPage.autoSnapshotNoSlotsSelected).toContain('숫자세트에서 매일 기록')
    expect(en.myPage.autoSnapshotTitle).toBe('Account snapshot time')
    expect(en.myPage.autoSnapshotBody).toContain('Record daily')
    expect(en.myPage.autoSnapshotNoSlotsSelected).toContain('number set')
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
    expect(ko.myPage.autoSnapshotColumnLabel).toBe('자동 기록')
    expect(ko.myPage.numberSetInstrumentColumnLabel).toBe('거래종목')
    expect(en.myPage.numberSetsTitle).toBe('Number sets')
    expect(en.myPage.numberSetsLimitNote).toContain('up to 10 per location')
    expect(en.myPage.addLocalNumberSet).toBe('Add device set')
    expect(en.myPage.addCloudNumberSet).toBe('Add cloud set')
    expect(en.myPage.autoSnapshotColumnLabel).toBe('Auto record')
    expect(en.myPage.numberSetInstrumentColumnLabel).toBe('Instrument')
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
    expect(ko.myPage.recentSnapshotsTitle).toBe('최근 계좌스냅샷')
    expect(ko.myPage.recentOrdersTitle).toBe('최근 주문')
    expect(ko.myPage.recordsArchiveLink).toBe('기록 장부 열기')
    expect(ko.myPage.recentSnapshotsEmpty).toContain('계좌스냅샷')

    expect(en.myPage.recordsSummaryTitle).toBe('Account records')
    expect(en.myPage.recentSnapshotsTitle).toBe('Recent account snapshots')
    expect(en.myPage.recentOrdersTitle).toBe('Recent orders')
    expect(en.myPage.recordsArchiveLink).toBe('Open records ledger')
    expect(en.myPage.recentSnapshotsEmpty).toContain('snapshot')
  })
})
