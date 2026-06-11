import { useMemo } from 'react'
import { calculateEvaluate, calculateOrder, checkOrderExceedsMaxBuyable } from '../calc/leverage'
import { resolveEvaluationInputs } from '../calc/mtmLink'
import { calcMargins, inputsReadyForOrderSim, withReferencePrice } from '../calc/margins'
import type { CalculatorInputs, EvaluateResult, OrderResult } from '../types'
import { maxAddableLabel } from '../utils/positionLabels'
import { FORMULAS_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { LegalEmphasis } from './ServiceDisclaimer'
import { FitText, FitTextGroup } from './FitText'
import { NumberInput } from './NumberInput'
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
      <span className="result-hero-value">
        <FitText>{value}</FitText>
      </span>
      {sub && <span className="result-hero-sub">{sub}</span>}
    </div>
  )
}

function ResultRow({
  label,
  value,
  sub,
  danger,
  valueTitle,
}: {
  label: string
  value: string
  sub?: string | null
  danger?: boolean
  valueTitle?: string
}) {
  return (
    <div className={`result-row ${danger ? 'danger' : ''}`}>
      <div className="result-row-main">
        <span className="result-row-label">{label}</span>
        <span className="result-row-value">
          <FitText title={valueTitle}>{value}</FitText>
        </span>
      </div>
      {sub && <span className="result-row-sub">{sub}</span>}
    </div>
  )
}

function ResultRowPair({
  left,
  right,
}: {
  left: {
    label: string
    value: string
    sub?: string | null
    danger?: boolean
    valueTitle?: string
  }
  right: {
    label: string
    value: string
    sub?: string | null
    danger?: boolean
    valueTitle?: string
  }
}) {
  return (
    <div className="result-row-pair">
      <ResultRow
        label={left.label}
        value={left.value}
        sub={left.sub}
        danger={left.danger}
        valueTitle={left.valueTitle}
      />
      <ResultRow
        label={right.label}
        value={right.value}
        sub={right.sub}
        danger={right.danger}
        valueTitle={right.valueTitle}
      />
    </div>
  )
}

function ResultSheet({
  indexHeader,
  indexHeaderClassName,
  beforeHeader,
  afterHeader,
  rows,
}: {
  indexHeader: React.ReactNode
  indexHeaderClassName?: string
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
          <th scope="col" className={indexHeaderClassName}>
            {indexHeader}
          </th>
          <th scope="col">{beforeHeader}</th>
          <th scope="col">{afterHeader}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.index}>
            <th scope="row">{row.index}</th>
            <td className={row.dangerBefore ? 'danger' : undefined}>
              <FitText>{row.before}</FitText>
            </td>
            <td className={row.dangerAfter ? 'danger' : undefined}>
              <FitText>{row.after}</FitText>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EvaluateResults({
  result,
  currentPrice,
}: {
  result: EvaluateResult
  currentPrice?: number
}) {
  const { t, translateCalcMessage } = useLanguage()
  const r = t.results
  const side = result.positionSide
  const isLong = side === 'long'
  const toleranceDeltaLabel = isLong ? r.toleranceDeltaLong : r.toleranceDeltaShort
  const toleranceValue = formatTolerancePercent(result.toleranceRate, side)

  return (
    <>
      <FitTextGroup>
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
          label={t.fields.currentPrice.label}
          value={formatNumber(currentPrice ?? null)}
        />
        <ResultHero
          label={r.tolerancePercent}
          value={toleranceValue}
          sub={result.isAtRisk ? translateCalcMessage('at_risk') : null}
          danger={result.isAtRisk}
        />
      </div>
      </FitTextGroup>
      <FitTextGroup>
      <div className="result-table">
        <ResultRowPair
          left={{
            label: r.maintenanceExcess,
            value: formatNumber(result.margins?.maintenanceExcess ?? null),
            danger: result.isAtRisk,
          }}
          right={{
            label: toleranceDeltaLabel,
            value: formatToleranceDelta(result.toleranceDelta, side),
            danger: result.isAtRisk,
          }}
        />
        <ResultRowPair
          left={{
            label: r.availableMargin,
            value: formatNumber(result.margins?.availableMargin ?? null),
          }}
          right={{
            label: maxAddableLabel(side, r),
            value: formatNumber(result.maxBuyable ?? null),
            sub: translateCalcMessage(result.maxBuyableMessage),
          }}
        />
        <ResultRowPair
          left={{
            label: r.perContractEntrusted,
            value: formatNumber(result.margins?.perContractEntrusted ?? null),
            valueTitle: r.perContractEntrustedTitle,
          }}
          right={{
            label: r.perContractMaintenance,
            value: formatNumber(result.margins?.perContractMaintenance ?? null),
            valueTitle: r.perContractMaintenanceTitle,
          }}
        />
        <ResultRowPair
          left={{
            label: r.contractNotional,
            value: formatNumber(result.margins?.contractNotional ?? null),
          }}
          right={{
            label: r.leverageRatio,
            value: formatLeverageValue(result.leverageRatio),
          }}
        />
        <ResultRowPair
          left={{
            label: r.maintenanceMargin,
            value: formatNumber(result.margins?.maintenanceMargin ?? null),
          }}
          right={{
            label: r.entrustedMargin,
            value: formatNumber(result.margins?.entrustedMargin ?? null),
          }}
        />
      </div>
      </FitTextGroup>
    </>
  )
}

function OrderInputs({
  inputs,
  onChange,
  contractsField,
  priceField,
  useCurrentPriceLabel,
  stepUpLabel,
  stepDownLabel,
}: {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
  contractsField: { label: string; placeholder?: string }
  priceField: { label: string; placeholder?: string }
  useCurrentPriceLabel: string
  stepUpLabel: string
  stepDownLabel: string
}) {
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  const currentPrice = inputs.currentPrice
  const canUseCurrentPrice = currentPrice != null

  return (
    <div className="result-order-fields">
      <label className="field result-order-field">
        <span className="field-label-row" id="order-contracts-label">
          {contractsField.label}
        </span>
        <NumberStepper
          value={inputs.orderContracts}
          allowNegative
          step={1}
          placeholder={contractsField.placeholder || undefined}
          stepUpLabel={stepUpLabel}
          stepDownLabel={stepDownLabel}
          ariaLabelledBy="order-contracts-label"
          onChange={(v) => onChange({ orderContracts: v })}
        />
      </label>
      <label className="field result-order-field">
        <span className="field-label-row" id="order-price-label">
          {priceField.label}
        </span>
        {useStepper ? (
          <NumberStepper
            value={inputs.orderPrice}
            step={tickSize}
            allowNegative={false}
            placeholder={priceField.placeholder || undefined}
            stepUpLabel={stepUpLabel}
            stepDownLabel={stepDownLabel}
            ariaLabelledBy="order-price-label"
            onChange={(v) => onChange({ orderPrice: v })}
          />
        ) : (
          <NumberInput
            value={inputs.orderPrice}
            allowDecimal={false}
            placeholder={priceField.placeholder || undefined}
            aria-labelledby="order-price-label"
            onChange={(v) => onChange({ orderPrice: v })}
          />
        )}
      </label>
      <button
        type="button"
        className="order-use-current-btn result-order-fields__mark-btn"
        disabled={!canUseCurrentPrice}
        onClick={() => {
          if (currentPrice != null) onChange({ orderPrice: currentPrice })
        }}
      >
        {useCurrentPriceLabel}
      </button>
    </div>
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
      index: r.tolerancePercent,
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
    <FitTextGroup>
      <ResultSheet
        indexHeader={
          orderBlocked ? (
            <span className="order-blocked-badge" role="status">
              {t.orderBlocked}
            </span>
          ) : null
        }
        indexHeaderClassName={orderBlocked ? 'result-sheet__index-header--blocked' : undefined}
        beforeHeader={r.sheetBefore}
        afterHeader={r.sheetAfter}
        rows={sheetRows}
      />
    </FitTextGroup>
  )
}

export function ResultPanel({ inputs, onChange }: ResultPanelProps) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { orderContracts, orderPrice, positionSide } = inputs
  const f = t.fields

  const evalInputs = useMemo(() => resolveEvaluationInputs(inputs), [inputs])
  const evaluateResult = useMemo(
    () => calculateEvaluate(inputs),
    [inputs, positionSide],
  )
  const orderResult = useMemo(
    () => calculateOrder(inputs),
    [inputs, positionSide, orderContracts, orderPrice],
  )

  const orderBlocked = useMemo(() => {
    const evalInputs = withReferencePrice(resolveEvaluationInputs(inputs))
    if (!inputsReadyForOrderSim(evalInputs)) return false
    const marginResult = calcMargins(evalInputs, evalInputs.contracts ?? 0)
    if (!marginResult) return false
    return (
      checkOrderExceedsMaxBuyable(
        orderContracts,
        evalInputs.accountEval!,
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
        <EvaluateResults
          key={positionSide}
          result={evaluateResult}
          currentPrice={evalInputs.currentPrice}
        />
        <p className="result-panel__warning" role="note">
          <LegalEmphasis>{t.legal.resultMismatchWarning}</LegalEmphasis>
        </p>
      </section>

      <section className="panel result-panel result-panel--order">
        <h2>{t.modes.order}</h2>
        <OrderInputs
          inputs={inputs}
          onChange={onChange}
          contractsField={f.orderContracts}
          priceField={f.orderPrice}
          useCurrentPriceLabel={t.useCurrentPrice}
          stepUpLabel={t.stepUp}
          stepDownLabel={t.stepDown}
        />
        <OrderResults
          key={`${positionSide}-${orderContracts ?? 'empty'}-${orderPrice ?? 'mark'}`}
          result={orderResult}
          orderBlocked={orderBlocked}
        />
      </section>
    </div>
  )
}
