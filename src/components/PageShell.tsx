import type { ReactNode } from 'react'
import { isAdSlotEnabled } from '../config/ads'
import { useLanguage } from '../i18n'
import { AdSlot } from './AdSlot'
import { ServiceDisclaimer } from './ServiceDisclaimer'

interface PageShellProps {
  children: ReactNode
}

export function PageShell({ children }: PageShellProps) {
  const { t } = useLanguage()

  return (
    <div className="page-shell">
      <aside className="ad-column ad-column-left" aria-label={t.ads.generic}>
        <AdSlot slotId="left-sidebar-top" variant="sidebar" label={t.ads.leftTop} />
        {isAdSlotEnabled('left-sidebar-bottom', 'sidebar-tall') && (
          <AdSlot slotId="left-sidebar-bottom" variant="sidebar-tall" label={t.ads.leftBottom} />
        )}
      </aside>

      <div className="page-main">
        <div className="page-content">
          <ServiceDisclaimer />
          {children}
          <div className="page-ads">
            <AdSlot slotId="top-banner" variant="banner" label={t.ads.top} />
            <AdSlot slotId="bottom-banner" variant="banner" label={t.ads.bottom} />
          </div>
        </div>
      </div>

      <aside className="ad-column ad-column-right" aria-label={t.ads.generic}>
        <AdSlot slotId="right-sidebar-top" variant="sidebar" label={t.ads.rightTop} />
        {isAdSlotEnabled('right-sidebar-bottom', 'sidebar-tall') && (
          <AdSlot slotId="right-sidebar-bottom" variant="sidebar-tall" label={t.ads.rightBottom} />
        )}
      </aside>
    </div>
  )
}
