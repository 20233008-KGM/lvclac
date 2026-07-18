import {
  PUBLIC_OPERATOR_INFO,
  publicFooterOperatorDetails,
} from '../config/operator'
import { useLanguage } from '../i18n'
import { PublicInfoShell } from './PublicInfoShell'

const companyCopy = {
  ko: {
    eyebrow: 'Farfield Software · 회사 소개',
    title: 'LiqGuard를 만드는 Farfield Software',
    lead: 'Farfield Software는 LiqGuard를 만들고 운영합니다.',
    overviewTitle: '회사와 서비스',
    overviewBody:
      '거래 전 필요한 계산을 더 빠르고 명확하게 확인할 수 있도록, 복잡한 숫자와 계산 흐름을 이해하기 쉬운 도구로 정리합니다.',
    principlesTitle: '운영 원칙',
    principlesBody:
      '계산 기준을 투명하게 공개하고, 사용자가 입력한 정보와 선택을 존중하며, 실제 거래 판단에 앞서 다시 확인할 수 있는 정보를 제공합니다.',
    detailsTitle: '회사 정보',
    contactTitle: '문의하기',
    contactBody: '서비스와 회사에 관한 문의는 이메일로 보내 주세요.',
  },
  en: {
    eyebrow: 'Farfield Software · About us',
    title: 'The company behind LiqGuard',
    lead: 'Farfield Software builds and operates LiqGuard.',
    overviewTitle: 'Company and service',
    overviewBody:
      'We turn complex numbers and calculation workflows into approachable tools so traders can review essential figures more quickly and clearly.',
    principlesTitle: 'How we operate',
    principlesBody:
      'We publish calculation assumptions, respect user inputs and choices, and provide information that can be checked again before real trading decisions.',
    detailsTitle: 'Company information',
    contactTitle: 'Contact',
    contactBody: 'For questions about the service or company, contact us by email.',
  },
} as const

export function CompanyPage() {
  const { locale } = useLanguage()
  const copy = companyCopy[locale]
  const operatorDetails = publicFooterOperatorDetails(locale)

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
        <div className="company-sections">
          <section className="company-section">
            <h2>{copy.overviewTitle}</h2>
            <p>{copy.overviewBody}</p>
          </section>
          <section className="company-section">
            <h2>{copy.principlesTitle}</h2>
            <p>{copy.principlesBody}</p>
          </section>
        </div>

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
