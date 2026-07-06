import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import { AccountRecordsPanel } from './AccountRecordsPanel'

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
})
