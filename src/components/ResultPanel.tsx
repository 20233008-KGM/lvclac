import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculateEvaluate, calculateOrder, captureOrderScenarioBaseline, checkOrderExceedsMaxBuyable } from '../calc/leverage'
import {
  applyInputPatch,
  hasOrderApplyUndo,
  isOrderScenarioModeActive,
  resolveEvaluationInputs,
  type CalculatorInputPatch,
} from '../calc/mtmLink'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  createAccountRecordsRepository,
  type AccountSnapshotRecord,
  type OrderHistoryRecord,
} from '../db/accountRecords'
import { calcMargins, inputsReadyForOrderSim, withReferencePrice } from '../calc/margins'
import type { CalculatorInputs, EvaluateResult, OrderResult } from '../types'
import { maxAddableLabel } from '../utils/positionLabels'
import { FORMULAS_PATH, GUIDE_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n'
import { AccountRecordsPanel, type AccountRecordsTab } from './AccountRecordsPanel'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import {
  CommitButtonSlot,
  ScenarioPriceApplyButton,
  ScenarioPriceCommitButton,
} from './InputCommitButton'
import { LegalEmphasis } from './ServiceDisclaimer'
import { FitText, FitTextGroup } from './FitText'
import { NumberInput, type NumberInputHandle } from './NumberInput'
import { NumberStepper } from './NumberStepper'
import {
  CONTRACTS_SCRUB_PX_PER_TICK,
  PRICE_SCRUB_PX_PER_TICK,
} from './numberStepperScrub'
import { formatNumberForInput } from '../utils/inputFormat'
import {
  formatLeverageValue,
  formatNumber,
  formatToleranceDelta,
  formatTolerancePercent,
} from '../utils/format'

interface ResultPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
}

type OrderApplyHandler = (
  beforeInputs: CalculatorInputs,
  afterInputs: CalculatorInputs,
  orderResult: OrderResult,
) => void

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

function formatOrderScenarioChip(
  inputs: CalculatorInputs,
  template: string,
): string | null {
  if (!isOrderScenarioModeActive(inputs)) return null
  if (inputs.orderContracts == null || inputs.orderPrice == null) return null
  const sign = inputs.orderContracts > 0 ? '+' : ''
  return template
    .replace('{contracts}', `${sign}${inputs.orderContracts}`)
    .replace('{price}', formatNumber(inputs.orderPrice))
}

function OrderInputs({
  inputs,
  onChange,
  orderResult,
  contractsField,
  priceField,
  scenarioContractsLabel,
  scenarioPriceLabel,
  useCurrentPriceShort,
  useCurrentPriceTitle,
  stepUpLabel,
  stepDownLabel,
  tooltipLabel,
  tooltipGuideLink,
  commitLabel,
  clearLabel,
  applyLabel,
  onApplyOrderScenario,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  orderResult: OrderResult
  contractsField: { label: string; hint: string; placeholder?: string }
  priceField: { label: string; hint: string; placeholder?: string }
  scenarioContractsLabel: string
  scenarioPriceLabel: string
  useCurrentPriceShort: string
  useCurrentPriceTitle: string
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  tooltipGuideLink: string
  commitLabel: string
  clearLabel: string
  applyLabel: string
  onApplyOrderScenario?: OrderApplyHandler
}) {
  const priceInputRef = useRef<NumberInputHandle>(null)
  const wasOrderScenarioRef = useRef(false)
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  const currentPrice = inputs.currentPrice
  const canUseCurrentPrice = currentPrice != null
  const orderScenarioActive = isOrderScenarioModeActive(inputs)
  const orderPricePlaceholder =
    currentPrice != null
      ? formatNumberForInput(currentPrice)
      : priceField.placeholder || undefined
  const orderApplyUndoAvailable = hasOrderApplyUndo(inputs)

  const orderReady =
    inputs.orderContracts != null && inputs.orderPrice != null

  function commitOrderScenario() {
    const baseline = captureOrderScenarioBaseline(orderResult)
    onChange({ commitOrderScenario: baseline })
  }

  function applyOrderScenario() {
    const afterInputs = applyInputPatch(inputs, { applyOrderScenario: true })
    onChange({ applyOrderScenario: true })
    onApplyOrderScenario?.(inputs, afterInputs, orderResult)
  }

  function handleOrderEnter() {
    if (!orderReady) return
    if (orderScenarioActive) {
      applyOrderScenario()
    } else {
      commitOrderScenario()
    }
  }

  useEffect(() => {
    if (wasOrderScenarioRef.current !== orderScenarioActive && orderScenarioActive) {
      requestAnimationFrame(() => priceInputRef.current?.focus())
    }
    wasOrderScenarioRef.current = orderScenarioActive
  }, [orderScenarioActive])

  useEffect(() => {
    if (!orderApplyUndoAvailable) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'z' || e.shiftKey || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      onChange({ undoOrderApply: true })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [orderApplyUndoAvailable, onChange])

  const contractsLabel = orderScenarioActive ? scenarioContractsLabel : contractsField.label
  const priceLabel = orderScenarioActive ? scenarioPriceLabel : priceField.label

  const commitButton = (
    <ScenarioPriceCommitButton
      label={commitLabel}
      disabled={!orderReady}
      onClick={handleOrderEnter}
    />
  )

  const applyButton = (
    <ScenarioPriceApplyButton
      label={applyLabel}
      disabled={!orderReady}
      onClick={applyOrderScenario}
    />
  )

  const commitBtnSlot = (
    <CommitButtonSlot
      previewActive={orderScenarioActive}
      commitButton={commitButton}
      applyButton={applyButton}
    />
  )

  function fillOrderPriceWithCurrent() {
    if (currentPrice != null) onChange({ orderPrice: currentPrice })
  }

  const markInlineButton = (
    <button
      type="button"
      className="order-mark-inline-btn"
      aria-label={useCurrentPriceTitle}
      title={useCurrentPriceTitle}
      disabled={!canUseCurrentPrice}
      onClick={fillOrderPriceWithCurrent}
    >
      {useCurrentPriceShort}
    </button>
  )

  return (
    <div
      className={`result-order-fields${orderScenarioActive ? ' result-order-fields--preview' : ''}`}
    >
      <div className="field result-order-field result-order-field--contracts">
        <span className="result-order-field__label field-label-row" id="order-contracts-label">
          <span className="field-label-text">
            {contractsLabel}
            <FieldLabelTooltip
              text={contractsField.hint}
              label={tooltipLabel}
              highlight={orderScenarioActive}
            />
          </span>
        </span>
          <div className="result-order-field__control">
            <NumberStepper
              value={inputs.orderContracts}
              allowNegative
              step={1}
              placeholder={contractsField.placeholder || undefined}
              stepUpLabel={stepUpLabel}
              stepDownLabel={stepDownLabel}
              ariaLabelledBy="order-contracts-label"
              enableDragScrub
              dragScrubPxPerTick={CONTRACTS_SCRUB_PX_PER_TICK}
              scrubSeedValue={0}
              onEnterKey={handleOrderEnter}
              onChange={(v) => onChange({ orderContracts: v })}
            />
          </div>
        </div>

        <div className="field result-order-field result-order-field--price">
          <span className="result-order-field__label field-label-row" id="order-price-label">
            <span className="field-label-text">
              {priceLabel}
              <FieldLabelTooltip
                text={priceField.hint}
                label={tooltipLabel}
                guideHref={GUIDE_PATH}
                guideLinkLabel={tooltipGuideLink}
              />
            </span>
          </span>
          <div className="result-order-field__control">
            {useStepper ? (
              <NumberStepper
                ref={priceInputRef}
                value={inputs.orderPrice}
                step={tickSize}
                allowNegative={false}
                placeholder={orderPricePlaceholder}
                stepUpLabel={stepUpLabel}
                stepDownLabel={stepDownLabel}
                ariaLabelledBy="order-price-label"
                trailingSlot={markInlineButton}
                enableDragScrub
                dragScrubPxPerTick={PRICE_SCRUB_PX_PER_TICK}
                scrubSeedValue={currentPrice}
                onEnterKey={handleOrderEnter}
                onChange={(v) => onChange({ orderPrice: v })}
              />
            ) : (
              <div className="result-order-price-row">
                <NumberInput
                  ref={priceInputRef}
                  value={inputs.orderPrice}
                  allowDecimal={false}
                  placeholder={orderPricePlaceholder}
                  aria-labelledby="order-price-label"
                  className="result-order-price-row__input"
                  onEnterKey={handleOrderEnter}
                  onChange={(v) => onChange({ orderPrice: v })}
                />
                {markInlineButton}
              </div>
            )}
          </div>
        </div>

        <div className="result-order-field result-order-field--commit">
          <span className="result-order-commit-label">
            <button
              type="button"
              className={`field-label-del-btn field-label-del-btn--scenario result-order-commit-esc${orderScenarioActive ? '' : ' result-order-commit-esc--hidden'}`}
              aria-label={clearLabel}
              title={clearLabel}
              tabIndex={orderScenarioActive ? 0 : -1}
              aria-hidden={!orderScenarioActive}
              onClick={() => onChange({ clearOrderScenario: true })}
            >
              esc
            </button>
          </span>
          <div className="result-order-fields__commit-slot">{commitBtnSlot}</div>
        </div>
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const { orderContracts, orderPrice, positionSide } = inputs
  const f = t.fields
  const userId = user?.id ?? null
  const recordsRepository = useMemo(() => createAccountRecordsRepository(), [])
  const [recordsTab, setRecordsTab] = useState<AccountRecordsTab>('orders')
  const [orderRecords, setOrderRecords] = useState<OrderHistoryRecord[]>([])
  const [snapshotRecords, setSnapshotRecords] = useState<AccountSnapshotRecord[]>([])
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordsError, setRecordsError] = useState<string | null>(null)
  const [recordsNotice, setRecordsNotice] = useState<string | null>(null)
  const [snapshotBusy, setSnapshotBusy] = useState(false)
  const recordsRequestIdRef = useRef(0)
  const activeRecordsUserIdRef = useRef(userId)

  const evalInputs = useMemo(() => resolveEvaluationInputs(inputs), [inputs])
  const evaluateResult = useMemo(
    () => calculateEvaluate(inputs),
    [inputs],
  )
  const orderResult = useMemo(
    () => calculateOrder(inputs),
    [inputs],
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

  const orderScenarioActive = isOrderScenarioModeActive(inputs)
  const orderChipText = formatOrderScenarioChip(inputs, t.orderScenarioChip)

  const loadRecords = useCallback(async () => {
    const requestId = recordsRequestIdRef.current + 1
    recordsRequestIdRef.current = requestId

    if (!userId) {
      setOrderRecords([])
      setSnapshotRecords([])
      setRecordsLoading(false)
      setRecordsError(null)
      setRecordsNotice(null)
      return
    }

    setRecordsLoading(true)
    setRecordsError(null)
    const result = await recordsRepository.fetchRecentRecords(userId)
    if (
      recordsRequestIdRef.current !== requestId ||
      activeRecordsUserIdRef.current !== userId
    ) {
      return
    }
    if (result.error !== null) {
      setRecordsError(t.accountRecords.loadError)
      setRecordsLoading(false)
      return
    }

    setOrderRecords(result.data.orderHistory)
    setSnapshotRecords(result.data.accountSnapshots)
    setRecordsLoading(false)
  }, [recordsRepository, t.accountRecords.loadError, userId])

  const saveSnapshot = useCallback(async () => {
    if (!userId) return

    setSnapshotBusy(true)
    setRecordsNotice(null)
    const payload = buildAccountSnapshotPayload(
      inputs,
      evaluateResult,
      t.accountRecords.snapshotsTab,
    )
    const result = await recordsRepository.createAccountSnapshot(userId, payload)
    if (activeRecordsUserIdRef.current !== userId) {
      setSnapshotBusy(false)
      return
    }
    if (result.error !== null) {
      setRecordsNotice(t.accountRecords.snapshotSaveError)
      setSnapshotBusy(false)
      return
    }

    setSnapshotRecords((prev) => [result.data, ...prev])
    setRecordsTab('snapshots')
    setRecordsNotice(t.accountRecords.snapshotSaved)
    setSnapshotBusy(false)
  }, [evaluateResult, inputs, recordsRepository, t.accountRecords, userId])

  const saveOrderRecord = useCallback<OrderApplyHandler>(
    (beforeInputs, afterInputs, result) => {
      if (!userId) return

      const payload = buildOrderHistoryPayload(beforeInputs, afterInputs, result)
      setRecordsNotice(null)
      void recordsRepository.createOrderHistory(userId, payload).then((created) => {
        if (activeRecordsUserIdRef.current !== userId) return
        if (created.error !== null) {
          setRecordsNotice(t.accountRecords.orderSaveError)
          return
        }

        setOrderRecords((prev) => [created.data, ...prev])
        setRecordsTab('orders')
        setRecordsNotice(t.accountRecords.orderSaved)
      })
    },
    [recordsRepository, t.accountRecords, userId],
  )

  const deleteOrderRecord = useCallback(
    (id: string) => {
      if (!userId) return

      setRecordsNotice(null)
      void recordsRepository.deleteOrderHistory(userId, id).then((result) => {
        if (activeRecordsUserIdRef.current !== userId) return
        if (result.error !== null) {
          setRecordsNotice(t.accountRecords.deleteError)
          return
        }
        setOrderRecords((prev) => prev.filter((record) => record.id !== id))
      })
    },
    [recordsRepository, t.accountRecords.deleteError, userId],
  )

  const deleteSnapshotRecord = useCallback(
    (id: string) => {
      if (!userId) return

      setRecordsNotice(null)
      void recordsRepository.deleteAccountSnapshot(userId, id).then((result) => {
        if (activeRecordsUserIdRef.current !== userId) return
        if (result.error !== null) {
          setRecordsNotice(t.accountRecords.deleteError)
          return
        }
        setSnapshotRecords((prev) => prev.filter((record) => record.id !== id))
      })
    },
    [recordsRepository, t.accountRecords.deleteError, userId],
  )

  useEffect(() => {
    if (!orderScenarioActive) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onChange({ clearOrderScenario: true })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [orderScenarioActive, onChange])

  useEffect(() => {
    activeRecordsUserIdRef.current = userId
  }, [userId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecords()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadRecords])

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

      <section
        className={`panel result-panel result-panel--order${orderScenarioActive ? ' result-panel--order--preview' : ''}`}
      >
        <div className="result-panel--order__head">
          <h2 className="result-panel--order__title">
            <span className="result-panel--order__title-text">
              {orderScenarioActive ? t.orderScenarioSectionTitle : t.modes.order}
            </span>
            <FieldLabelTooltip
              text={t.orderScenarioHint}
              label={t.fieldTooltipLabel}
              guideHref={GUIDE_PATH}
              guideLinkLabel={t.tooltipGuideLink}
              highlight={orderScenarioActive}
            />
          </h2>
          {orderScenarioActive && orderChipText && (
            <div className="result-panel--order__head-meta">
              <span className="order-scenario-chip" role="status">
                {orderChipText}
              </span>
            </div>
          )}
        </div>
        <OrderInputs
          inputs={inputs}
          onChange={onChange}
          orderResult={orderResult}
          contractsField={f.orderContracts}
          priceField={f.orderPrice}
          scenarioContractsLabel={t.orderScenarioFieldContracts}
          scenarioPriceLabel={t.orderScenarioFieldPrice}
          useCurrentPriceShort={t.useCurrentPriceShort}
          useCurrentPriceTitle={t.useCurrentPriceTitle}
          stepUpLabel={t.stepUp}
          stepDownLabel={t.stepDown}
          tooltipLabel={t.fieldTooltipLabel}
          tooltipGuideLink={t.tooltipGuideLink}
          commitLabel={t.orderScenarioCommit}
          clearLabel={t.orderScenarioClear}
          applyLabel={t.orderScenarioApply}
          onApplyOrderScenario={saveOrderRecord}
        />
        <OrderResults
          key={`${positionSide}-${orderContracts ?? 'empty'}-${orderPrice ?? 'mark'}`}
          result={orderResult}
          orderBlocked={orderBlocked}
        />
      </section>

      <AccountRecordsPanel
        copy={t.accountRecords}
        signedIn={Boolean(userId)}
        activeTab={recordsTab}
        onTabChange={setRecordsTab}
        loading={recordsLoading}
        error={recordsError}
        notice={recordsNotice}
        orderRecords={orderRecords}
        snapshotRecords={snapshotRecords}
        onRetry={() => {
          void loadRecords()
        }}
        onSaveSnapshot={() => {
          void saveSnapshot()
        }}
        onDeleteOrder={deleteOrderRecord}
        onDeleteSnapshot={deleteSnapshotRecord}
        snapshotBusy={snapshotBusy}
      />
    </div>
  )
}
