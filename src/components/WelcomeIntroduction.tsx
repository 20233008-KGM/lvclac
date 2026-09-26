import { useLanguage } from '../i18n'
import { formatTolerancePercent } from '../utils/format'
import { TrustModalFrame } from './TrustModalFrame'
import { welcomeIntroductionExample, welcomeIntroductionPosition } from './welcomeIntroductionExample'
import '../styles/welcomeIntroduction.css'

const copy = {
  ko: {
    title: 'LiqGuard에 오신 것을 환영합니다',
    intro: '청산 위험과 주문 변화를 입력 즉시 확인하세요.',
    position: 'S&P 500 마이크로 선물 · 가상 포지션',
    holding: '포지션', long: '롱', contracts: '계약',
    price: '진입/현재 (pt)', equity: '평가금',
    maintenance: '유지증거금',
    tolerance: '청산 여유', liquidation: '예상 청산가 (pt)',
    comparisonTitle: '같은 가격에 1계약을 더 매수하면?',
    comparisonLabel: 'S&P 500 마이크로 선물 추가 매수 전후 비교',
    metric: '항목', before: '주문 전', after: '주문 후', liquidationRow: '예상 청산가 (pt)',
    takeaway: '주문 전에, 줄어드는 청산 여유를 확인하세요.',
    start: '내 포지션 계산하기',
  },
  en: {
    title: 'Welcome to LiqGuard',
    intro: 'See liquidation risk and order impact instantly.',
    position: 'Micro S&P 500 futures · Example position',
    holding: 'Position', long: 'Long', contracts: '',
    price: 'Entry/current (pt)', equity: 'Equity',
    maintenance: 'Maint. margin',
    tolerance: 'Liquidation buffer', liquidation: 'Liquidation price (pt)',
    comparisonTitle: 'What if you buy 1 more at the same price?',
    comparisonLabel: 'S&P 500 Micro E-mini futures before and after buying one more contract',
    metric: 'Metric', before: 'Before', after: 'After', liquidationRow: 'Liq. price (pt)',
    takeaway: 'See how an order changes your buffer before placing it.',
    start: 'Calculate my position',
  },
} as const

export function WelcomeIntroduction({ onClose }: { onClose: () => void }) {
  const { locale } = useLanguage()
  const c = copy[locale]
  const { before, after } = welcomeIntroductionExample
  const number = (value: number | null) => value === null ? '—' : value.toLocaleString(locale, { maximumFractionDigits: 1 })
  const buffer = (value: number | null) => {
    const formatted = formatTolerancePercent(value, 'long', 1)
    return formatted === '-' ? formatted : `${formatted}%`
  }
  const position = welcomeIntroductionPosition

  return (
    <TrustModalFrame
      variant="introduction"
      titleId="welcome-introduction-title"
      descriptionId="welcome-introduction-description"
      title={c.title}
      intro={c.intro}
      onRequestClose={onClose}
      footer={(
        <button type="button" className="btn btn-primary welcome-introduction__start" onClick={onClose}>
          {c.start}
        </button>
      )}
    >
      <section className="welcome-introduction__example" aria-label={c.position}>
        <table className="welcome-introduction__position">
          <caption>{c.position}</caption>
          <colgroup>
            <col className="welcome-introduction__holding-column" />
            <col className="welcome-introduction__equity-column" />
            <col className="welcome-introduction__price-column" />
            <col className="welcome-introduction__margin-column" />
          </colgroup>
          <thead>
            <tr>
              <th id="welcome-position-holding" scope="col">{c.holding}</th>
              <th id="welcome-position-equity" scope="col">{c.equity}</th>
              <th id="welcome-position-price" scope="col">{c.price}</th>
              <th id="welcome-position-maintenance" scope="col">{c.maintenance}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td headers="welcome-position-holding">{c.long} {position.contracts}{c.contracts}</td>
              <td headers="welcome-position-equity">${number(position.equity)}</td>
              <td headers="welcome-position-price">{number(position.entryPrice)} / {number(position.currentPrice)}</td>
              <td headers="welcome-position-maintenance">${number(position.maintenancePerContract * position.contracts)}</td>
            </tr>
          </tbody>
        </table>
        <div className="result-hero welcome-introduction__result">
          <div className="result-hero-card">
            <span className="result-hero-label">{c.tolerance}</span>
            <span className="result-hero-value">{buffer(before.toleranceRate)}</span>
          </div>
          <div className="result-hero-card">
            <span className="result-hero-label">{c.liquidation}</span>
            <span className="result-hero-value">{number(before.liquidationPrice)}</span>
          </div>
        </div>
        <div className="welcome-introduction__comparison">
          <h3>{c.comparisonTitle}</h3>
          <table className="result-sheet" aria-label={c.comparisonLabel}>
            <colgroup><col className="welcome-introduction__metric" /><col /><col /></colgroup>
            <thead>
              <tr>
                <th scope="col">{c.metric}</th>
                <th scope="col">{c.before}</th>
                <th scope="col">{c.after}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{c.tolerance}</th>
                <td aria-label={`${c.before}: ${buffer(before.toleranceRate)}`}>{buffer(before.toleranceRate)}</td>
                <td className="welcome-introduction__after" aria-label={`${c.after}: ${buffer(after.toleranceRate)}`}>{buffer(after.toleranceRate)}</td>
              </tr>
              <tr>
                <th scope="row">{c.liquidationRow}</th>
                <td aria-label={`${c.before}: ${number(before.liquidationPrice)}pt`}>{number(before.liquidationPrice)}</td>
                <td className="welcome-introduction__after" aria-label={`${c.after}: ${number(after.liquidationPrice)}pt`}>{number(after.liquidationPrice)}</td>
              </tr>
            </tbody>
          </table>
          <p className="welcome-introduction__takeaway">{c.takeaway}</p>
        </div>
      </section>
    </TrustModalFrame>
  )
}
