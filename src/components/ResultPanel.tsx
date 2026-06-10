import { useMemo } from 'react'
import { calculateEvaluate, calculateOrder, checkOrderExceedsMaxBuyable } from '../calc/leverage'
import { calcMargins, inputsReadyForEvaluate } from '../calc/margins'
import type { CalculatorInputs, EvaluateResult, OrderResult } from '../types'
import { maxAddableLabel } from '../utils/positionLabels'
import { FORMULAS_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { LegalEmphasis } from './ServiceDisclaimer'
import { NumberStepper } from './NumberStepper'
import {
  formatLeverageValue,
  formatNumber,
  formatToleranceDelta,
  formatTolerancePercent,
} from '../utils/format'

interface ResultPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
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

function ResultRowPair({
  left,
  right,
}: {
  left: { label: string; value: string }
  right: { label: string; value: string }
}) {
  return (
    <div className="result-row-pair">
      <ResultRow label={left.label} value={left.value} />
      <ResultRow label={right.label} value={right.value} />
    </div>
  )
}

function ResultSheet({
  indexHeader,
  beforeHeader,
  afterHeader,
  rows,
}: {
  indexHeader: string
  beforeHeader: string
  afterHeader: string
  rows: {
    index: string
    before: string
    after: string
    dangerBefore?: boolean
    dangerAfter?: boolean
  }[]
}) {
  return (
    <table className="result-sheet">
      <thead>
        <tr>
          <th scope="col">{indexHeader}</th>
          <th scope="col">{beforeHeader}</th>
          <th scope="col">{afterHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.index}>
            <th scope="row">{row.index}</th>
            <td className={row.dangerBefore ? 'danger' : undefined}>{row.before}</td>
            <td className={row.dangerAfter ? 'danger' : undefined}>{row.after}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EvaluateResults({ result }: { result: EvaluateResult }) {
  const { t, translateCalcMessage } = useLanguage()
  const r = t.results
  const side = result.positionSide
  const isLong = side === 'long'
  const toleranceLabel = isLong ? r.toleranceLong : r.toleranceShort
  const toleranceDeltaLabel = isLong ? r.toleranceDeltaLong : r.toleranceDeltaShort
  const toleranceValue = formatTolerancePercent(result.toleranceRate, side)

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
          label={maxAddableLabel(side, r)}
          value={formatNumber(result.maxBuyable ?? null)}
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
          label={r.leverageRatio}
          value={formatLeverageValue(result.leverageRatio)}
          sub={r.leverageSub}
        />
        <ResultRow
          label={r.entrustedMargin}
          value={formatNumber(result.margins?.entrustedMargin ?? null)}
        />
        <ResultRowPair
          left={{
            label: r.perContractMaintenance,
            value: formatNumber(result.margins?.perContractMaintenance ?? null),
          }}
          right={{
            label: r.perContractEntrusted,
            value: formatNumber(result.margins?.perContractEntrusted ?? null),
          }}
        />
        <ResultRow
          label={r.availableMargin}
          value={formatNumber(result.margins?.availableMargin ?? null)}
          sub={r.availableMarginSub}
        />
        <ResultRow
          label={r.maintenanceExcess}
          value={formatNumber(result.margins?.maintenanceExcess ?? null)}
          sub={r.maintenanceExcessSub}
          danger={result.isAtRisk}
        />
        <ResultRow
          label={toleranceDeltaLabel}
          value={formatToleranceDelta(result.toleranceDelta, side)}
          danger={result.isAtRisk}
        />
      </div>
    </>
  )
}

function OrderResults({
  result,
  orderBlocked,
}: {
  result: OrderResult
  orderBlocked: boolean
}) {
  const { t } = useLanguage()
  const r = t.results
  const side = result.positionSide
  const isLong = side === 'long'
  const toleranceLabel = isLong ? r.toleranceLong : r.toleranceShort
  const toleranceDeltaLabel = isLong ? r.toleranceDeltaLong : r.toleranceDeltaShort
  const afterAtRisk = !orderBlocked && result.isAtRiskAfter
  const hasAfter = result.afterMargins !== null && !orderBlocked

  const formatLiq = (value: number | null) =>
    value !== null ? formatNumber(value) : '-'

  const sheetRows = [
    {
      index: r.liquidationPrice,
      before: formatLiq(result.beforeLiquidation),
      after: hasAfter ? formatLiq(result.afterLiquidation) : '-',
      dangerBefore: result.isAtRiskBefore,
      dangerAfter: afterAtRisk,
    },
    {
      index: toleranceLabel,
      before: formatTolerancePercent(result.beforeTolerance, result.positionSide),
      after: formatTolerancePercent(result.afterTolerance, result.positionSide),
      dangerBefore: result.isAtRiskBefore,
      dangerAfter: afterAtRisk,
    },
    {
      index: toleranceDeltaLabel,
      before: formatToleranceDelta(result.beforeToleranceDelta, result.positionSide),
      after: formatToleranceDelta(result.afterToleranceDelta, result.positionSide),
      dangerBefore: result.isAtRiskBefore,
      dangerAfter: afterAtRisk,
    },
    {
      index: r.leverage,
      before: formatLeverageValue(result.beforeLeverageRatio),
      after: hasAfter
        ? formatLeverageValue(result.afterLeverageRatio)
        : '-',
    },
    {
      index: r.maintenanceMargin,
      before: formatNumber(result.beforeMargins?.maintenanceMargin ?? null),
      after: hasAfter
        ? formatNumber(result.afterMargins?.maintenanceMargin ?? null)
        : '-',
    },
    {
      index: r.maintenanceExcess,
      before: formatNumber(result.beforeMargins?.maintenanceExcess ?? null),
      after: hasAfter
        ? formatNumber(result.afterMargins?.maintenanceExcess ?? null)
        : '-',
      dangerBefore: result.isAtRiskBefore,
      dangerAfter: afterAtRisk,
    },
    {
      index: r.entrustedMargin,
      before: formatNumber(result.beforeMargins?.entrustedMargin ?? null),
      after: hasAfter
        ? formatNumber(result.afterMargins?.entrustedMargin ?? null)
        : '-',
    },
    {
      index: r.availableMargin,
      before: formatNumber(result.beforeMargins?.availableMargin ?? null),
      after: hasAfter
        ? formatNumber(result.afterMargins?.availableMargin ?? null)
        : '-',
      dangerAfter: afterAtRisk,
    },
  ]

  return (
    <ResultSheet
      indexHeader={r.sheetIndex}
      beforeHeader={r.sheetBefore}
      afterHeader={r.sheetAfter}
      rows={sheetRows}
    />
  )
}

export function ResultPanel({ inputs, onChange }: ResultPanelProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { orderContracts, positionSide } = inputs
  const f = t.fields

  const evaluateResult = useMemo(
    () => calculateEvaluate(inputs),
    [inputs, positionSide],
  )
  const orderResult = useMemo(
    () => calculateOrder(inputs),
    [inputs, positionSide, orderContracts],
  )

  const orderBlocked = useMemo(() => {
    if (!inputsReadyForEvaluate(inputs)) return false
    const marginResult = calcMargins(inputs, inputs.contracts)
    if (!marginResult) return false
    return (
      checkOrderExceedsMaxBuyable(
        orderContracts,
        inputs.accountEval!,
        marginResult.margins,
        positionSide,
      ) !== null
    )
  }, [inputs, orderContracts, positionSide])

  return (
    <div className="result-column">
      <section className="panel result-panel">
        <div className="result-panel__head">
          <h2>{t.result}</h2>
          <a
            className="result-panel__formulas-btn"
            href={FORMULAS_PATH}
            onClick={(event) => {
              event.preventDefault()
              navigate(FORMULAS_PATH)
            }}
          >
            {t.formulas.title}
          </a>
        </div>
        <EvaluateResults key={positionSide} result={evaluateResult} />
        <p className="result-panel__warning" role="note">
          <LegalEmphasis>{t.legal.resultMismatchWarning}</LegalEmphasis>
        </p>
      </section>

      <section className="panel result-panel result-panel--order">
        <h2>{t.modes.order}</h2>
        <div className="field result-order-input">
          <span className="field-label-row" id="order-contracts-label">
            {f.orderContracts.label}
          </span>
          <div className="result-order-input__row">
            <NumberStepper
              value={orderContracts}
              allowNegative
              step={1}
              placeholder={f.orderContracts.placeholder || undefined}
              stepUpLabel={t.stepUp}
              stepDownLabel={t.stepDown}
              ariaLabelledBy="order-contracts-label"
              onChange={(v) => onChange({ orderContracts: v })}
            />
            {orderBlocked && (
              <span className="order-blocked-badge" role="status">
                {t.orderBlocked}
              </span>
            )}
          </div>
        </div>
        <OrderResults
          key={`${positionSide}-${orderContracts ?? 'empty'}`}
          result={orderResult}
          orderBlocked={orderBlocked}
        />
      </section>
    </div>
  )
}
