import { useEffect, useRef, type CSSProperties } from 'react'
import {
  ADSENSE_CLIENT,
  getAdSlotUnitId,
  isAdSenseConfigured,
  type AdVariant,
} from '../config/ads'
import { ensureAdSenseScript } from '../lib/adsense'

interface AdSlotProps {
  slotId: string
  variant?: AdVariant
  label?: string
}

const PLACEHOLDER_SIZES: Record<AdVariant, string> = {
  banner: '반응형',
  sidebar: '160 × 600',
  'sidebar-tall': '160 × 250',
}

function getSidebarStyle(variant: AdVariant): CSSProperties {
  if (variant === 'sidebar') {
    return { display: 'inline-block', width: '160px', height: '600px' }
  }
  return { display: 'inline-block', width: '160px', height: '250px' }
}

export function AdSlot({ slotId, variant = 'banner', label }: AdSlotProps) {
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)
  const adUnitId = getAdSlotUnitId(slotId)
  const isLive = isAdSenseConfigured(slotId)

  useEffect(() => {
    if (!isLive || !insRef.current || pushedRef.current) return

    let cancelled = false

    ensureAdSenseScript(ADSENSE_CLIENT!)
      .then(() => {
        if (cancelled || pushedRef.current) return
        pushedRef.current = true
        try {
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        } catch {
          pushedRef.current = false
        }
      })
      .catch(() => {
        pushedRef.current = false
      })

    return () => {
      cancelled = true
    }
  }, [isLive, slotId])

  if (!isLive) {
    return (
      <div
        className={`ad-slot ad-slot--${variant}`}
        data-ad-slot={slotId}
        aria-label={label ?? '광고 영역'}
      >
        <span className="ad-slot-label">{label ?? '광고'}</span>
        <span className="ad-slot-size">{PLACEHOLDER_SIZES[variant]}</span>
      </div>
    )
  }

  const isResponsive = variant === 'banner'

  return (
    <div
      className={`ad-slot ad-slot--${variant} ad-slot--live`}
      data-ad-slot={slotId}
      aria-label={label ?? '광고'}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={isResponsive ? { display: 'block' } : getSidebarStyle(variant)}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adUnitId}
        {...(isResponsive
          ? { 'data-ad-format': 'auto', 'data-full-width-responsive': 'true' }
          : {})}
      />
    </div>
  )
}
