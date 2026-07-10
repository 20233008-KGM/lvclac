import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import { sampleInputs } from '../types'
import type { AccountRecordSummary, OrderHistoryRecord } from '../db/accountRecords'
import { AccountRecordsPanel } from './AccountRecordsPanel'

const summary: AccountRecordSummary = {
  liquidationPrice: 100,
  toleranceRate: 0.1,
  toleranceDelta: 1,
  leverageRatio: 2,
  maintenanceMargin: 1000,
  availableMargin: 2000,
  isAtRisk: false,
}

const orderRecord: OrderHistoryRecord = {
  id: 'order-1',
  positionSide: 'long',
  orderContracts: 1,
  orderPrice: 340,
  beforeInputs: sampleInputs,
  afterInputs: sampleInputs,
  beforeResult: summary,
  afterResult: summary,
  createdAt: '2026-07-07T00:00:00.000Z',
}

const snapshotRecord = {
  id: 'snap-1',
  title: 'Account snapshot',
  inputs: sampleInputs,
  result: summary,
  createdAt: '2026-07-07T00:00:00.000Z',
}

describe('AccountRecordsPanel', () => {
  const baseProps = {
    copy: en.accountRecords,
    signedIn: true,
    activeTab: 'orders' as const,
    onTabChange: vi.fn(),
    loading: false,
    error: null,
    notice: null,
    orderRecords: [],
    snapshotRecords: [],
    onRetry: vi.fn(),
    onSaveSnapshot: vi.fn(),
    onDeleteOrder: vi.fn(),
    onDeleteSnapshot: vi.fn(),
  }

  it('renders signed-out login-required state', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} signedIn={false} />,
    )
    expect(html).toContain(en.accountRecords.loginRequired)
  })

  it('renders empty order history state', () => {
    const html = renderToStaticMarkup(<AccountRecordsPanel {...baseProps} />)
    expect(html).toContain(en.accountRecords.orderHistoryEmpty)
  })

  it('renders snapshot save button on snapshots tab', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} activeTab="snapshots" />,
    )
    expect(html).toContain(en.accountRecords.saveSnapshot)
    expect(html).toContain(en.accountRecords.snapshotsEmpty)
  })

  it('omits the save-snapshot button entirely when onSaveSnapshot is not provided', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} activeTab="snapshots" onSaveSnapshot={undefined} />,
    )
    expect(html).not.toContain(en.accountRecords.saveSnapshot)
    expect(html).not.toContain('account-record-save')
  })

  it('hides the bulk-delete button when the order list is empty even if the handler is provided', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} orderRecords={[]} onBulkDeleteOrders={vi.fn()} />,
    )
    expect(html).not.toContain('account-record-list-toolbar')
    expect(html).not.toContain(en.accountRecords.bulkDeleteOrders)
  })

  it('shows a wired bulk-delete button when the order list is non-empty', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onBulkDeleteOrders={vi.fn()}
      />,
    )
    expect(html).toContain('account-record-list-toolbar')
    expect(html).toContain(en.accountRecords.bulkDeleteOrders)
  })

  it('disables the bulk-delete button and swaps its label while busy', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onBulkDeleteOrders={vi.fn()}
        orderBulkBusy={true}
      />,
    )
    expect(html).toContain(en.accountRecords.bulkDeleteBusy)
    expect(html).not.toContain(en.accountRecords.bulkDeleteOrders)
    expect(html).toContain('disabled=""')
  })

  it('shows a wired bulk-delete button for snapshots when the snapshot list is non-empty', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        activeTab="snapshots"
        snapshotRecords={[snapshotRecord]}
        onBulkDeleteSnapshots={vi.fn()}
      />,
    )
    expect(html).toContain(en.accountRecords.bulkDeleteSnapshots)
  })

  it('renders with the my-page-records anchor id for side-nav targeting', () => {
    const html = renderToStaticMarkup(<AccountRecordsPanel {...baseProps} />)
    expect(html).toContain('id="my-page-records"')
  })

  it('omits the load-more button when onLoadMoreOrders is not provided', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} orderRecords={[orderRecord]} />,
    )
    expect(html).not.toContain('account-record-load-more')
  })

  it('shows the load-more button and swaps its label while busy', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onLoadMoreOrders={vi.fn()}
        orderLoadingMore={true}
      />,
    )
    expect(html).toContain('account-record-load-more')
    expect(html).toContain(en.accountRecords.loadingMore)
    expect(html).not.toContain(`>${en.accountRecords.loadMore}<`)
  })

  it('shows the load-more button with the idle label when not busy', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onLoadMoreOrders={vi.fn()}
      />,
    )
    expect(html).toContain(`>${en.accountRecords.loadMore}<`)
  })

  it('renders the interpolated shown/total count when orderTotalCount is provided', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        orderShownCount={1}
        orderTotalCount={5}
      />,
    )
    const expected = en.accountRecords.shownCount.replace('{shown}', '1').replace('{total}', '5')
    expect(html).toContain(expected)
  })

  it('renders no shown/total text when orderTotalCount is null', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onBulkDeleteOrders={vi.fn()}
        orderTotalCount={null}
      />,
    )
    expect(html).toContain('account-record-count')
    expect(html).not.toContain('Showing')
  })

  it('disables the individual delete button while a load-more request is in flight, to avoid the offset race', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onLoadMoreOrders={vi.fn()}
        orderLoadingMore={true}
      />,
    )
    expect(html).toMatch(/class="link-btn account-record-delete" disabled=""/)
  })

  it('leaves the individual delete button enabled when no load-more is in flight', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} orderRecords={[orderRecord]} />,
    )
    expect(html).not.toMatch(/class="link-btn account-record-delete" disabled=""/)
  })

  it('also disables the bulk-delete button while a load-more request is in flight', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onBulkDeleteOrders={vi.fn()}
        onLoadMoreOrders={vi.fn()}
        orderLoadingMore={true}
      />,
    )
    expect(html).toMatch(/class="link-btn link-btn--danger" disabled=""/)
  })

  it('disables the snapshot individual delete button while snapshotLoadingMore is true', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        activeTab="snapshots"
        snapshotRecords={[snapshotRecord]}
        onLoadMoreSnapshots={vi.fn()}
        snapshotLoadingMore={true}
      />,
    )
    expect(html).toMatch(/class="link-btn account-record-delete" disabled=""/)
  })

  it('disables the load-more button while an individual delete is in flight (reverse-direction race guard)', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onLoadMoreOrders={vi.fn()}
        orderDeleteBusy={true}
      />,
    )
    expect(html).toMatch(/class="link-btn account-record-load-more" disabled=""/)
  })

  it('disables the load-more button while a bulk-delete is in flight', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        orderRecords={[orderRecord]}
        onLoadMoreOrders={vi.fn()}
        orderBulkBusy={true}
      />,
    )
    expect(html).toMatch(/class="link-btn account-record-load-more" disabled=""/)
  })

  it('disables the snapshot load-more button while a snapshot delete is in flight', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        activeTab="snapshots"
        snapshotRecords={[snapshotRecord]}
        onLoadMoreSnapshots={vi.fn()}
        snapshotDeleteBusy={true}
      />,
    )
    expect(html).toMatch(/class="link-btn account-record-load-more" disabled=""/)
  })

  it('leaves the load-more button enabled when nothing else is busy', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} orderRecords={[orderRecord]} onLoadMoreOrders={vi.fn()} />,
    )
    expect(html).not.toMatch(/class="link-btn account-record-load-more" disabled=""/)
  })

  it('renders ordersToolbar only on the orders tab', () => {
    const marker = 'orders-toolbar-marker'
    const ordersHtml = renderToStaticMarkup(
      <AccountRecordsPanel {...baseProps} ordersToolbar={<span>{marker}</span>} />,
    )
    const snapshotsHtml = renderToStaticMarkup(
      <AccountRecordsPanel
        {...baseProps}
        activeTab="snapshots"
        ordersToolbar={<span>{marker}</span>}
      />,
    )
    expect(ordersHtml).toContain(marker)
    expect(snapshotsHtml).not.toContain(marker)
  })
})
