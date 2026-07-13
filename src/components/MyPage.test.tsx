import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type {
  AccountRecordSummary,
  AccountSnapshotRecord,
  OrderHistoryRecord,
} from '../db/accountRecords'
import type { AuthUser } from '../db/profile'
import { en } from '../i18n/locales/en'
import { sampleInputs } from '../types'
import { AccountRecordsSummaryPanel, MyPageView } from './MyPage'

const summary: AccountRecordSummary = {
  liquidationPrice: 232_927,
  toleranceRate: 17.03,
  toleranceDelta: 47_073,
  leverageRatio: 2.66,
  maintenanceMargin: 4_170_000,
  availableMargin: 29_047_200,
  isAtRisk: false,
}

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1
}

function authUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    nickname: 'Trader Kim',
    autoSaveOrderHistory: true,
    isAdmin: false,
    ...overrides,
  }
}

function snapshotRecord(): AccountSnapshotRecord {
  return {
    id: 'snapshot-1',
    title: 'Latest snapshot',
    inputs: { ...sampleInputs, accountEval: 48_537_669 },
    result: {
      ...summary,
      toleranceRate: 20.03,
      leverageRatio: 2.42,
    },
    source: 'manual',
    sourceLocalDate: null,
    createdAt: '2026-07-10T02:01:00.000Z',
  }
}

function orderRecord(id: string, orderPrice: number): OrderHistoryRecord {
  return {
    id,
    positionSide: 'long',
    orderContracts: 42,
    orderPrice,
    beforeInputs: sampleInputs,
    afterInputs: sampleInputs,
    beforeResult: summary,
    afterResult: summary,
    createdAt: '2026-07-09T06:01:00.000Z',
  }
}

describe('MyPageView', () => {
  const baseProps = {
    copy: en.myPage,
    authLoading: false,
    configured: true,
    isPro: false,
    nicknameDraft: '',
    nicknameBusy: false,
    nicknameMessage: null,
    linkedProviders: [] as string[],
    identityBusy: null as 'link' | 'unlink' | 'setPassword' | null,
    identityMessage: null,
    passwordFormOpen: false,
    passwordDraft: '',
    passwordConfirmationDraft: '',
    supportHref: 'mailto:support@example.com',
    recordsSummaryPanel: (
      <section id="my-page-records-summary">
        <h2>{en.myPage.recordsSummaryTitle}</h2>
        <a href="/records">{en.myPage.recordsArchiveLink}</a>
      </section>
    ),
    preferencesPanel: (
      <section id="my-page-preferences">
        <h2>{en.myPage.preferencesTitle}</h2>
        <p>{en.myPage.autoSnapshotTitle}</p>
      </section>
    ),
    onNicknameChange: vi.fn(),
    onNicknameSubmit: vi.fn(),
    onLinkGoogle: vi.fn(),
    onUnlinkGoogle: vi.fn(),
    onPasswordFormToggle: vi.fn(),
    onPasswordDraftChange: vi.fn(),
    onPasswordConfirmationDraftChange: vi.fn(),
    onSetPasswordSubmit: vi.fn(),
    onLoginClick: vi.fn(),
    onSignOut: vi.fn(),
  }

  it('renders a signed-out login prompt without exposing account sections', () => {
    const html = renderToStaticMarkup(<MyPageView {...baseProps} user={null} />)

    expect(html).toContain('my-page-shell')
    expect(html).toContain(en.myPage.loginTitle)
    expect(html).toContain(en.myPage.loginAction)
    expect(html).not.toContain(en.myPage.profileTitle)
    expect(html).not.toContain('my-page-console')
  })

  it('renders signed-in account hub sections with the records summary entry', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={authUser()}
        nicknameDraft="Trader Kim"
        nicknameMessage={en.myPage.nicknameSaved}
      />,
    )

    expect(html).toContain('my-page-shell')
    expect(html).toContain('my-page-console')
    expect(html).toContain('class="my-page-panel my-page-account-hub"')
    expect(html).toContain('my-page-account-hub__identity')
    expect(html).toContain('my-page-avatar')
    expect(html).toContain('my-page-badge')
    expect(html).not.toContain('my-page-identity-card')
    expect(html).not.toContain('my-page-account-email')
    expect(html).toContain(en.myPage.navAccount)
    expect(occurrences(html, '>user@example.com<')).toBe(1)
    expect(html).toContain('Trader Kim')
    expect(html).toContain('my-page-account-hub__block')
    expect(html).toContain(en.myPage.recordsSummaryTitle)
    expect(html).toContain(en.myPage.recordsArchiveLink)
    expect(html).toContain('href="/records"')
    expect(html).toContain('id="my-page-preferences"')
    expect(html).toContain(en.myPage.autoSnapshotTitle)
    expect(html).toContain(en.myPage.deleteAccountTitle)
    expect(html).toContain('mailto:support@example.com')
  })

  it('renders auth configuration warning when Supabase is not configured', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        configured={false}
        user={null}
      />,
    )

    expect(html).toContain(en.myPage.configuredWarning)
  })

  it('offers a Google link action when only email is linked', () => {
    const html = renderToStaticMarkup(
      <MyPageView {...baseProps} user={authUser()} linkedProviders={['email']} />,
    )

    expect(html).toContain('my-page-account-hub__logins')
    expect(html).toContain('my-page-linked-list')
    expect(html).toContain(en.myPage.navAccount)
    expect(html).toContain(en.myPage.linkedLoginTitle)
    expect(html).toContain(`>${en.myPage.linkGoogleAction}</button>`)
    expect(html).not.toContain(`>${en.myPage.unlinkGoogleAction}</button>`)
    expect(html).not.toContain(en.myPage.lastIdentityNote)
    expect(html).toContain('my-page-linked-status is-linked')
    expect(html).toContain('my-page-linked-status is-unlinked')
    expect(html).toContain(`${en.myPage.providerLinked} · ${en.myPage.primaryTag}`)
  })

  it('shows an enabled unlink action when Google is linked alongside email', () => {
    const html = renderToStaticMarkup(
      <MyPageView {...baseProps} user={authUser()} linkedProviders={['email', 'google']} />,
    )

    expect(html).toContain(`>${en.myPage.unlinkGoogleAction}</button>`)
    expect(html).not.toContain(`>${en.myPage.linkGoogleAction}</button>`)
    expect(html).not.toContain(en.myPage.lastIdentityNote)
    expect(html).not.toContain('disabled=""')
  })

  it('disables unlink and warns when Google is the only login method', () => {
    const html = renderToStaticMarkup(
      <MyPageView {...baseProps} user={authUser()} linkedProviders={['google']} />,
    )

    expect(html).toContain(en.myPage.unlinkGoogleAction)
    expect(html).toContain(en.myPage.lastIdentityNote)
    expect(html).toContain('disabled=""')
    expect(html).toContain('my-page-linked-status is-unlinked')
    expect(html).not.toContain(`${en.myPage.providerLinked} 쨌 ${en.myPage.primaryTag}`)
  })
})

describe('AccountRecordsSummaryPanel', () => {
  it('shows ledger-style snapshot and order summary tables with the records ledger link', () => {
    const html = renderToStaticMarkup(
      <AccountRecordsSummaryPanel
        copy={en.myPage}
        recordsCopy={en.accountRecords}
        loading={false}
        error={null}
        latestSnapshot={snapshotRecord()}
        recentOrders={[
          orderRecord('order-1', 280_000),
          orderRecord('order-2', 279_500),
          orderRecord('order-3', 279_000),
          orderRecord('order-4', 272_000),
          orderRecord('order-5', 295_500),
          orderRecord('order-6', 276_000),
        ]}
        archiveHref="/records"
        onRetry={vi.fn()}
      />,
    )

    expect(html).toContain('records-summary-table records-summary-table--snapshot')
    expect(occurrences(html, en.accountRecords.summaryAccountEquity)).toBe(1)
    expect(occurrences(html, en.accountRecords.summaryLiquidationBuffer)).toBe(1)
    expect(occurrences(html, en.accountRecords.summaryLeverage)).toBe(1)
    expect(html).toContain('48,537,669')
    expect(html).toContain('20.03%')
    expect(html).toContain('2.42')
    expect(html).toContain(en.myPage.recordsArchiveLink)
    expect(html).toContain('<a class="records-summary-link" href="/records">')
    expect(html).toContain('href="/records"')
    expect(html).toContain('records-summary-table records-summary-table--orders')
    expect(html).toContain(en.accountRecords.createdAt)
    expect(html).toContain(en.accountRecords.side)
    expect(occurrences(html, en.accountRecords.archiveOrderContracts)).toBe(1)
    expect(occurrences(html, en.accountRecords.archiveOrderPrice)).toBe(1)
    expect(html).not.toContain(`${en.accountRecords.archiveOrderContracts} <strong>`)
    expect(html).not.toContain(`${en.accountRecords.archiveOrderPrice} <strong>`)
    expect(html).toContain('295,500')
    expect(html).not.toContain('276,000')
  })
})
