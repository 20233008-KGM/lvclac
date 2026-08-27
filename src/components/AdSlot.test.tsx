import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GoogleConsentContext } from '../context/googleConsentState'
import { AdSlot } from './AdSlot'
import pageShellSource from './PageShell.tsx?raw'

const consent = {
  ready: true,
  regulated: false,
  adRequestsAllowed: false,
  adStorageAllowed: false,
  adUserDataAllowed: false,
  personalizedAdsAllowed: false,
  analyticsAllowed: false,
  configured: false,
  openPrivacySettings: () => undefined,
}

describe('AdSlot', () => {
  it('renders no placeholder or ad surface while advertising is paused', () => {
    const html = renderToStaticMarkup(
      <GoogleConsentContext.Provider value={consent}>
        <AdSlot
          slotId="left-sidebar-top"
          variant="sidebar"
          label="좌측 상단 광고"
          placeholderTitle="광고 준비 중"
          placeholderDescription="LiqGuard의 지속적인 무료 운영을 위한 공간입니다."
        />
      </GoogleConsentContext.Provider>,
    )

    expect(html).toBe('')
  })

  it('does not render empty advertising wrapper DOM in the page shell', () => {
    expect(pageShellSource).toContain('{ADS_ENABLED && <aside')
    expect(pageShellSource).toContain('{ADS_ENABLED && <div className="page-ads">')
  })
})
