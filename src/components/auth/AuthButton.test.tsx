import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../../i18n/locales/en'
import { BILLING_PATH, MY_PAGE_PATH } from '../../config/routes'
import { AccountMenu } from './AuthButton'
import { onAccountMenuNavigate } from './accountMenuNavigation'

describe('AccountMenu', () => {
  it('links signed-in users to my page before logout', () => {
    const html = renderToStaticMarkup(
      <AccountMenu
        copy={{ myPage: en.myPage.title, billing: en.myPage.billing.page.pageTitle, logout: en.logout }}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim', autoSaveOrderHistory: true, isAdmin: false }}
        onSignOut={vi.fn()}
        onClose={vi.fn()}
        onMyPageClick={vi.fn()}
      />,
    )

    expect(html).toContain(`href="${MY_PAGE_PATH}"`)
    expect(html).toContain(en.myPage.title)
    expect(html).toContain(en.logout)
  })

  it('links signed-in users to the billing page', () => {
    const html = renderToStaticMarkup(
      <AccountMenu
        copy={{ myPage: en.myPage.title, billing: en.myPage.billing.page.pageTitle, logout: en.logout }}
        user={{ id: 'user-1', email: 'user@example.com', nickname: 'Trader Kim', autoSaveOrderHistory: true, isAdmin: false }}
        onSignOut={vi.fn()}
        onClose={vi.fn()}
        onMyPageClick={vi.fn()}
      />,
    )

    expect(html).toContain(`href="${BILLING_PATH}"`)
    expect(html).toContain(en.myPage.billing.page.pageTitle)
  })

  it('uses SPA navigation for an ordinary click', () => {
    const preventDefault = vi.fn()
    const navigate = vi.fn()
    onAccountMenuNavigate({
      button: 0,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault,
    }, navigate)

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledOnce()
  })

  it('preserves modified clicks for new-tab browser behavior', () => {
    const preventDefault = vi.fn()
    const navigate = vi.fn()
    onAccountMenuNavigate({
      button: 0,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      preventDefault,
    }, navigate)

    expect(preventDefault).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
