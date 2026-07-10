import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../i18n/locales/en'
import { MyPageView } from './MyPage'

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
    identityBusy: null as 'link' | 'unlink' | null,
    identityMessage: null,
    storageLoading: false,
    storageError: null,
    hasCloudInput: false,
    orderHistoryCount: 0,
    accountSnapshotCount: 0,
    supportHref: 'mailto:support@example.com',
    suggestionsHref: '/boards/suggestions',
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
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={null}
      />,
    )

    expect(html).toContain('my-page-shell')
    expect(html).toContain(en.myPage.loginTitle)
    expect(html).toContain(en.myPage.loginAction)
    expect(html).not.toContain(en.myPage.profileTitle)
    expect(html).not.toContain('my-page-console')
  })

  it('renders signed-in account hub sections with summarized storage status', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim' }}
        nicknameDraft="Trader Kim"
        nicknameMessage={en.myPage.nicknameSaved}
        hasCloudInput={true}
        orderHistoryCount={2}
        accountSnapshotCount={1}
      />,
    )

    expect(html).toContain('my-page-shell')
    expect(html).toContain('my-page-console')
    expect(html).toContain('my-page-account-email')
    expect(html).not.toContain('my-page-identity-card')
    expect(html).toContain(en.myPage.navAccount)
    expect(html).toContain('user@example.com')
    expect(html).toContain('Trader Kim')
    expect(html).toContain(en.myPage.cloudInputReady)
    expect(html).toContain('2 records')
    expect(html).toContain('1 records')
    expect(html).not.toContain('id="my-page-privacy"')
    expect(html).not.toContain(en.myPage.privacyTitle)
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
      <MyPageView
        {...baseProps}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim' }}
        linkedProviders={['email']}
      />,
    )

    expect(html).toContain('my-page-account-sections')
    expect(html).toContain('my-page-linked-group')
    expect(html).toContain(en.myPage.profileTitle)
    expect(html).toContain(en.myPage.linkedLoginTitle)
    expect(html).toContain(en.myPage.linkedLoginBody)
    expect(html).toContain(`>${en.myPage.linkGoogleAction}</button>`)
    expect(html).not.toContain(`>${en.myPage.unlinkGoogleAction}</button>`)
    expect(html).not.toContain(en.myPage.lastIdentityNote)
    // 이메일은 연동됨 상태 + '기본', Google은 미연동
    expect(html).toContain('my-page-linked-status is-linked')
    expect(html).toContain('my-page-linked-status is-unlinked')
    expect(html).toContain(`${en.myPage.providerLinked} · ${en.myPage.primaryTag}`)
  })

  it('shows an enabled unlink action when Google is linked alongside email', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim' }}
        linkedProviders={['email', 'google']}
      />,
    )

    expect(html).toContain(`>${en.myPage.unlinkGoogleAction}</button>`)
    expect(html).not.toContain(`>${en.myPage.linkGoogleAction}</button>`)
    expect(html).not.toContain(en.myPage.lastIdentityNote)
    // 이메일 수단이 남아 있으므로 해제 버튼은 활성화 상태
    expect(html).not.toContain('disabled=""')
  })

  it('disables unlink and warns when Google is the only login method', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim' }}
        linkedProviders={['google']}
      />,
    )

    expect(html).toContain(en.myPage.unlinkGoogleAction)
    expect(html).toContain(en.myPage.lastIdentityNote)
    expect(html).toContain('disabled=""')
    // Google-only 사용자는 이메일 수단이 미연동 → '기본' 칩 없음
    expect(html).toContain('my-page-linked-badge is-unlinked')
    expect(html).not.toContain(`my-page-linked-chip">${en.myPage.primaryTag}`)
  })

  it('uses compact storage rows instead of nested status cards', () => {
    const html = renderToStaticMarkup(
      <MyPageView
        {...baseProps}
        user={{
          id: 'user-1',
          email: 'very.long.email.address.for.layout.testing@example.com',
          nickname: 'Very Long Trader Name For Layout Testing'
        }}
        nicknameDraft="Very Long Trader Name For Layout Testing"
      />,
    )

    expect(html).toContain('my-page-storage-list')
    expect(html).toContain('my-page-storage-row')
    expect(html).not.toContain('my-page-status-grid')
    expect(html).not.toContain('my-page-status')
  })
})
