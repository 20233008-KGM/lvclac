import {
  PUBLIC_OPERATOR_INFO,
  publicRepresentativeDisplayName,
} from '../config/operator'
import { ABOUT_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

const companyCopy = {
  ko: {
    eyebrow: 'Farfield Software · 회사 소개',
    title: '소수에게, 오래 쓰이는 소프트웨어를',
    lead:
      'Farfield Software는 많은 사람이 잠깐 쓰는 제품보다, 필요한 사람이 오래 믿고 쓰는 소프트웨어를 만듭니다. 실제 문제를 세심하게 이해하고, 작지만 분명한 개선을 꾸준히 쌓아갑니다.',
    workTitle: '우리가 하는 일',
    workBody:
      '특정한 사람과 실제 업무 흐름에 깊이 맞는 소프트웨어를 설계하고 개발합니다. 금융 도구에만 머무르지 않고, 반복되는 판단과 복잡한 작업을 더 정확하고 편안하게 만드는 제품을 만들어 갑니다.',
    directionTitle: '우리가 향하는 곳',
    directionBody:
      '제품의 수나 가입자 규모보다, 사용자가 더 오래 편하게 쓸 수 있는지를 중요하게 봅니다. 작은 팀의 집중력을 바탕으로 서로 다른 분야에서 오래 남는 소프트웨어를 하나씩 쌓아가는 것이 우리의 방향입니다.',
    principlesTitle: '제품을 만드는 방식',
    principles: [
      {
        title: '필요한 문제부터',
        body: '유행이나 기능 수보다, 실제로 반복되는 불편과 꼭 필요한 흐름에서 시작합니다.',
      },
      {
        title: '넓이보다 깊이',
        body: '모든 사람을 만족시키기보다, 필요한 사람에게 정확히 맞는 경험을 깊게 다듬습니다.',
      },
      {
        title: '있는 것을 더 좋게',
        body: '새 기능을 늘리기 전에 이미 있는 것을 더 빠르고 안정적이며 이해하기 쉽게 만듭니다.',
      },
    ],
    currentProductBody:
      'LiqGuard는 Farfield Software의 첫 제품입니다. 선물 포지션의 청산 위험과 증거금 변화를 검토하는 도구이며, 앞으로 더 다양한 분야의 소프트웨어로 확장해 가는 출발점입니다.',
    productLink: 'LiqGuard 서비스 소개 보기',
    stewardshipTitle: '운영과 책임',
    stewardshipBody:
      'Farfield Software는 작은 팀으로 제품의 기획, 설계, 개발과 운영을 가까이 연결합니다. 제품과 기능의 수를 빠르게 늘리기보다, 만든 소프트웨어를 오래 책임지고 꾸준히 개선하는 방식을 택합니다.',
    makerRole: '대표',
    contactTitle: '문의하기',
    contactBody: '제품, 협업과 회사에 관한 문의는 이메일로 보내 주세요.',
  },
  en: {
    eyebrow: 'Farfield Software · About us',
    title: 'Software made to last for the people who need it.',
    lead:
      'Farfield Software builds software that a smaller group of people can rely on for a long time—not products everyone tries once. We study real problems closely and keep adding small, meaningful improvements.',
    workTitle: 'What we do',
    workBody:
      'We design and build software around specific people and real workflows. Our work is not limited to financial tools; we create products that make repeated decisions and complex work more accurate and easier to manage.',
    directionTitle: 'Where we are going',
    directionBody:
      'We value lasting usefulness over product count or signup volume. As a focused small team, our direction is to build durable software across different fields, one product at a time.',
    principlesTitle: 'How we build',
    principles: [
      {
        title: 'Start with a real need',
        body: 'We begin with recurring friction and necessary workflows, not trends or feature counts.',
      },
      {
        title: 'Depth over reach',
        body: 'Instead of trying to serve everyone, we refine the experience deeply for the people who need it.',
      },
      {
        title: 'Improve what exists',
        body: 'Before adding more, we make what already exists faster, more reliable, and easier to understand.',
      },
    ],
    currentProductBody:
      'LiqGuard is Farfield Software’s first product. It helps review futures liquidation risk and margin changes, and marks the starting point of a broader software portfolio across different fields.',
    productLink: 'Learn about LiqGuard',
    stewardshipTitle: 'Ownership and responsibility',
    stewardshipBody:
      'Farfield Software is a small team that keeps product planning, design, development, and operation closely connected. Rather than rapidly increasing products and features, we take long-term responsibility for the software we build and improve it continuously.',
    makerRole: 'CEO',
    contactTitle: 'Contact',
    contactBody: 'For product, collaboration, or company inquiries, contact us by email.',
  },
} as const

export function CompanyPage() {
  const { locale } = useLanguage()
  const navigate = useNavigate()
  const copy = companyCopy[locale]
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
            <h2>{copy.workTitle}</h2>
            <p>{copy.workBody}</p>
          </section>
          <section className="company-section">
            <h2>{copy.directionTitle}</h2>
            <p>{copy.directionBody}</p>
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

        <section className="company-current-product" aria-label={PUBLIC_OPERATOR_INFO.productName}>
          <div>
            <p className="company-current-product__name">{PUBLIC_OPERATOR_INFO.productName}</p>
            <p className="company-current-product__body">{copy.currentProductBody}</p>
          </div>
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

        {representative && (
          <section className="company-stewardship" aria-labelledby="company-stewardship-title">
            <div className="company-stewardship__copy">
              <h2 id="company-stewardship-title">{copy.stewardshipTitle}</h2>
              <p>{copy.stewardshipBody}</p>
            </div>
            <p className="company-stewardship__signature">
              <strong>{representative}</strong>
              <span aria-hidden="true">·</span>
              <span>{copy.makerRole}</span>
            </p>
          </section>
        )}

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
