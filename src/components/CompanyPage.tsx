import {
  PUBLIC_OPERATOR_INFO,
  publicFooterOperatorDetails,
  publicRepresentativeDisplayName,
} from '../config/operator'
import { ABOUT_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

const companyCopy = {
  ko: {
    eyebrow: 'Farfield Software · 회사 소개',
    title: '복잡한 금융 계산을 더 명확한 도구로 만듭니다',
    lead:
      'Farfield Software는 거래자가 레버리지와 청산 위험을 이해하도록 돕는 소프트웨어를 만들며, 첫 제품으로 LiqGuard를 운영합니다.',
    problemTitle: '우리가 푸는 문제',
    problemBody:
      '레버리지 거래에서는 가격, 증거금, 포지션 변화가 서로 맞물려 움직입니다. Farfield Software는 판단에 필요한 숫자를 한눈에 이해하고 다시 확인할 수 있도록 복잡한 계산 흐름을 정리합니다.',
    productTitle: '우리가 만드는 것',
    productBody:
      'LiqGuard는 선물 포지션의 예상 청산가와 증거금 변화를 계산하고, 주문 전후의 영향을 비교할 수 있도록 돕는 브라우저 기반 도구입니다.',
    productLink: 'LiqGuard 서비스 소개 보기',
    principlesTitle: '제품을 만드는 기준',
    principles: [
      {
        title: '명확한 근거',
        body: '결과만 보여주지 않고 계산 기준과 수식을 함께 공개합니다.',
      },
      {
        title: '사용자의 선택',
        body: '공개 계산기는 계정 없이 사용할 수 있으며, 저장과 개인정보 설정은 사용자가 직접 선택합니다.',
      },
      {
        title: '작고 완성도 높게',
        body: '기능 수보다 자주 쓰는 계산 흐름의 속도, 일관성, 이해하기 쉬움을 우선합니다.',
      },
    ],
    makerTitle: '만드는 사람',
    makerRole: '대표',
    detailsTitle: '회사 정보',
    contactTitle: '문의하기',
    contactBody: '서비스와 회사에 관한 문의는 이메일로 보내 주세요.',
  },
  en: {
    eyebrow: 'Farfield Software · About us',
    title: 'We make complex financial calculations easier to understand.',
    lead:
      'Farfield Software builds software that helps traders understand leverage and liquidation risk. LiqGuard is our first product.',
    problemTitle: 'The problem we work on',
    problemBody:
      'In leveraged trading, price, margin, and position changes move together. We organize complex calculation flows so the numbers behind a decision are easier to understand and review.',
    productTitle: 'What we build',
    productBody:
      'LiqGuard is a browser-based tool that helps futures traders estimate liquidation prices, understand margin changes, and compare the effects of an order.',
    productLink: 'Learn about LiqGuard',
    principlesTitle: 'How we build',
    principles: [
      {
        title: 'Clear foundations',
        body: 'We publish calculation assumptions and formulas, not just results.',
      },
      {
        title: 'User choice',
        body: 'The public calculator works without an account, while saving and privacy settings remain the user’s choice.',
      },
      {
        title: 'Craft over breadth',
        body: 'We prioritize speed, consistency, and clarity in the calculation workflows traders use most.',
      },
    ],
    makerTitle: 'Leadership',
    makerRole: 'CEO',
    detailsTitle: 'Company information',
    contactTitle: 'Contact',
    contactBody: 'For questions about the service or company, contact us by email.',
  },
} as const

export function CompanyPage() {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const copy = companyCopy[locale]
  const operatorDetails = publicFooterOperatorDetails(locale)
  const representative = publicRepresentativeDisplayName(locale)

  return (
    <PublicInfoShell
      activePath={null}
      tone="company"
      eyebrow={copy.eyebrow}
      title={copy.title}
      lead={copy.lead}
      showNavigation={false}
    >
      <div className="company-main">
        <div className="company-editorial">
          <section className="company-section">
            <h2>{copy.problemTitle}</h2>
            <p>{copy.problemBody}</p>
          </section>
          <section className="company-section">
            <h2>{copy.productTitle}</h2>
            <p>{copy.productBody}</p>
            <a
              className="company-product-link"
              href={ABOUT_PATH}
              onClick={(event) => {
                event.preventDefault()
                navigate(ABOUT_PATH)
              }}
            >
              {copy.productLink}
              <span aria-hidden="true">→</span>
            </a>
          </section>
        </div>

        <section className="company-principles" aria-labelledby="company-principles-title">
          <h2 id="company-principles-title">{copy.principlesTitle}</h2>
          <ul className="company-principles__list">
            {copy.principles.map((principle) => (
              <li key={principle.title}>
                <h3>{principle.title}</h3>
                <p>{principle.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {representative && (
          <section className="company-maker" aria-labelledby="company-maker-title">
            <h2 id="company-maker-title">{copy.makerTitle}</h2>
            <p>
              <strong>{representative}</strong>
              <span aria-hidden="true">·</span>
              <span>{copy.makerRole}</span>
            </p>
          </section>
        )}

        <section className="company-details" aria-labelledby="company-details-title">
          <h2 id="company-details-title">{copy.detailsTitle}</h2>
          <dl className="company-details__grid">
            {operatorDetails.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="about-contact">
          <div className="about-contact__copy">
            <h2 className="about-contact__title">{copy.contactTitle}</h2>
            <p className="about-contact__body">{copy.contactBody}</p>
          </div>
          <a href={`mailto:${PUBLIC_OPERATOR_INFO.contactEmail}`}>
            {PUBLIC_OPERATOR_INFO.contactEmail}
          </a>
        </section>
      </div>
    </PublicInfoShell>
  )
}
