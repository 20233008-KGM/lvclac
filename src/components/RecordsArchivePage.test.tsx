import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { AccountRecordSummary, AccountSnapshotRecord, OrderHistoryRecord } from '../db/accountRecords'
import { en } from '../i18n/locales/en'
import { sampleInputs } from '../types'
import { RecordsArchiveView, toTimelineRecords } from './RecordsArchivePage'

const summary: AccountRecordSummary = {
  liquidationPrice: 232_927,
  toleranceRate: 16.8,
  toleranceDelta: 47_073,
  leverageRatio: 2.73,
  maintenanceMargin: 4_170_000,
  availableMargin: 29_047_200,
  isAtRisk: false,
}

function orderRecord(id: string, createdAt: string): OrderHistoryRecord {
  return {
    id,
    positionSide: 'long',
    orderContracts: 42,
    orderPrice: 280_000,
    beforeInputs: sampleInputs,
    afterInputs: sampleInputs,
    beforeResult: summary,
    afterResult: summary,
    createdAt,
  }
}

function snapshotRecord(id: string, createdAt: string, accountEval = 29_047_200): AccountSnapshotRecord {
  return {
    id,
    title: `Snapshot ${id}`,
    inputs: { ...sampleInputs, accountEval },
    result: summary,
    source: 'manual',
    sourceLocalDate: null,
    createdAt,
  }
}

function firstMatch(html: string, pattern: RegExp): string {
  return html.match(pattern)?.[0] ?? ''
}

describe('toTimelineRecords', () => {
  it('merges snapshots and orders by createdAt descending with snapshots first on ties', () => {
    const timeline = toTimelineRecords(
      [
        orderRecord('order-older', '2026-07-09T06:00:00.000Z'),
        orderRecord('order-tie', '2026-07-09T06:02:00.000Z'),
      ],
      [
        snapshotRecord('snapshot-newest', '2026-07-09T06:03:00.000Z'),
        snapshotRecord('snapshot-tie', '2026-07-09T06:02:00.000Z'),
      ],
    )

    expect(timeline.map((entry) => `${entry.type}:${entry.id}`)).toEqual([
      'snapshot:snapshot-newest',
      'snapshot:snapshot-tie',
      'order:order-tie',
      'order:order-older',
    ])
  })

  it('handles empty record groups without changing the available side', () => {
    expect(toTimelineRecords([], [snapshotRecord('snapshot-only', '2026-07-09T06:03:00.000Z')])).toEqual([
      {
        type: 'snapshot',
        id: 'snapshot-only',
        createdAt: '2026-07-09T06:03:00.000Z',
        record: snapshotRecord('snapshot-only', '2026-07-09T06:03:00.000Z'),
      },
    ])
  })
})

describe('RecordsArchiveView', () => {
  const baseProps = {
    copy: en.accountRecords,
    signedIn: true,
    loading: false,
    error: null,
    notice: null,
    orderRecords: [orderRecord('order-1', '2026-07-09T06:02:00.000Z')],
    snapshotRecords: [snapshotRecord('snapshot-1', '2026-07-09T06:03:00.000Z')],
    orderShownCount: 1,
    orderTotalCount: 1,
    snapshotShownCount: 1,
    snapshotTotalCount: 1,
    onRetry: vi.fn(),
    onDeleteOrder: vi.fn(),
    onDeleteSnapshot: vi.fn(),
    onBulkDeleteOrders: vi.fn(),
    onBulkDeleteSnapshots: vi.fn(),
    onLoadOlderRecords: vi.fn(),
    onOpenOrderDetail: vi.fn(),
    onOpenSnapshotDetail: vi.fn(),
  }

  it('renders one shared timeline instead of tabbed tables', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)

    expect(html).toContain('records-timeline-grid')
    expect(html).toContain('records-timeline-row--snapshot')
    expect(html).toContain('records-timeline-row--order')
    expect(html).not.toContain('account-record-tabs')
    expect(html).not.toContain('records-archive-table')
  })

  it('places snapshot records in the left lane and order records in the right lane', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)

    expect(html).toContain('records-timeline-cell--snapshots')
    expect(html).toContain('records-timeline-cell--orders')
    expect(html).toContain('records-timeline-row--snapshot')
    expect(html).toContain('records-timeline-row--order')
    expect(html).toContain('records-timeline-cell--empty')
  })

  it('keeps snapshot fields and order fields separated by card type', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const snapshotCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--snapshot"[\s\S]*?<\/article>/)
    const orderCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--order"[\s\S]*?<\/article>/)

    expect(snapshotCard).toContain('29,047,200')
    expect(snapshotCard).toContain('16.8%')
    expect(snapshotCard).toContain('2.73')
    expect(snapshotCard).not.toContain('280,000')

    expect(orderCard).toContain('long')
    expect(orderCard).toContain('42')
    expect(orderCard).toContain('280,000')
    expect(orderCard).not.toContain('29,047,200')
  })

  it('renders compact row cards without repeating category labels inside each row', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const snapshotCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--snapshot"[\s\S]*?<\/article>/)
    const orderCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--order"[\s\S]*?<\/article>/)

    expect(snapshotCard).toContain('records-timeline-fields')
    expect(orderCard).toContain('records-timeline-fields')
    expect(snapshotCard).not.toContain('records-timeline-kind')
    expect(orderCard).not.toContain('records-timeline-kind')
    expect(snapshotCard).not.toContain(`<h3>`)
    expect(orderCard).not.toContain(`<h3>`)
    expect(snapshotCard).not.toContain(en.accountRecords.snapshotsTab)
    expect(orderCard).not.toContain(en.accountRecords.orderHistoryTab)
  })

  it('moves repeated field labels into the shared timeline header', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const header = firstMatch(html, /<div class="records-timeline-head"[\s\S]*?<\/div><\/div>/)
    const snapshotCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--snapshot"[\s\S]*?<\/article>/)
    const orderCard = firstMatch(html, /<article class="records-timeline-card records-timeline-card--order"[\s\S]*?<\/article>/)

    expect(header).toContain(en.accountRecords.summaryAccountEquity)
    expect(header).toContain(en.accountRecords.summaryLiquidationBuffer)
    expect(header).toContain(en.accountRecords.summaryLeverage)
    expect(header).toContain(en.accountRecords.side)
    expect(header).toContain(en.accountRecords.archiveOrderContracts)
    expect(header).toContain(en.accountRecords.archiveOrderPrice)

    expect(snapshotCard).not.toContain(en.accountRecords.createdAt)
    expect(snapshotCard).not.toContain(en.accountRecords.summaryAccountEquity)
    expect(snapshotCard).not.toContain(en.accountRecords.summaryLiquidationBuffer)
    expect(snapshotCard).not.toContain(en.accountRecords.summaryLeverage)
    expect(orderCard).not.toContain(en.accountRecords.createdAt)
    expect(orderCard).not.toContain(en.accountRecords.side)
    expect(orderCard).not.toContain(en.accountRecords.archiveOrderContracts)
    expect(orderCard).not.toContain(en.accountRecords.archiveOrderPrice)
  })

  it('does not render a saved-time column label because the vertical axis already carries time', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const headerTime = firstMatch(html, /<span class="records-timeline-head-time"[\s\S]*?<\/span>/)

    expect(headerTime).not.toContain(en.accountRecords.createdAt)
    expect(html).toContain('<time class="records-timeline-time"')
  })

  it('reserves an action column in lane headers so row values align with detail and delete actions', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const actionSpacerCount = (html.match(/records-timeline-head-actions/g) ?? []).length

    expect(actionSpacerCount).toBe(2)
    expect(html).toContain('records-timeline-lane-head')
    expect(html).toContain('records-timeline-card-actions')
  })

  it('keeps destructive actions and a single older-records loader on the archive page', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)

    expect(html).toContain(en.accountRecords.bulkDeleteOrders)
    expect(html).toContain(en.accountRecords.bulkDeleteSnapshots)
    expect(html).toContain(en.accountRecords.loadOlderRecords)
  })

  it('turns each record card into an activatable button and drops the standalone detail button', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const buttonCards = html.match(/<article class="records-timeline-card[^"]*" role="button"/g) ?? []

    expect(buttonCards).toHaveLength(2)
    expect(html).toContain(`aria-label="${en.accountRecords.detail}"`)
    expect(html).not.toContain(`>${en.accountRecords.detail}</button>`)
  })

  it('renders a selection checkbox on every record card', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)
    const checkboxes = html.match(/type="checkbox"/g) ?? []

    expect(checkboxes).toHaveLength(2)
    expect(html).toContain(`aria-label="${en.accountRecords.selectRecord}"`)
  })

  it('hides the selection action bar when nothing is selected', () => {
    const html = renderToStaticMarkup(<RecordsArchiveView {...baseProps} />)

    expect(html).not.toContain('records-selection-bar')
    expect(html).not.toContain('records-timeline-card--selected')
  })

  it('shows the selection action bar and marks selected cards when keys are selected', () => {
    const html = renderToStaticMarkup(
      <RecordsArchiveView {...baseProps} selectedKeys={new Set(['snapshot:snapshot-1'])} />,
    )

    expect(html).toContain('records-selection-bar')
    expect(html).toContain('records-timeline-card--selected')
    expect(html).toContain(en.accountRecords.selectedCount.replace('{count}', '1'))
    expect(html).toContain(en.accountRecords.selectAllShown)
    expect(html).toContain(en.accountRecords.clearSelection)
    expect(html).toContain(en.accountRecords.deleteSelected)
  })
})
