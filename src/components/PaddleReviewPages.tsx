import { useState } from 'react'
import { useLanguage, type Locale } from '../i18n'
import { localizedPublicPath } from '../config/routes'
import { PublicInfoShell } from './PublicInfoShell'
import '../styles/pages.css'

type BillingCycle = 'monthly' | 'yearly'

interface PricingPlanCopy {
  title: string
  price: string
  body: string
  features: string[]
  action: string
}

interface ProBillingOptionCopy {
  label: string
  price: string
  cadence: string
  detail?: string
  badge?: string
}

interface PricingCopy {
  eyebrow: string
  title: string
  lead: string
  free: PricingPlanCopy
  pro: Omit<PricingPlanCopy, 'price'> & {
    cycleLabel: string
    billing: Record<BillingCycle, ProBillingOptionCopy>
  }
  billingTitle: string
  billingItems: string[]
}

interface PublicReviewCopy {
  pricing: PricingCopy
}

// eslint-disable-next-line react-refresh/only-export-components -- Review copy is exported for deterministic bilingual content tests.
export const publicReviewCopy: Record<Locale, PublicReviewCopy> = {
  en: {
    pricing: {
      eyebrow: 'Pricing',
      title: 'Pricing',
      lead:
        'LiqGuard currently offers a free browser calculator. After Paddle approval and production activation, Pro will add an ad-free workspace and longer-term account records.',
      free: {
        title: 'Free',
        price: '$0',
        body: 'Use the core calculator and public documentation without a paid subscription.',
        features: [
          'Core liquidation, margin, leverage, and order-simulation calculator.',
          'Public guide and formula reference.',
          'One number set stored in this browser. The current public service has no sign-in or cloud storage.',
        ],
        action: 'Use the calculator for free',
      },
      pro: {
        title: 'Pro',
        body: 'When live sales open, Pro will remove ads and add the account-record features listed below.',
        features: [
          'No advertising.',
          'Up to 10 local number sets and 10 cloud number sets.',
          'Automatic daily account snapshots.',
          'Unlimited order-history archive.',
        ],
        action: 'Billing coming soon',
        cycleLabel: 'Choose billing cycle',
        billing: {
          monthly: {
            label: 'Monthly',
            price: '$5',
            cadence: '/ month',
          },
          yearly: {
            label: 'Yearly',
            price: '$48',
            cadence: '/ year',
            detail: '$4 per month · Save $12 a year',
            badge: 'Save 20%',
          },
        },
      },
      billingTitle: 'Billing notes',
      billingItems: [
        'All displayed prices are in USD.',
        'Payments are processed securely by Paddle as the merchant of record.',
        'Applicable taxes may be added by Paddle depending on the buyer location.',
        'Customers can manage subscriptions and receipts through Paddle order support.',
        'Monthly and yearly subscriptions renew for each billing period until canceled.',
        'Live billing starts only after Paddle account and domain verification are complete.',
      ],
    },
  },
  ko: {
    pricing: {
      eyebrow: '요금',
      title: '요금제',
      lead:
        'LiqGuard는 현재 브라우저에서 사용하는 무료 계산기를 제공합니다. Paddle 승인과 실제 결제 활성화가 끝나면 Pro에서 광고 제거와 장기 계좌 기록 기능을 제공합니다.',
      free: {
        title: '무료',
        price: '$0',
        body: '유료 구독 없이 핵심 계산기와 공개 문서를 이용할 수 있습니다.',
        features: [
          '청산가·증거금·레버리지·주문 시뮬레이션 계산기.',
          '공개 사용 가이드와 수식 정의.',
          '현재 브라우저에 저장되는 숫자세트 1개. 현재 공개 서비스에는 로그인과 클라우드 저장 기능이 없습니다.',
        ],
        action: '무료로 계산기 사용하기',
      },
      pro: {
        title: 'Pro',
        body: '실제 판매가 시작되면 Pro에서 광고를 제거하고 아래 계좌 기록 기능을 제공합니다.',
        features: [
          '광고 완전 제거.',
          '로컬 숫자세트 10개와 클라우드 숫자세트 10개.',
          '계좌 스냅샷 매일 자동 저장.',
          '주문 기록 무제한 아카이브.',
        ],
        action: '결제 준비 중',
        cycleLabel: '결제 주기 선택',
        billing: {
          monthly: {
            label: '월간',
            price: '$5',
            cadence: '/ 월',
          },
          yearly: {
            label: '연간',
            price: '$48',
            cadence: '/ 년',
            detail: '월 $4로 환산 · 연 $12 절약',
            badge: '20% 절약',
          },
        },
      },
      billingTitle: '결제 안내',
      billingItems: [
        '표시된 모든 가격의 통화는 미국 달러(USD)입니다.',
        '결제는 Merchant of Record인 Paddle을 통해 안전하게 처리됩니다.',
        '구매자의 지역에 따라 Paddle이 세금을 추가로 부과할 수 있습니다.',
        '구독 관리, 영수증, 결제 지원은 Paddle 주문 지원을 통해 처리할 수 있습니다.',
        '월간·연간 구독은 취소 전까지 각 결제 주기마다 자동 갱신됩니다.',
        '실제 결제는 Paddle 계정과 도메인 심사가 완료된 뒤에만 시작됩니다.',
      ],
    },
  },
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="public-review-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export function PricingReviewPage() {
  const { locale } = useLanguage()
  const pricing = publicReviewCopy[locale].pricing
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const selectedBilling = pricing.pro.billing[billingCycle]

  return (
    <PublicInfoShell
      activePath={null}
      tone="product-doc"
      eyebrow={pricing.eyebrow}
      title={pricing.title}
      lead={pricing.lead}
      showNavigation={false}
    >
      <div className="public-pricing-grid">
        <section className="public-pricing-card public-pricing-card--free">
          <h2>{pricing.free.title}</h2>
          <p className="public-pricing-price">{pricing.free.price}</p>
          <p className="public-pricing-description">{pricing.free.body}</p>
          <BulletList items={pricing.free.features} />
          <a
            className="public-pricing-action public-pricing-action--free"
            href={localizedPublicPath('/', locale)}
          >
            {pricing.free.action}
          </a>
        </section>

        <section className="public-pricing-card public-pricing-card--pro">
          <div className="public-pricing-card__heading">
            <h2>{pricing.pro.title}</h2>
            <div
              className="public-pricing-cycle"
              role="group"
              aria-label={pricing.pro.cycleLabel}
            >
              {(Object.keys(pricing.pro.billing) as BillingCycle[]).map((cycle) => {
                const option = pricing.pro.billing[cycle]
                const selected = cycle === billingCycle

                return (
                  <button
                    key={cycle}
                    type="button"
                    aria-pressed={selected}
                    className="public-pricing-cycle__option"
                    data-active={selected ? 'true' : 'false'}
                    onClick={() => setBillingCycle(cycle)}
                  >
                    <span>{option.label}</span>
                    {option.badge ? (
                      <span className="public-pricing-cycle__badge">{option.badge}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="public-pricing-selected" aria-live="polite">
            <p className="public-pricing-price">
              {selectedBilling.price} <span>{selectedBilling.cadence}</span>
            </p>
            {selectedBilling.detail ? (
              <p className="public-pricing-selected__detail">{selectedBilling.detail}</p>
            ) : null}
          </div>

          <p className="public-pricing-description">{pricing.pro.body}</p>
          <BulletList items={pricing.pro.features} />
          <div className="public-pricing-action-wrap">
            <button
              className="public-pricing-action public-pricing-action--pending"
              type="button"
              disabled
            >
              {pricing.pro.action}
            </button>
          </div>
        </section>
      </div>

      <section className="public-pricing-notes">
        <h2>{pricing.billingTitle}</h2>
        <BulletList items={pricing.billingItems} />
      </section>
    </PublicInfoShell>
  )
}
