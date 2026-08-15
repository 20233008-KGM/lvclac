import { useEffect, useRef, type CSSProperties } from 'react'
import {
  ADS_ENABLED,
  ADSENSE_CLIENT,
  getAdSlotUnitId,
  isAdSenseConfigured,
  type AdVariant,
} from '../config/ads'
import { useGoogleConsent } from '../context/googleConsentState'
import { ensureAdSenseScript } from '../lib/adsense'

interface AdSlotProps {
  slotId: string
  variant?: AdVariant
  label?: string
  placeholderTitle?: string
  placeholderDescription?: string
}

function getSidebarStyle(variant: AdVariant): CSSProperties {
  if (variant === 'sidebar') {
    return { display: 'inline-block', width: '160px', height: '600px' }
  }
  return { display: 'inline-block', width: '160px', height: '250px' }
}

export function AdSlot({
  slotId,
  variant = 'banner',
  label,
  placeholderTitle = '광고 준비 중',
  placeholderDescription = 'LiqGuard의 지속적인 무료 운영을 위한 공간입니다.',
}: AdSlotProps) {
  const { adRequestsAllowed } = useGoogleConsent()
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)
  const adUnitId = getAdSlotUnitId(slotId)
  const isLive = isAdSenseConfigured(slotId) && adRequestsAllowed

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

  if (!ADS_ENABLED) return null

  if (!isLive) {
    return (
      <div
        className={`ad-slot ad-slot--${variant}`}
        data-ad-slot={slotId}
        aria-label={placeholderTitle}
      >
        <span className="ad-slot-label">{placeholderTitle}</span>
        <span className="ad-slot-size">{placeholderDescription}</span>
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
