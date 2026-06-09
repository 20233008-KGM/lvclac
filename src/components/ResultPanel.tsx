import type { CalculatorMode, EvaluateResult, OrderResult, PositionSide } from '../types'
import { useLanguage } from '../i18n'
import { formatNumber, formatPercent, formatToleranceDelta } from '../utils/format'

interface ResultPanelProps {
  mode: CalculatorMode
  positionSide: PositionSide
  evaluateResult: EvaluateResult
  orderResult: OrderResult
}

function ResultHero({
  label,
  value,
  sub,
  danger,
}: {
  label: string
  value: string
  sub?: string | null
  danger?: boolean
}) {
  return (
    <div className={`result-hero-card ${danger ? 'danger' : ''}`}>
      <span className="result-hero-label">{label}</span>
      <span className="result-hero-value">{value}</span>
      {sub && <span className="result-hero-sub">{sub}</span>}
    </div>
  )
}

function ResultRow({
  label,
  value,
  sub,
  danger,
}: {
  label: string
  value: string
  sub?: string | null
  danger?: boolean
}) {
  return (
    <div className={`result-row ${danger ? 'danger' : ''}`}>
      <div className="result-row-main">
        <span className="result-row-label">{label}</span>
        <span className="result-row-value">{value}</span>
      </div>
      {sub && <span className="result-row-sub">{sub}</span>}
    </div>
  )
}

function EvaluateResults({
  result,
  positionSide,
}: {
  result: EvaluateResult
  positionSide: PositionSide
}) {
  const { t, translateCalcMessage } = useLanguage()
  const r = t.results
  const isLong = positionSide === 'long'
  const toleranceLabel = isLong ? r.toleranceLong : r.toleranceShort
  const toleranceDeltaLabel = isLong ? r.toleranceDeltaLong : r.toleranceDeltaShort
  const toleranceValue =
    result.toleranceRate !== null ? formatPercent(result.toleranceRate) : '-'

  return (
    <>
      <div className="result-hero">
        <ResultHero
          label={r.liquidationPrice}
          value={
            result.liquidationPrice !== null
              ? formatNumber(result.liquidationPrice)
              : '-'
          }
          sub={translateCalcMessage(result.liquidationMessage)}
          danger={result.isAtRisk}
        />
        <ResultHero
          label={toleranceLabel}
          value={toleranceValue}
          sub={result.isAtRisk ? translateCalcMessage('at_risk') : null}
          danger={result.isAtRisk}
        />
        <ResultHero
          label={r.maxBuyable}
          value={
            result.maxBuyable !== null
              ? `${result.maxBuyable} ${t.contractsUnit}`
              : '-'
          }
          sub={translateCalcMessage(result.maxBuyableMessage)}
        />
      </div>
      <div className="result-table">
        <ResultRow
          label={r.maintenanceMargin}
          value={formatNumber(result.margins?.maintenanceMargin ?? null)}
        />
        <ResultRow
          label={r.contractNotional}
          value={formatNumber(result.margins?.contractNotional ?? null)}
        />
        <ResultRow
          label={r.entrustedMargin}
          value={formatNumber(result.margins?.entrustedMargin ?? null)}
        />
        <ResultRow
          label={r.availableMargin}
          value={formatNumber(result.margins?.availableMargin ?? null)}
          sub={r.availableMarginSub}
        />
        <ResultRow
          label={r.perContractEntrusted}
          value={formatNumber(result.margins?.perContractEntrusted ?? null)}
        />
        <ResultRow
          label={r.perContractMaintenance}
          value={formatNumber(result.margins?.perContractMaintenance ?? null)}
        />
        <ResultRow
          label={toleranceDeltaLabel}
          value={formatToleranceDelta(result.toleranceDelta, positionSide)}
          danger={result.isAtRisk}
        />
      </div>
    </>
  )
}

function OrderResults({
  result,
  positionSide,
}: {
  result: OrderResult
  positionSide: PositionSide
}) {
  const { t, translateCalcMessage } = useLanguage()
  const r = t.results
  const isLong = positionSide === 'long'
  const toleranceLabel = isLong ? r.toleranceLong : r.toleranceShort
  const toleranceDeltaLabel = isLong ? r.toleranceDeltaLong : r.toleranceDeltaShort

  const deltaLabel =
    result.liquidationDelta !== null
      ? `${result.liquidationDelta >= 0 ? '+' : ''}${formatNumber(result.liquidationDelta)}`
      : '-'

  return (
    <>
      <div className="result-hero">
        <ResultHero
          label={r.beforeLiquidation}
          value={
            result.beforeLiquidation !== null
              ? formatNumber(result.beforeLiquidation)
              : '-'
          }
          danger={result.isAtRiskBefore}
        />
        <ResultHero
          label={r.afterLiquidation}
          value={
            result.afterLiquidation !== null
              ? formatNumber(result.afterLiquidation)
              : '-'
          }
          sub={translateCalcMessage(result.orderMessage)}
          danger={result.isAtRiskAfter}
        />
        <ResultHero label={r.liquidationDelta} value={deltaLabel} />
      </div>
      <div className="result-table">
        <ResultRow
          label={`${r.beforeTolerance} ${toleranceLabel}`}
          value={
            result.beforeTolerance !== null
              ? formatPercent(result.beforeTolerance)
              : '-'
          }
          sub={
            result.beforeToleranceDelta !== null
              ? `${toleranceDeltaLabel} ${formatToleranceDelta(result.beforeToleranceDelta, positionSide)}`
              : null
          }
          danger={result.isAtRiskBefore}
        />
        <ResultRow
          label={`${r.afterTolerance} ${toleranceLabel}`}
          value={
            result.afterTolerance !== null
              ? formatPercent(result.afterTolerance)
              : '-'
          }
          sub={
            result.isAtRiskAfter
              ? translateCalcMessage('at_risk')
              : result.afterToleranceDelta !== null
                ? `${toleranceDeltaLabel} ${formatToleranceDelta(result.afterToleranceDelta, positionSide)}`
                : null
          }
          danger={result.isAtRiskAfter}
        />
        <ResultRow
          label={r.afterMaintenance}
          value={formatNumber(result.afterMargins?.maintenanceMargin ?? null)}
        />
        <ResultRow
          label={r.afterEntrusted}
          value={formatNumber(result.afterMargins?.entrustedMargin ?? null)}
        />
        <ResultRow
          label={r.afterAvailable}
          value={formatNumber(result.afterMargins?.availableMargin ?? null)}
          sub={r.availableMarginSub}
        />
        <ResultRow
          label={r.afterPerEntrusted}
          value={formatNumber(result.afterMargins?.perContractEntrusted ?? null)}
        />
        <ResultRow
          label={r.afterPerMaintenance}
          value={formatNumber(result.afterMargins?.perContractMaintenance ?? null)}
        />
      </div>
    </>
  )
}

export function ResultPanel({
  mode,
  positionSide,
  evaluateResult,
  orderResult,
}: ResultPanelProps) {
  const { t } = useLanguage()

  return (
    <section className="panel result-panel">
      <h2>{t.result}</h2>
      {mode === 'evaluate' ? (
        <EvaluateResults result={evaluateResult} positionSide={positionSide} />
      ) : (
        <OrderResults result={orderResult} positionSide={positionSide} />
      )}
    </section>
  )
}
