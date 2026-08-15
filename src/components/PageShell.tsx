import type { ReactNode } from 'react'
import { ADS_ENABLED, isAdSlotEnabled } from '../config/ads'
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
      <aside
        className="ad-column ad-column-left"
        aria-label={ADS_ENABLED ? t.ads.generic : undefined}
        aria-hidden={ADS_ENABLED ? undefined : 'true'}
      >
        <AdSlot
          slotId="left-sidebar-top"
          variant="sidebar"
          label={t.ads.leftTop}
          placeholderTitle={t.ads.placeholderTitle}
          placeholderDescription={t.ads.placeholderBody}
        />
        {isAdSlotEnabled('left-sidebar-bottom', 'sidebar-tall') && (
          <AdSlot
            slotId="left-sidebar-bottom"
            variant="sidebar-tall"
            label={t.ads.leftBottom}
            placeholderTitle={t.ads.placeholderTitle}
            placeholderDescription={t.ads.placeholderBody}
          />
        )}
      </aside>

      <div className="page-main">
        <div className="page-content">
          <ServiceDisclaimer />
          {children}
          {ADS_ENABLED && (
            <div className="page-ads">
              <AdSlot
                slotId="top-banner"
                variant="banner"
                label={t.ads.top}
                placeholderTitle={t.ads.placeholderTitle}
                placeholderDescription={t.ads.placeholderBody}
              />
              <AdSlot
                slotId="bottom-banner"
                variant="banner"
                label={t.ads.bottom}
                placeholderTitle={t.ads.placeholderTitle}
                placeholderDescription={t.ads.placeholderBody}
              />
            </div>
          )}
        </div>
      </div>

      <aside
        className="ad-column ad-column-right"
        aria-label={ADS_ENABLED ? t.ads.generic : undefined}
        aria-hidden={ADS_ENABLED ? undefined : 'true'}
      >
        <AdSlot
          slotId="right-sidebar-top"
          variant="sidebar"
          label={t.ads.rightTop}
          placeholderTitle={t.ads.placeholderTitle}
          placeholderDescription={t.ads.placeholderBody}
        />
        {isAdSlotEnabled('right-sidebar-bottom', 'sidebar-tall') && (
          <AdSlot
            slotId="right-sidebar-bottom"
            variant="sidebar-tall"
            label={t.ads.rightBottom}
            placeholderTitle={t.ads.placeholderTitle}
            placeholderDescription={t.ads.placeholderBody}
          />
        )}
      </aside>
    </div>
  )
}
