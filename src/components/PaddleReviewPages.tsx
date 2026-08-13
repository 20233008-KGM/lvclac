import { useEffect, type ReactNode } from 'react'
import { PRIVACY_PATH, TERMS_PATH, type LegalPageKind } from '../config/routes'
import { CONTACT_EMAIL } from '../config/site'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage, type Locale } from '../i18n'
import { LanguageToggle } from './LanguageToggle'
import { BackToCalculatorLink, PublicInfoShell } from './PublicInfoShell'
import { LegalLinks } from './ServiceDisclaimer'
import { AuthButton } from './auth/AuthButton'
import '../styles/pages.css'

interface PublicPageShellProps {
  eyebrow: string
  title: string
  lead: string
  backLabel: string
  copyright: string
  children: ReactNode
}

interface ProductCopy {
  eyebrow: string
  title: string
  lead: string
  panels: { title: string; body?: string; items?: string[] }[]
}

interface PricingCopy {
  eyebrow: string
  title: string
  lead: string
  plans: { title: string; price: string; body: string }[]
  billingTitle: string
  billingItems: string[]
}

interface LegalDocCopy {
  eyebrow: string
  title: string
  lead: string
  effectiveDate: string
  intro: string
  sections: {
    title: string
    body: string
    links?: { label: string; href: string }[]
  }[]
  contactTitle: string
  contactBodyPrefix: string
  contactBodySuffix: string
}

interface PublicReviewCopy {
  backLabel: string
  copyright: string
  product: ProductCopy
  pricing: PricingCopy
  legal: Record<LegalPageKind, LegalDocCopy>
}

// Exported for copy-contract tests; runtime exports below remain React components.
// eslint-disable-next-line react-refresh/only-export-components
export const publicReviewCopy: Record<Locale, PublicReviewCopy> = {
  en: {
    backLabel: 'Back to calculator',
    copyright: '(c) 2026 Farfield Software. All rights reserved.',
    product: {
      eyebrow: 'Product',
      title: 'Futures Calculator',
      lead:
        'A browser-based calculator for estimating liquidation price, margin headroom, leverage, and order impact for a single futures or leveraged position.',
      panels: [
        {
          title: 'What the product does',
          body:
            'Futures Calculator helps traders copy the account and margin values shown by their broker, then estimate how much room remains before a margin call or liquidation event. The calculator is an educational and workflow support tool. It does not place trades, connect to brokerage accounts, or provide investment advice.',
        },
        {
          title: 'Key features included',
          items: [
            'Liquidation price, margin cushion, leverage, and available margin estimates.',
            'Long and short position modes for a single instrument at a time.',
            'Rate, per-contract, and total margin input modes to match different broker screens.',
            'Scenario and order preview tools for estimating post-fill account state.',
            'Optional local input saving, signed-in cloud input saving, and account snapshots.',
          ],
        },
        {
          title: 'Free and Pro deliverables',
          body:
            'The free product includes the core calculator, public guide, formula reference, and device-local input saving. Pro is planned as a paid subscription that removes ads and unlocks paid workflow features as they become available.',
        },
      ],
    },
    pricing: {
      eyebrow: 'Pricing',
      title: 'Pricing',
      lead:
        'Futures Calculator has a free plan. Paid Pro subscriptions are planned for users who want an ad-free experience and additional workflow features.',
      plans: [
        {
          title: 'Free',
          price: '$0',
          body: 'Core calculator, guide, formula reference, and local input saving.',
        },
        {
          title: 'Pro Monthly',
          price: '$5 / month',
          body: 'Ad-free use and Pro workflow features. Subscriptions renew monthly until canceled.',
        },
        {
          title: 'Pro Yearly',
          price: '$48 / year',
          body:
            'Same Pro benefits with annual billing. Equivalent to two months free compared with monthly billing.',
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
    legal: {
      terms: {
        eyebrow: 'Terms',
        title: 'Terms and Conditions',
        lead: 'Terms for using Futures Calculator and paid Pro subscriptions.',
        effectiveDate: 'Effective: July 9, 2026',
        intro:
          'These terms apply to Futures Calculator, provided by Farfield Software. By using the service, you agree to use it only as an informational calculator and to make your own trading decisions.',
        sections: [
          {
            title: '1. Service provider',
            body: `Futures Calculator is operated by Farfield Software. Contact: ${CONTACT_EMAIL}.`,
          },
          {
            title: '2. Product scope',
            body:
              'The service estimates liquidation price, margin headroom, leverage, and related values from user-entered inputs. Results may differ from broker, exchange, tax, fee, or liquidation rules.',
          },
          {
            title: '3. No financial advice',
            body:
              'The service does not provide investment, financial, legal, or tax advice. Users are responsible for checking broker values and for all trading decisions and outcomes.',
          },
          {
            title: '4. Paid subscriptions',
            body:
              'Paid Pro subscriptions are sold through Paddle. Paddle may act as the merchant of record for payment processing, tax handling, invoices, receipts, cancellations, and refunds.',
          },
          {
            title: '5. User obligations',
            body:
              'Users must not misuse the service, interfere with its operation, attempt unauthorized access, or use the service for illegal activity.',
          },
          {
            title: '6. Availability and changes',
            body:
              'The service may change, pause, or discontinue features. We try to keep the calculator reliable, but do not guarantee uninterrupted availability.',
          },
          {
            title: '7. Limitation of liability',
            body:
              'To the maximum extent permitted by law, Farfield Software is not liable for trading losses, missed opportunities, indirect damages, or differences between calculator output and third-party systems.',
          },
        ],
        contactTitle: 'Contact',
        contactBodyPrefix: 'Email ',
        contactBodySuffix: ' for support, privacy, or product questions.',
      },
      privacy: {
        eyebrow: 'Privacy',
        title: 'Privacy Policy',
        lead:
          'How Futures Calculator handles account, saved input, analytics, advertising, and payment-related data.',
        effectiveDate: 'Effective: July 9, 2026',
        intro:
          'This policy explains what information may be processed when you use Futures Calculator.',
        sections: [
          {
            title: '1. Information you provide',
            body:
              'If you create an account, we may process your email address, display name, authentication provider, and saved calculator data that you choose to store.',
          },
          {
            title: '2. Calculator data',
            body:
              'Device-local saving stores inputs in your browser. Cloud saving and account records may store calculator inputs, snapshots, and order simulation history in Supabase for your signed-in account.',
          },
          {
            title: '3. Payments',
            body:
              'Paid subscriptions are processed by Paddle. We do not store card details. Paddle may process payment, tax, invoice, receipt, refund, and subscription data under its own buyer terms and privacy terms.',
          },
          {
            title: '4. Analytics and advertising',
            body:
              'We may use analytics and advertising providers to understand usage and operate the service. Those providers may process cookies, device information, IP address, and usage events under their own policies.',
          },
          {
            title: '5. Retention and deletion',
            body:
              'Device-local data remains in your browser until you clear it or turn off saving. Cloud data and account deletion requests can be sent to our support email.',
          },
          {
            title: '6. Contact',
            body: `For privacy questions or deletion requests, contact ${CONTACT_EMAIL}.`,
          },
        ],
        contactTitle: 'Contact',
        contactBodyPrefix: 'Email ',
        contactBodySuffix: ' for support, privacy, or product questions.',
      },
      refund: {
        eyebrow: 'Refunds',
        title: 'Refund Policy',
        lead:
          'How refunds and subscription cancellations are handled for purchases made through Paddle.',
        effectiveDate: 'Effective: August 12, 2026',
        intro:
          'Paddle Sandbox checkout in this development environment is for testing only. This policy applies to cancellation and refund requests for Futures Calculator Pro Monthly and Pro Yearly subscriptions when Paddle live sales begin.',
        sections: [
          {
            title: '1. Seller and payment provider',
            body:
              'When live sales begin, Futures Calculator Pro subscriptions are sold through Paddle. Paddle acts as the online reseller and merchant of record for purchase transactions, payments, applicable taxes, invoices and receipts, billing support, and refunds.',
            links: [
              { label: 'Paddle Buyer Terms', href: 'https://www.paddle.com/legal/buyer-terms' },
              { label: 'Paddle Refund Policy', href: 'https://www.paddle.com/legal/refund-policy' },
            ],
          },
          {
            title: '2. How to request a refund',
            body: `Use the support link in your purchase email or Paddle order support at paddle.net. For product access or functionality issues, contact ${CONTACT_EMAIL}; we can direct you to the appropriate Paddle support route when needed.`,
            links: [{ label: 'Paddle order support', href: 'https://paddle.net/' }],
          },
          {
            title: '3. Refund eligibility',
            body:
              'Payments are generally non-refundable unless applicable law requires a refund or Paddle approves one after reviewing the individual circumstances. Paddle may consider the law in the buyer location, purchase timing, usage, and the reason for the request. This policy does not limit mandatory withdrawal or refund rights that apply where the buyer lives.',
          },
          {
            title: '4. Cancellation compared with a refund',
            body:
              'Canceling stops the next automatic renewal. Unless otherwise stated, Pro access continues until the end of the paid period. Cancellation does not automatically refund the current billing period. Submit a separate refund request through Paddle order support when a refund is needed.',
          },
          {
            title: '5. Approved refunds and access',
            body:
              'If approved, Paddle returns funds to the original payment method where possible. Bank and card timing varies. When Paddle confirms that a refund is complete, Pro access granted by that transaction ends. Partial refunds or treatment required by law follow Paddle’s decision and notice.',
          },
          {
            title: '6. Product support',
            body: `Report account access, calculator, or Pro feature issues to ${CONTACT_EMAIL}. Product troubleshooting is available separately from the refund process.`,
          },
        ],
        contactTitle: 'Contact',
        contactBodyPrefix: 'Email ',
        contactBodySuffix: ' for support, privacy, or product questions.',
      },
    },
  },
  ko: {
    backLabel: '계산기로 돌아가기',
    copyright: '(c) 2026 Farfield Software. All rights reserved.',
    product: {
      eyebrow: '제품',
      title: '선물 계산기',
      lead:
        '단일 선물 또는 레버리지 포지션의 청산가, 증거금 여유, 레버리지, 주문 후 계좌 상태를 추정하는 브라우저 기반 계산기입니다.',
      panels: [
        {
          title: '제품 설명',
          body:
            '선물 계산기는 사용자가 증권사 또는 브로커 화면에 표시된 계좌 평가금액과 증거금 값을 직접 입력해, 마진콜 또는 청산 위험까지 어느 정도 여유가 있는지 추정하도록 돕는 도구입니다. 이 서비스는 교육 및 업무 보조 목적의 계산 도구이며, 주문을 실행하거나 브로커 계좌에 연결하거나 투자 자문을 제공하지 않습니다.',
        },
        {
          title: '주요 기능',
          items: [
            '청산가, 증거금 여유, 레버리지, 가용 증거금 추정.',
            '한 번에 하나의 종목 또는 포지션을 기준으로 한 롱/숏 계산.',
            '브로커 화면에 맞출 수 있는 비율, 계약당 금액, 총액 증거금 입력 방식.',
            '체결 직후 계좌 상태를 미리 보는 시나리오 및 주문 미리보기 도구.',
            '선택형 로컬 입력 저장, 로그인 사용자용 클라우드 입력 저장, 계좌 스냅샷.',
          ],
        },
        {
          title: '무료 및 Pro 제공 내용',
          body:
            '무료 버전에는 핵심 계산기, 공개 사용 가이드, 공식 설명 페이지, 기기 내 입력 저장 기능이 포함됩니다. Pro는 광고 제거와 유료 워크플로 기능을 제공하는 구독 상품으로 준비 중입니다.',
        },
      ],
    },
    pricing: {
      eyebrow: '요금',
      title: '요금제',
      lead:
        '선물 계산기는 무료 플랜을 제공합니다. Pro 구독은 광고 없는 사용 경험과 추가 워크플로 기능이 필요한 사용자를 위한 유료 플랜입니다.',
      plans: [
        {
          title: '무료',
          price: '$0',
          body: '핵심 계산기, 사용 가이드, 공식 설명, 로컬 입력 저장 기능을 제공합니다.',
        },
        {
          title: 'Pro 월간',
          price: '$5 / 월',
          body: '광고 없는 사용과 Pro 워크플로 기능을 제공합니다. 구독은 취소 전까지 매월 갱신됩니다.',
        },
        {
          title: 'Pro 연간',
          price: '$48 / 년',
          body: '월간 플랜과 동일한 Pro 혜택을 연간 결제로 제공합니다. 월간 결제 대비 2개월분이 절약됩니다.',
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
    legal: {
      terms: {
        eyebrow: '약관',
        title: '이용약관',
        lead: '선물 계산기와 유료 Pro 구독 이용에 적용되는 약관입니다.',
        effectiveDate: '시행일: 2026년 7월 9일',
        intro:
          '이 약관은 Farfield Software가 제공하는 선물 계산기 서비스에 적용됩니다. 서비스를 이용하면 이 서비스를 정보 제공용 계산 도구로만 사용하고, 모든 거래 판단은 직접 수행하는 데 동의한 것으로 봅니다.',
        sections: [
          {
            title: '1. 서비스 제공자',
            body: `선물 계산기는 Farfield Software가 운영합니다. 문의: ${CONTACT_EMAIL}.`,
          },
          {
            title: '2. 제품 범위',
            body:
              '이 서비스는 사용자가 입력한 값으로 청산가, 증거금 여유, 레버리지 및 관련 값을 추정합니다. 결과는 브로커, 거래소, 세금, 수수료, 청산 규칙과 다를 수 있습니다.',
          },
          {
            title: '3. 투자 자문 아님',
            body:
              '이 서비스는 투자, 금융, 법률 또는 세무 자문을 제공하지 않습니다. 사용자는 브로커 화면의 값을 직접 확인해야 하며, 모든 거래 결정과 그 결과에 대한 책임은 사용자에게 있습니다.',
          },
          {
            title: '4. 유료 구독',
            body:
              '유료 Pro 구독은 Paddle을 통해 판매됩니다. Paddle은 결제 처리, 세금 처리, 송장, 영수증, 취소 및 환불에 대해 Merchant of Record 역할을 할 수 있습니다.',
          },
          {
            title: '5. 사용자 의무',
            body:
              '사용자는 서비스를 오용하거나, 서비스 운영을 방해하거나, 무단 접근을 시도하거나, 불법적인 목적으로 서비스를 이용해서는 안 됩니다.',
          },
          {
            title: '6. 서비스 변경 및 가용성',
            body:
              '서비스의 기능은 변경, 일시 중단 또는 종료될 수 있습니다. 안정적인 계산기 제공을 위해 노력하지만, 중단 없는 이용 가능성을 보장하지는 않습니다.',
          },
          {
            title: '7. 책임 제한',
            body:
              '법이 허용하는 최대 범위에서 Farfield Software는 거래 손실, 기회 손실, 간접 손해 또는 계산 결과와 제3자 시스템 간 차이에 대해 책임지지 않습니다.',
          },
        ],
        contactTitle: '문의',
        contactBodyPrefix: '지원, 개인정보, 제품 문의는 ',
        contactBodySuffix: ' 로 보내주세요.',
      },
      privacy: {
        eyebrow: '개인정보',
        title: '개인정보처리방침',
        lead:
          '선물 계산기가 계정, 저장 입력값, 분석, 광고, 결제 관련 데이터를 처리하는 방식을 설명합니다.',
        effectiveDate: '시행일: 2026년 7월 9일',
        intro: '이 방침은 선물 계산기 이용 시 처리될 수 있는 정보를 설명합니다.',
        sections: [
          {
            title: '1. 사용자가 제공하는 정보',
            body:
              '계정을 생성하면 이메일 주소, 표시 이름, 인증 제공자, 사용자가 저장하기로 선택한 계산기 데이터를 처리할 수 있습니다.',
          },
          {
            title: '2. 계산기 데이터',
            body:
              '기기 내 저장은 입력값을 사용자의 브라우저에 저장합니다. 클라우드 저장과 계좌 기록 기능은 로그인 계정의 Supabase 데이터베이스에 계산기 입력값, 스냅샷, 주문 시뮬레이션 기록을 저장할 수 있습니다.',
          },
          {
            title: '3. 결제',
            body:
              '유료 구독은 Paddle을 통해 처리됩니다. 당사는 카드 정보를 저장하지 않습니다. Paddle은 자체 구매자 약관 및 개인정보 조건에 따라 결제, 세금, 송장, 영수증, 환불, 구독 데이터를 처리할 수 있습니다.',
          },
          {
            title: '4. 분석 및 광고',
            body:
              '서비스 개선과 운영을 위해 분석 및 광고 제공자를 사용할 수 있습니다. 해당 제공자는 자체 정책에 따라 쿠키, 기기 정보, IP 주소, 사용 이벤트를 처리할 수 있습니다.',
          },
          {
            title: '5. 보관 및 삭제',
            body:
              '기기 내 데이터는 사용자가 삭제하거나 저장을 끌 때까지 브라우저에 남습니다. 클라우드 데이터 및 계정 삭제 요청은 지원 이메일로 보낼 수 있습니다.',
          },
          {
            title: '6. 문의',
            body: `개인정보 문의 또는 삭제 요청은 ${CONTACT_EMAIL} 로 보내주세요.`,
          },
        ],
        contactTitle: '문의',
        contactBodyPrefix: '지원, 개인정보, 제품 문의는 ',
        contactBodySuffix: ' 로 보내주세요.',
      },
      refund: {
        eyebrow: '환불',
        title: '환불 정책',
        lead: 'Paddle을 통해 결제한 구매 및 구독 취소 요청이 어떻게 처리되는지 설명합니다.',
        effectiveDate: '시행일: 2026년 8월 12일',
        intro:
          '현재 개발 환경의 Paddle Sandbox 결제는 테스트 전용입니다. 본 정책은 Paddle Live 판매가 시작된 뒤 선물 계산기 Pro 월간·연간 구독의 취소와 환불 요청에 적용됩니다.',
        sections: [
          {
            title: '1. 판매 및 결제 주체',
            body:
              'Live 판매가 시작되면 선물 계산기 Pro 구독은 Paddle을 통해 판매됩니다. Paddle은 온라인 재판매자이자 Merchant of Record로서 구매자 거래, 결제, 관련 세금, 송장과 영수증, 결제 지원 및 환불을 처리합니다.',
            links: [
              { label: 'Paddle 구매자 약관', href: 'https://www.paddle.com/legal/buyer-terms' },
              { label: 'Paddle 환불 정책', href: 'https://www.paddle.com/legal/refund-policy' },
            ],
          },
          {
            title: '2. 환불 요청 방법',
            body: `구매 확인 이메일의 지원 링크 또는 paddle.net의 Paddle 주문 지원을 이용하세요. 제품 접근이나 기능 문제는 ${CONTACT_EMAIL} 로 문의할 수 있으며, 필요한 경우 Paddle 지원 경로를 안내합니다.`,
            links: [{ label: 'Paddle 주문 지원', href: 'https://paddle.net/' }],
          },
          {
            title: '3. 환불 가능 여부',
            body:
              '법령이 환불을 요구하거나 Paddle이 개별 사정을 검토해 승인하는 경우를 제외하면 결제는 원칙적으로 환불되지 않습니다. Paddle은 구매자의 지역에 적용되는 법률, 구매 시점, 이용 내역과 요청 사유를 바탕으로 요청을 심사합니다. 본 정책은 구매자 거주지의 강행 소비자보호법에 따른 철회·환불 권리를 제한하지 않습니다.',
          },
          {
            title: '4. 구독 취소와 환불의 차이',
            body:
              '구독을 취소하면 다음 자동 갱신이 중단되며, 별도 안내가 없는 한 이미 결제한 기간이 끝날 때까지 Pro 기능을 이용할 수 있습니다. 구독 취소가 현재 결제 기간의 자동 환불을 의미하지는 않습니다. 환불이 필요하면 별도로 Paddle 주문 지원에 요청해야 합니다.',
          },
          {
            title: '5. 승인된 환불과 서비스 접근',
            body:
              '환불이 승인되면 Paddle은 가능한 경우 원래 결제 수단으로 처리합니다. 실제 입금 시점은 은행과 카드사에 따라 달라질 수 있습니다. Paddle이 환불 완료를 확인하면 해당 거래로 부여된 Pro 접근 권한은 종료됩니다. 부분 환불이나 법령상 별도 처리가 필요한 경우에는 Paddle의 결정과 안내를 따릅니다.',
          },
          {
            title: '6. 제품 지원',
            body: `계정 접근, 계산기 동작 또는 Pro 기능 문제는 ${CONTACT_EMAIL} 로 알려주세요. 환불 요청과 별개로 기술 문제 해결을 지원합니다.`,
          },
        ],
        contactTitle: '문의',
        contactBodyPrefix: '지원, 개인정보, 제품 문의는 ',
        contactBodySuffix: ' 로 보내주세요.',
      },
    },
  },
}

function PublicPageShell({
  eyebrow,
  title,
  lead,
  backLabel,
  copyright,
  children,
}: PublicPageShellProps) {
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.dataset.zone = 'about'
    return () => {
      delete document.documentElement.dataset.zone
    }
  }, [])

  return (
    <div className="about-zone public-review-zone">
      <header className="about-header">
        <div className="about-header__top">
          <button type="button" className="about-header__back" onClick={() => navigate('/')}>
            {backLabel}
          </button>
          <div className="about-header__actions">
            <LanguageToggle variant="header" />
            <AuthButton variant="header" />
          </div>
        </div>

        <div className="about-header__brand">
          <div className="about-header__meta">
            <p className="about-header__company">Farfield Software</p>
            <p className="about-header__label">{eyebrow}</p>
          </div>
          <h1 className="about-header__headline">{title}</h1>
          <p className="about-header__lead">{lead}</p>
        </div>
      </header>

      <main className="about-main public-review-main">{children}</main>

      <footer className="about-footer">
        <p className="about-footer__copy">{copyright}</p>
        <LegalLinks variant="footer" />
      </footer>
    </div>
  )
}

function InfoPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="about-panel public-review-panel">
      <h2 className="about-panel__title">{title}</h2>
      {children}
    </section>
  )
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p className="about-panel__paragraph">{children}</p>
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

function LegalSectionLinks({
  links,
  className,
}: {
  links?: { label: string; href: string }[]
  className: string
}) {
  if (!links?.length) return null

  return (
    <p className={className}>
      {links.map((link, index) => (
        <span key={link.href}>
          {index > 0 && ' · '}
          <a href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        </span>
      ))}
    </p>
  )
}

export function ProductReviewPage() {
  const { locale } = useLanguage()
  const copy = publicReviewCopy[locale]
  const product = copy.product

  return (
    <PublicPageShell
      eyebrow={product.eyebrow}
      title={product.title}
      lead={product.lead}
      backLabel={copy.backLabel}
      copyright={copy.copyright}
    >
      {product.panels.map((panel) => (
        <InfoPanel key={panel.title} title={panel.title}>
          {panel.body && <Paragraph>{panel.body}</Paragraph>}
          {panel.items && <BulletList items={panel.items} />}
        </InfoPanel>
      ))}
    </PublicPageShell>
  )
}

export function PricingReviewPage() {
  const { locale } = useLanguage()
  const copy = publicReviewCopy[locale]
  const pricing = copy.pricing

  return (
    <PublicPageShell
      eyebrow={pricing.eyebrow}
      title={pricing.title}
      lead={pricing.lead}
      backLabel={copy.backLabel}
      copyright={copy.copyright}
    >
      <div className="public-price-grid">
        {pricing.plans.map((plan) => (
          <InfoPanel key={plan.title} title={plan.title}>
            <p className="public-review-price">{plan.price}</p>
            <Paragraph>{plan.body}</Paragraph>
          </InfoPanel>
        ))}
      </div>

      <InfoPanel title={pricing.billingTitle}>
        <BulletList items={pricing.billingItems} />
      </InfoPanel>
    </PublicPageShell>
  )
}

export function PublicLegalPage({ kind }: { kind: LegalPageKind }) {
  const { locale } = useLanguage()
  const copy = publicReviewCopy[locale]
  const doc = copy.legal[kind]

  if (kind === 'terms' || kind === 'privacy') {
    const activePath = kind === 'terms' ? TERMS_PATH : PRIVACY_PATH

    return (
      <PublicInfoShell
        activePath={activePath}
        tone="legal"
        eyebrow={doc.eyebrow}
        title={doc.title}
        lead={doc.lead}
      >
        <div className="public-legal-document">
          <p className="public-legal-effective">{doc.effectiveDate}</p>
          <p className="public-legal-intro">{doc.intro}</p>
          <div className="public-legal-sections">
            {doc.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                <LegalSectionLinks links={section.links} className="public-legal-section-links" />
              </section>
            ))}
          </div>

          <section className="public-legal-contact">
            <h2>{doc.contactTitle}</h2>
            <p>
              {doc.contactBodyPrefix}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              {doc.contactBodySuffix}
            </p>
          </section>
          <BackToCalculatorLink className="public-legal-home" />
        </div>
      </PublicInfoShell>
    )
  }

  return (
    <PublicPageShell
      eyebrow={doc.eyebrow}
      title={doc.title}
      lead={doc.lead}
      backLabel={copy.backLabel}
      copyright={copy.copyright}
    >
      <article className="about-panel public-review-panel legal-document-page">
        <p className="legal-document-meta">{doc.effectiveDate}</p>
        <Paragraph>{doc.intro}</Paragraph>
        <div className="legal-articles public-legal-articles">
          {doc.sections.map((section) => (
            <section key={section.title} className="legal-article">
              <h2 className="legal-article__title">{section.title}</h2>
              <p className="legal-article__body">{section.body}</p>
              <LegalSectionLinks links={section.links} className="legal-article__body" />
            </section>
          ))}
        </div>
      </article>

      <InfoPanel title={doc.contactTitle}>
        <Paragraph>
          {doc.contactBodyPrefix}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {doc.contactBodySuffix}
        </Paragraph>
      </InfoPanel>
    </PublicPageShell>
  )
}
