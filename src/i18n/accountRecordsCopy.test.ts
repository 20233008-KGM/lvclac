import { describe, expect, it } from 'vitest'
import { en } from './locales/en'
import { ko } from './locales/ko'

describe('account records copy', () => {
  it('provides Korean copy for account records without broker-order wording', () => {
    expect(ko.accountRecords.title).toBe('기록')
    expect(ko.accountRecords.orderHistoryTab).toBe('주문기록')
    expect(ko.accountRecords.snapshotsTab).toBe('계좌스냅샷')
    expect(ko.accountRecords.saveSnapshot).toBe('스냅샷 저장')
    expect(ko.accountRecords.orderHistoryEmpty).toContain('주문 시뮬레이션')
    expect(ko.accountRecords.orderHistoryEmpty).not.toContain('체결 주문')
  })

  it('provides English copy for account records without broker-order wording', () => {
    expect(en.accountRecords.title).toBe('Records')
    expect(en.accountRecords.orderHistoryTab).toBe('Order history')
    expect(en.accountRecords.snapshotsTab).toBe('Account snapshots')
    expect(en.accountRecords.saveSnapshot).toBe('Save snapshot')
    expect(en.accountRecords.orderHistoryEmpty).toContain('order simulation')
    expect(en.accountRecords.orderHistoryEmpty).not.toContain('executed order')
  })

  it('provides copy for the snapshot-saved confirm modal in both languages', () => {
    expect(ko.accountRecords.savedModalTitle).toBe('저장 완료')
    expect(ko.accountRecords.savedModalGoToRecords).toBe('스냅샷 기록으로 가기')
    expect(en.accountRecords.savedModalTitle).toBe('Saved')
    expect(en.accountRecords.savedModalGoToRecords).toBe('View saved records')
  })

  it('provides bulk-delete copy for both record types in both languages', () => {
    expect(ko.accountRecords.bulkDeleteOrders).toBe('주문 기록 전체 삭제')
    expect(ko.accountRecords.bulkDeleteSnapshots).toBe('스냅샷 전체 삭제')
    expect(ko.accountRecords.bulkDeleteBusy).toBe('삭제 중…')
    expect(en.accountRecords.bulkDeleteOrders).toBe('Delete all order history')
    expect(en.accountRecords.bulkDeleteSnapshots).toBe('Delete all snapshots')
    expect(en.accountRecords.bulkDeleteBusy).toBe('Deleting…')
  })

  it('provides load-more and counted bulk-delete copy for both languages', () => {
    expect(ko.accountRecords.loadMore).toBe('더 보기')
    expect(ko.accountRecords.loadOlderRecords).toBe('오래된 기록 더 보기')
    expect(ko.accountRecords.loadingMore).toBe('불러오는 중…')
    expect(ko.accountRecords.timelineEmpty).toBe('표시할 기록이 아직 없습니다.')
    expect(ko.accountRecords.shownCount).toContain('{shown}')
    expect(ko.accountRecords.shownCount).toContain('{total}')
    expect(ko.accountRecords.bulkDeleteConfirmOrdersWithCount).toContain('{count}')
    expect(ko.accountRecords.bulkDeleteConfirmSnapshotsWithCount).toContain('{count}')

    expect(en.accountRecords.loadMore).toBe('Load more')
    expect(en.accountRecords.loadOlderRecords).toBe('Load older records')
    expect(en.accountRecords.loadingMore).toBe('Loading more…')
    expect(en.accountRecords.timelineEmpty).toBe('No records yet.')
    expect(en.accountRecords.shownCount).toContain('{shown}')
    expect(en.accountRecords.shownCount).toContain('{total}')
    expect(en.accountRecords.bulkDeleteConfirmOrdersWithCount).toContain('{count}')
    expect(en.accountRecords.bulkDeleteConfirmSnapshotsWithCount).toContain('{count}')
  })

  it('provides snapshot Pro-gate copy for both languages', () => {
    expect(ko.accountRecords.snapshotGateTitle).toBe('Pro 전용 기능이에요')
    expect(ko.accountRecords.snapshotGateGuestBody).toContain('로그인')
    expect(ko.accountRecords.snapshotGateGuestBody).toContain('Pro')
    expect(ko.accountRecords.snapshotGateFreeBody).toContain('Pro')
    expect(ko.accountRecords.snapshotGateLoginCta).toBe('로그인')
    expect(ko.accountRecords.snapshotGateViewPlansCta).toBe('Pro 요금제 보기')
    expect(ko.accountRecords.snapshotGateUpgradeCta).toBe('Pro 업그레이드')

    expect(en.accountRecords.snapshotGateTitle).toBe('A Pro feature')
    expect(en.accountRecords.snapshotGateGuestBody).toContain('Log in')
    expect(en.accountRecords.snapshotGateGuestBody).toContain('Pro')
    expect(en.accountRecords.snapshotGateFreeBody).toContain('Pro')
    expect(en.accountRecords.snapshotGateLoginCta).toBe('Log in')
    expect(en.accountRecords.snapshotGateViewPlansCta).toBe('See Pro plans')
    expect(en.accountRecords.snapshotGateUpgradeCta).toBe('Upgrade to Pro')
  })

  it('provides compact archive and snapshot metric copy for both languages', () => {
    expect(ko.accountRecords.recordsArchiveTitle).toBe('기록 장부')
    expect(ko.accountRecords.summaryAccountEquity).toBe('계좌평가금')
    expect(ko.accountRecords.summaryLiquidationBuffer).toBe('청산버퍼')
    expect(ko.accountRecords.archiveOrderContracts).toBe('주문계약수')
    expect(ko.accountRecords.archiveOrderPrice).toBe('주문가격')
    expect(ko.accountRecords.detail).toBe('상세')

    expect(en.accountRecords.recordsArchiveTitle).toBe('Records ledger')
    expect(en.accountRecords.summaryAccountEquity).toBe('Account equity')
    expect(en.accountRecords.summaryLiquidationBuffer).toBe('Liquidation buffer')
    expect(en.accountRecords.archiveOrderContracts).toBe('Order contracts')
    expect(en.accountRecords.archiveOrderPrice).toBe('Order price')
    expect(en.accountRecords.detail).toBe('Details')
  })
})
