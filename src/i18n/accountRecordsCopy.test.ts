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
})
