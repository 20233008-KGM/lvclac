import type { AdVariant } from '../components/AdSlot'

export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || undefined

const SLOT_ENV_MAP: Record<string, string | undefined> = {
  'left-sidebar-top': import.meta.env.VITE_AD_SLOT_LEFT_SIDEBAR_TOP,
  'left-sidebar-bottom': import.meta.env.VITE_AD_SLOT_LEFT_SIDEBAR_BOTTOM,
  'top-banner': import.meta.env.VITE_AD_SLOT_TOP_BANNER,
  'bottom-banner': import.meta.env.VITE_AD_SLOT_BOTTOM_BANNER,
  'right-sidebar-top': import.meta.env.VITE_AD_SLOT_RIGHT_SIDEBAR_TOP,
  'right-sidebar-bottom': import.meta.env.VITE_AD_SLOT_RIGHT_SIDEBAR_BOTTOM,
}

/**
 * Post-launch optimization (2–4 weeks): check AdSense RPM per slot and GA4 bounce rate.
 * - Bounce rate spike or low sidebar-tall RPM → set VITE_AD_ENABLE_SIDEBAR_TALL=false (6→4 slots)
 * - Mobile RPM low → confirm top/bottom banners use responsive units (handled in AdSlot)
 */
export const SIDEBAR_TALL_ENABLED =
  import.meta.env.VITE_AD_ENABLE_SIDEBAR_TALL !== 'false'

export function getAdSlotUnitId(slotId: string): string | undefined {
  const unitId = SLOT_ENV_MAP[slotId]?.trim()
  return unitId || undefined
}

export function isAdSlotEnabled(_slotId: string, variant: AdVariant): boolean {
  if (variant === 'sidebar-tall' && !SIDEBAR_TALL_ENABLED) return false
  return true
}

export function isAdSenseConfigured(slotId: string): boolean {
  return Boolean(ADSENSE_CLIENT && getAdSlotUnitId(slotId))
}
