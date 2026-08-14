import { FORMULAS_PATH, GUIDE_PATH, localizedPublicPath } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import '../styles/publicSeo.css'

const copy = {
  ko: {
    home: {
      title: '선물 청산가 계산기로 확인할 수 있는 것',
      paragraphs: [
        '계좌 평가금액, 현재가, 보유 계약수, 계약승수와 증거금 정보를 입력하면 예상 청산가, 증거금 여유, 레버리지와 주문 이후 변화를 한 화면에서 비교할 수 있습니다.',
        '종목선물(주식선물)·지수선물·상품선물(원자재선물)의 단일 종목 포지션을 검토하는 참고용 도구입니다. 실제 청산 기준, 수수료와 반올림 방식은 거래소·증권사·브로커 규정을 함께 확인해야 합니다.',
      ],
      guideLink: 'LiqGuard 사용 가이드',
      formulasLink: '청산가·증거금 계산 공식',
    },
    guide: {
      title: '계산 기준도 함께 확인하세요',
      body: '입력값이 예상 청산가와 증거금 여유에 어떻게 반영되는지 수식과 용어 정의에서 확인할 수 있습니다.',
      link: '청산가·증거금 계산 공식 보기',
    },
    formulas: {
      title: '수식을 실제 입력에 적용해 보세요',
      body: '필수 입력값과 주문 시뮬레이션 순서를 먼저 익히면 계산식이 화면 결과로 이어지는 과정을 쉽게 확인할 수 있습니다.',
      link: 'LiqGuard 사용 가이드 보기',
    },
    calculatorLink: '선물 청산가 계산기 열기',
  },
  en: {
    home: {
      title: 'What the futures liquidation calculator shows',
      paragraphs: [
        'Enter account equity, current price, open contracts, contract multiplier, and margin inputs to compare estimated liquidation price, margin headroom, leverage, and post-order changes in one view.',
        'LiqGuard is a reference tool for reviewing a single-stock, index, or commodity futures position. Always compare the result with the exchange, broker, or platform rules for liquidation, fees, and rounding.',
      ],
      guideLink: 'LiqGuard user guide',
      formulasLink: 'Liquidation price and margin formulas',
    },
    guide: {
      title: 'Review the calculation rules',
      body: 'See how each input flows into estimated liquidation price and margin headroom in the formula and terminology reference.',
      link: 'View liquidation price and margin formulas',
    },
    formulas: {
      title: 'Apply the formulas to calculator inputs',
      body: 'Start with the required inputs and order simulation steps to connect each formula to the result shown in the calculator.',
      link: 'View the LiqGuard user guide',
    },
    calculatorLink: 'Open the futures liquidation calculator',
  },
} as const

function InternalLink({ href, children }: { href: string; children: string }) {
  const navigate = useNavigate()
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault()
        navigate(href)
      }}
    >
      {children}
    </a>
  )
}

export function PublicHomeSeoSummary() {
  const { locale } = useLanguage()
  const content = copy[locale].home

  return (
    <section className="public-seo-summary" aria-labelledby="public-seo-summary-title">
      <h2 id="public-seo-summary-title">{content.title}</h2>
      {content.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <nav className="public-seo-links" aria-label={content.title}>
        <InternalLink href={localizedPublicPath(GUIDE_PATH, locale)}>{content.guideLink}</InternalLink>
        <InternalLink href={localizedPublicPath(FORMULAS_PATH, locale)}>{content.formulasLink}</InternalLink>
      </nav>
    </section>
  )
}

export function PublicDocumentNext({ current }: { current: 'guide' | 'formulas' }) {
  const { locale } = useLanguage()
  const content = copy[locale][current]
  const target = localizedPublicPath(
    current === 'guide' ? FORMULAS_PATH : GUIDE_PATH,
    locale,
  )

  return (
    <aside className="public-document-next" aria-labelledby={`public-${current}-next-title`}>
      <h2 id={`public-${current}-next-title`}>{content.title}</h2>
      <p>{content.body}</p>
      <div className="public-seo-links">
        <InternalLink href={target}>{content.link}</InternalLink>
        <InternalLink href={localizedPublicPath('/', locale)}>{copy[locale].calculatorLink}</InternalLink>
      </div>
    </aside>
  )
}
