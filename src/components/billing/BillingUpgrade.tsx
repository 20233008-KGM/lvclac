import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Messages } from '../../i18n/types'
import type { BillingPlan } from '../../db/billing'

type BillingCopy = Messages['myPage']['billing']
type BusyState = BillingPlan | 'portal' | null

/** 세로 스크롤 스냅 히어로에 쓰는 청구 주기. 기본은 연간. */
type Cycle = 'monthly' | 'yearly'

/** 계정 기록 미리보기(섹션2)에 쓰는 고정 샘플 데이터 — 마케팅용, 실제 사용자 데이터 아님. */
const SAMPLE_SNAPSHOT = ['12,480', '18.4%', '5.0x'] as const
const SAMPLE_ORDERS = [
  { time: '07.14 09:12', side: 'long', contracts: '3', price: '62,140' },
  { time: '07.13 21:40', side: 'short', contracts: '1.5', price: '61,020' },
  { time: '07.12 14:05', side: 'long', contracts: '2', price: '60,880' },
] as const

function CheckIcon() {
  return (
    <svg
      className="billing-up__check"
      viewBox="0 0 24 24"
      width="17"
      height="17"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12.5l5 5 11-11" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      className="billing-up__hint-chevron"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/**
 * 업그레이드(free) 화면 — 세로 스크롤 스냅 4개 풀스크린 섹션.
 * (1) 히어로 + Pro 가격 카드 + 월간/연간 토글 (2) Before/After + 계정 기록 미리보기
 * (3) Free vs Pro 비교표 + FAQ (4) 최종 결제 CTA.
 * 결제 로직은 BillingPage에서 내려받은 onCheckout(=startCheckout)에 연결한다.
 */
export function BillingUpgrade({
  copy,
  busy,
  message,
  onCheckout,
}: {
  copy: BillingCopy
  busy: BusyState
  message?: string | null
  onCheckout: (plan: BillingPlan) => void
}) {
  const page = copy.page
  const up = page.upgrade

  const [cycle, setCycle] = useState<Cycle>('yearly')
  const [activeIdx, setActiveIdx] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const lockedRef = useRef(false)
  const goRef = useRef<((i: number) => void) | null>(null)

  // 시스템이 모션 축소를 요청하면 부드러운 스크롤/애니메이션을 끈다.
  const reduceMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // 마우스 휠을 가로채 한 번에 한 섹션씩 이동. 긴 섹션은 내부 스크롤 후 경계에서 스냅.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const behavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
    const sections = () => Array.from(el.querySelectorAll<HTMLElement>('[data-snap]'))

    const setIdx = (i: number) => {
      idxRef.current = i
      setActiveIdx(i)
    }
    const go = (i: number) => {
      const list = sections()
      const clamped = Math.max(0, Math.min(list.length - 1, i))
      setIdx(clamped)
      const target = list[clamped]
      if (target) el.scrollTo({ top: target.offsetTop, behavior })
    }
    goRef.current = go

    const onScroll = () => {
      const list = sections()
      const mid = el.scrollTop + el.clientHeight / 2
      for (let i = 0; i < list.length; i++) {
        if (list[i].offsetTop <= mid && (i === list.length - 1 || list[i + 1].offsetTop > mid)) {
          if (idxRef.current !== i) setIdx(i)
          break
        }
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return
      const list = sections()
      const cur = list[idxRef.current]
      const down = e.deltaY > 0
      if (cur) {
        // 현재 섹션이 뷰포트보다 길면 경계에 닿기 전까지 네이티브 스크롤을 허용한다.
        const top = cur.offsetTop
        const bottom = top + cur.offsetHeight
        if (down && bottom - (el.scrollTop + el.clientHeight) > 4) return
        if (!down && el.scrollTop - top > 4) return
      }
      e.preventDefault()
      if (lockedRef.current) return
      lockedRef.current = true
      window.setTimeout(() => {
        lockedRef.current = false
      }, 750)
      go(idxRef.current + (down ? 1 : -1))
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
      goRef.current = null
    }
  }, [reduceMotion])

  const goTo = useCallback((i: number) => goRef.current?.(i), [])

  const yearly = cycle === 'yearly'
  const priceAmount = yearly ? up.priceYearly : up.priceMonthly
  const priceStrike = yearly ? up.priceStrike : ''
  const billedNote = yearly ? up.billedYearly : up.billedMonthly
  const ctaLabel = yearly ? up.ctaYearly : up.ctaMonthly
  const comparePro = yearly ? up.compareProYearly : up.compareProMonthly
  const ctaSubline = yearly ? up.finalSublineYearly : up.finalSublineMonthly

  const busyAny = busy !== null
  const checkout = () => onCheckout(cycle)

  return (
    <div
      ref={rootRef}
      className={`billing-up${reduceMotion ? ' billing-up--reduced' : ''}`}
      data-active={activeIdx}
    >
      {/* 우측 섹션 네비게이터 */}
      <nav className="billing-up__nav" aria-label={up.navItems.join(', ')}>
        {up.navItems.map((label, i) => (
          <button
            key={label}
            type="button"
            className="billing-up__nav-item"
            aria-label={label}
            aria-current={activeIdx === i ? 'true' : undefined}
            onClick={() => goTo(i)}
          >
            <span className="billing-up__nav-label" data-active={activeIdx === i}>
              {label}
            </span>
            <span className="billing-up__nav-bar" data-active={activeIdx === i} />
          </button>
        ))}
      </nav>

      {/* 결제 오류/취소 등 상태 메시지 (하단 고정) */}
      {message && (
        <p className="billing-up__message" role="status">
          {message}
        </p>
      )}

      {/* 스크롤 힌트 (마지막 섹션 전까지) */}
      {activeIdx < up.navItems.length - 1 && (
        <div className="billing-up__hint" aria-hidden="true">
          <span className="billing-up__hint-label">{up.scrollHint}</span>
          <ChevronDownIcon />
        </div>
      )}

      {/* 섹션 1 — 히어로 + 가격 */}
      <section data-snap className="billing-up__section billing-up__section--hero">
        <div className="billing-up__col billing-up__col--header">
          <header className="billing-up__header">
            <a className="billing-up__back" href="/">
              {page.backToCalculator}
            </a>
            <span className="billing-up__status">
              <span className="billing-up__status-label">{page.statusLabel}</span>
              <span className="billing-up__status-badge">
                <span className="billing-up__status-dot" aria-hidden="true" />
                {copy.statusFree}
              </span>
            </span>
          </header>
        </div>
        <div className="billing-up__hero-fill">
          <div className="billing-up__col billing-up__hero-grid">
            {/* 좌: 카피 + 토글 */}
            <div className="billing-up__hero-copy">
              <div className="billing-up__pro-badge">
                <span className="billing-up__pro-mark" aria-hidden="true">
                  P
                </span>
                <span className="billing-up__pro-text">{up.proBadge}</span>
              </div>
              <h1 className="billing-up__title">
                {up.heroTitleLine1}
                <br />
                {up.heroTitleLine2}
              </h1>
              <p className="billing-up__subtitle">{up.heroSubtitle}</p>

              <div className="billing-up__toggle" role="group" aria-label={up.navItems[0]}>
                <span className="billing-up__toggle-indicator" data-yearly={yearly} aria-hidden="true" />
                <button
                  type="button"
                  className="billing-up__toggle-btn"
                  data-active={!yearly}
                  aria-pressed={!yearly}
                  onClick={() => setCycle('monthly')}
                >
                  {up.toggleMonthly}
                </button>
                <button
                  type="button"
                  className="billing-up__toggle-btn"
                  data-active={yearly}
                  aria-pressed={yearly}
                  onClick={() => setCycle('yearly')}
                >
                  {up.toggleYearly}
                  <span className="billing-up__toggle-save">{up.toggleSave}</span>
                </button>
              </div>
            </div>

            {/* 우: Pro 가격 카드 */}
            <div className="billing-up__card">
              <div className="billing-up__card-glow" aria-hidden="true" />
              <div className="billing-up__card-body">
                <div className="billing-up__card-head">
                  <div>
                    <div className="billing-up__card-name">{up.planName}</div>
                    <div className="billing-up__card-sub">{up.planSub}</div>
                  </div>
                  <span className="billing-up__card-badge">{up.recommendBadge}</span>
                </div>

                <div className="billing-up__price">
                  <span className="billing-up__price-main">
                    <span className="billing-up__price-amount">{priceAmount}</span>
                    <span className="billing-up__price-unit">{up.priceUnit}</span>
                  </span>
                  <span className="billing-up__price-meta">
                    <span className="billing-up__price-strike">{priceStrike}</span>
                    <span className="billing-up__price-billed">{billedNote}</span>
                  </span>
                </div>

                <button
                  type="button"
                  className="billing-up__cta"
                  disabled={busyAny}
                  onClick={checkout}
                >
                  {busy === cycle ? copy.redirecting : ctaLabel}
                </button>

                <div className="billing-up__features">
                  <div className="billing-up__features-title">{up.featuresTitle}</div>
                  <ul className="billing-up__features-list">
                    {up.features.map((feature) => (
                      <li key={feature} className="billing-up__feature">
                        <CheckIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 섹션 2 — Before / After + 계정 기록 미리보기 */}
      <section data-snap className="billing-up__section billing-up__section--center">
        <div className="billing-up__col">
          <div className="billing-up__section-head">
            <div className="billing-up__eyebrow">{up.baEyebrow}</div>
            <h2 className="billing-up__section-title">{up.baTitle}</h2>
          </div>

          <div className="billing-up__ba-grid">
            <div className="billing-up__ba-card">
              <div className="billing-up__ba-label">
                <span className="billing-up__ba-dot billing-up__ba-dot--muted" aria-hidden="true" />
                {up.beforeLabel}
              </div>
              <ul className="billing-up__ba-list">
                {up.beforeItems.map((item) => (
                  <li key={item} className="billing-up__ba-item billing-up__ba-item--before">
                    <span className="billing-up__ba-dash" aria-hidden="true">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="billing-up__arrow" aria-hidden="true">
              <ArrowIcon />
            </div>

            <div className="billing-up__ba-card billing-up__ba-card--after">
              <div className="billing-up__ba-label">
                <span className="billing-up__ba-dot billing-up__ba-dot--pro" aria-hidden="true" />
                {up.afterLabel}
              </div>
              <ul className="billing-up__ba-list">
                {up.afterItems.map((item) => (
                  <li key={item} className="billing-up__ba-item">
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 계정 기록 미리보기 — records-summary-* 클래스 재사용(마케팅용 고정 샘플) */}
          <div className="billing-up__records">
            <div className="billing-up__records-head">
              <div className="billing-up__records-title-wrap">
                <h3 className="billing-up__records-title">{up.recordsTitle}</h3>
                <span className="billing-up__records-badge">{up.recordsBadge}</span>
              </div>
              <span className="billing-up__records-link">{up.recordsLink}</span>
            </div>
            <div className="records-summary-grid">
              <section className="records-summary-block">
                <div className="records-summary-block-head">
                  <h3>{up.snapshotTitle}</h3>
                </div>
                <div className="records-summary-table records-summary-table--snapshot" role="table">
                  <div className="records-summary-row records-summary-head" role="row">
                    {up.snapshotHeaders.map((header) => (
                      <span key={header} role="columnheader">
                        {header}
                      </span>
                    ))}
                  </div>
                  <div className="records-summary-row records-summary-values" role="row">
                    {SAMPLE_SNAPSHOT.map((value, i) => (
                      <strong key={up.snapshotHeaders[i] ?? i} role="cell">
                        {value}
                      </strong>
                    ))}
                  </div>
                </div>
              </section>
              <section className="records-summary-block">
                <div className="records-summary-block-head">
                  <h3>{up.ordersTitle}</h3>
                </div>
                <div className="records-summary-table records-summary-table--orders" role="table">
                  <div className="records-summary-row records-summary-head" role="row">
                    {up.ordersHeaders.map((header) => (
                      <span key={header} role="columnheader">
                        {header}
                      </span>
                    ))}
                  </div>
                  {SAMPLE_ORDERS.map((order) => (
                    <div key={order.time} className="records-summary-row records-summary-order" role="row">
                      <time role="cell">{order.time}</time>
                      <span
                        className={`records-summary-side records-summary-side--${order.side}`}
                        role="cell"
                      >
                        {order.side}
                      </span>
                      <strong role="cell">{order.contracts}</strong>
                      <strong role="cell">{order.price}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <p className="billing-up__records-note">{up.recordsNote}</p>
          </div>
        </div>
      </section>

      {/* 섹션 3 — 비교표 + FAQ */}
      <section data-snap className="billing-up__section billing-up__section--center">
        <div className="billing-up__col">
          <div className="billing-up__section-head">
            <h2 className="billing-up__section-title">{up.compareTitle}</h2>
          </div>

          <div className="billing-up__compare">
            <div className="billing-up__compare-row billing-up__compare-head">
              <div className="billing-up__compare-cell billing-up__compare-cell--feature">
                {up.compareFeatureCol}
              </div>
              <div className="billing-up__compare-cell billing-up__compare-cell--plan">{up.compareFree}</div>
              <div className="billing-up__compare-cell billing-up__compare-cell--pro">{up.comparePro}</div>
            </div>
            {up.compareRows.map((row) => (
              <div key={row.label} className="billing-up__compare-row">
                <div className="billing-up__compare-cell billing-up__compare-cell--feature">{row.label}</div>
                <div className="billing-up__compare-cell billing-up__compare-cell--plan billing-up__compare-mono">
                  {row.free}
                </div>
                <div className="billing-up__compare-cell billing-up__compare-cell--pro billing-up__compare-mono">
                  {row.pro}
                </div>
              </div>
            ))}
            <div className="billing-up__compare-row billing-up__compare-price">
              <div className="billing-up__compare-cell billing-up__compare-cell--feature">
                {up.comparePriceLabel}
              </div>
              <div className="billing-up__compare-cell billing-up__compare-cell--plan billing-up__compare-mono">
                {up.comparePriceFree}
              </div>
              <div className="billing-up__compare-cell billing-up__compare-cell--pro billing-up__compare-mono">
                {comparePro}
              </div>
            </div>
          </div>

          <div className="billing-up__faq">
            {up.faq.map((item) => (
              <div key={item.q} className="billing-up__faq-item">
                <p className="billing-up__faq-q">{item.q}</p>
                <p className="billing-up__faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 4 — 최종 결제 CTA */}
      <section data-snap className="billing-up__section billing-up__section--center">
        <div className="billing-up__col billing-up__col--final">
          <div className="billing-up__final">
            <h2 className="billing-up__final-title">{up.finalTitle}</h2>
            <p className="billing-up__final-subline">{ctaSubline}</p>
            <button
              type="button"
              className="billing-up__cta billing-up__final-cta"
              disabled={busyAny}
              onClick={checkout}
            >
              {busy === cycle ? copy.redirecting : up.finalCta}
            </button>
            <p className="billing-up__final-fine">{up.finalFinePrint}</p>
          </div>

          <div className="billing-up__trust">
            <span className="billing-up__trust-item">
              <ShieldIcon />
              {up.trust[0]}
            </span>
            <span className="billing-up__trust-divider" aria-hidden="true" />
            <span className="billing-up__trust-item">{up.trust[1]}</span>
            <span className="billing-up__trust-divider" aria-hidden="true" />
            <span className="billing-up__trust-item">{up.trust[2]}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
