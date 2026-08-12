import { useLanguage, type Locale } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'
import '../styles/pages.css'

interface PricingCopy {
  eyebrow: string
  title: string
  lead: string
  plans: { title: string; price: string; body: string; features: string[] }[]
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
        'LiqGuard has a free plan. Pro subscriptions will be sold after Paddle live-account and domain approval for users who need an ad-free workflow and longer-term account records.',
      plans: [
        {
          title: 'Free',
          price: '$0',
          body: 'Use the core calculator and public documentation without a paid subscription.',
          features: [
            'Core liquidation, margin, leverage, and order-simulation calculator.',
            'Public guide and formula reference.',
            'One local number set and, when signed in, one cloud number set.',
          ],
        },
        {
          title: 'Pro Monthly',
          price: '$5 / month',
          body: 'All Pro features with monthly billing. The subscription renews each month until canceled.',
          features: [
            'No advertising.',
            'Up to 10 local number sets and 10 cloud number sets.',
            'Automatic daily account snapshots.',
            'Unlimited order-history archive.',
          ],
        },
        {
          title: 'Pro Yearly',
          price: '$48 / year',
          body: 'The same Pro features with annual billing at $48 per year.',
          features: [
            'No advertising.',
            'Up to 10 local number sets and 10 cloud number sets.',
            'Automatic daily account snapshots.',
            'Unlimited order-history archive.',
          ],
        },
      ],
      billingTitle: 'Billing notes',
      billingItems: [
        'Payments are processed securely by Paddle as the merchant of record.',
        'Applicable taxes may be added by Paddle depending on the buyer location.',
        'Customers can manage subscriptions and receipts through Paddle order support.',
        'Live billing starts only after Paddle account and domain verification are complete.',
      ],
    },
  },
  ko: {
    pricing: {
      eyebrow: '요금',
      title: '요금제',
      lead:
        'LiqGuard는 무료 플랜을 제공합니다. Pro 구독은 Paddle Live 계정과 도메인 승인 후 광고 없는 화면과 장기 계좌 기록이 필요한 사용자를 대상으로 판매할 예정입니다.',
      plans: [
        {
          title: '무료',
          price: '$0',
          body: '유료 구독 없이 핵심 계산기와 공개 문서를 이용할 수 있습니다.',
          features: [
            '청산가·증거금·레버리지·주문 시뮬레이션 계산기.',
            '공개 사용 가이드와 수식 정의.',
            '로컬 숫자세트 1개와 로그인 시 클라우드 숫자세트 1개.',
          ],
        },
        {
          title: 'Pro 월간',
          price: '$5 / 월',
          body: '모든 Pro 기능을 월 단위로 이용합니다. 구독은 취소 전까지 매월 갱신됩니다.',
          features: [
            '광고 완전 제거.',
            '로컬 숫자세트 10개와 클라우드 숫자세트 10개.',
            '계좌 스냅샷 매일 자동 저장.',
            '주문 기록 무제한 아카이브.',
          ],
        },
        {
          title: 'Pro 연간',
          price: '$48 / 년',
          body: '월간 플랜과 동일한 Pro 기능을 연 $48에 이용합니다.',
          features: [
            '광고 완전 제거.',
            '로컬 숫자세트 10개와 클라우드 숫자세트 10개.',
            '계좌 스냅샷 매일 자동 저장.',
            '주문 기록 무제한 아카이브.',
          ],
        },
      ],
      billingTitle: '결제 안내',
      billingItems: [
        '결제는 Merchant of Record인 Paddle을 통해 안전하게 처리됩니다.',
        '구매자의 지역에 따라 Paddle이 세금을 추가로 부과할 수 있습니다.',
        '구독 관리, 영수증, 결제 지원은 Paddle 주문 지원을 통해 처리할 수 있습니다.',
        '실제 결제는 Paddle 계정 및 도메인 검증이 완료된 뒤 시작됩니다.',
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

  return (
    <PublicInfoShell
      activePath={null}
      tone="product-doc"
      eyebrow={pricing.eyebrow}
      title={pricing.title}
      lead={pricing.lead}
    >
      <div className="public-pricing-grid">
        {pricing.plans.map((plan) => (
          <section key={plan.title} className="public-pricing-card">
            <h2>{plan.title}</h2>
            <p className="public-pricing-price">{plan.price}</p>
            <p className="public-pricing-description">{plan.body}</p>
            <BulletList items={plan.features} />
          </section>
        ))}
      </div>

      <section className="public-pricing-notes">
        <h2>{pricing.billingTitle}</h2>
        <BulletList items={pricing.billingItems} />
      </section>
    </PublicInfoShell>
  )
}
