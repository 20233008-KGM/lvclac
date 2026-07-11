import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { calculateEvaluate, calculateOrder, captureOrderScenarioBaseline } from '../calc/leverage'
import {
  applyInputPatch,
  isOrderScenarioModeActive,
  resolveEvaluationInputs,
  type CalculatorInputPatch,
} from '../calc/mtmLink'
import type { CalculatorHistoryOptions } from '../context/calculatorHistory'
import {
  beginOrderHistorySave,
  completeOrderHistorySave,
} from '../context/orderHistoryUndoSync'
import {
  buildAccountSnapshotPayload,
  buildOrderHistoryPayload,
  createAccountRecordsRepository,
} from '../db/accountRecords'
import type { CalculatorInputs, EvaluateResult, OrderResult } from '../types'
import { maxAddableLabel } from '../utils/positionLabels'
import { FORMULAS_PATH, GUIDE_PATH, MY_PAGE_PATH } from '../config/routes'
import { useNavigate } from '../hooks/usePathname'
import { useFloatingTooltip } from '../hooks/useFloatingTooltip'
import { useAuth } from '../context/AuthContext'
import { useCalculator } from '../context/CalculatorContext'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import {
  CommitButtonSlot,
  ScenarioPriceApplyButton,
  ScenarioPriceCommitButton,
} from './InputCommitButton'
import { LegalEmphasis } from './ServiceDisclaimer'
import { FitText, FitTextGroup } from './FitText'
import { NumberInput, type NumberInputChangeMeta, type NumberInputHandle } from './NumberInput'
import { NumberStepper } from './NumberStepper'
import {
  CONTRACTS_SCRUB_PX_PER_TICK,
  PRICE_SCRUB_PX_PER_TICK,
} from './numberStepperScrub'
import { formatNumberForInput } from '../utils/inputFormat'
import {
  formatLeverageValue,
  formatNumber,
  formatPercent,
  formatToleranceDelta,
  formatTolerancePercent,
} from '../utils/format'
import {
  calcEntryPriceReturnRate,
  calcPositionUnrealizedPnl,
} from '../calc/positionMetrics'

const SnapshotSavedModal = lazy(() =>
  import('./SnapshotSavedModal').then((mod) => ({ default: mod.SnapshotSavedModal })),
)

interface ResultPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
}

type OrderApplyHandler = (
  beforeInputs: CalculatorInputs,
  afterInputs: CalculatorInputs,
  orderResult: OrderResult,
) => void

function historyOptions(meta?: NumberInputChangeMeta): CalculatorHistoryOptions | undefined {
  return meta?.historyGroup ? { historyGroup: meta.historyGroup } : undefined
}

function ResultHero({
  label,
  labelMeta,
  labelMetaTooltip,
  value,
  sub,
  danger,
  className,
}: {
  label: string
  labelMeta?: string | null
  labelMetaTooltip?: string | null
  value: string
  sub?: string | null
  danger?: boolean
  className?: string
}) {
  const cardClassName = [
    'result-hero-card',
    danger ? 'danger' : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClassName}>
      <span className="result-hero-label-row">
        <span className="result-hero-label">{label}</span>
        {labelMeta && (
          <ResultHeroLabelMeta value={labelMeta} tooltip={labelMetaTooltip} />
        )}
      </span>
      <span className="result-hero-value">
        <FitText>{value}</FitText>
      </span>
      {sub && <span className="result-hero-sub">{sub}</span>}
    </div>
  )
}

function ResultHeroLabelMeta({
  value,
  tooltip,
}: {
  value: string
  tooltip?: string | null
}) {
  const id = useId()
  const hasTooltip = tooltip != null
  const { anchorRef, anchorHandlers, renderTooltip } = useFloatingTooltip({
    placement: 'top',
  })

  return (
    <span
      ref={anchorRef as RefObject<HTMLSpanElement>}
      className={`result-hero-label-meta${hasTooltip ? ' result-hero-label-meta--tooltip' : ''}`}
      tabIndex={hasTooltip ? 0 : undefined}
      aria-describedby={hasTooltip ? id : undefined}
      {...(hasTooltip ? anchorHandlers : {})}
    >
      {value}
      {hasTooltip &&
        renderTooltip(
          'field-label-tooltip result-hero-pnl-tooltip',
          <span className="result-hero-pnl-tooltip__value">{tooltip}</span>,
          { id },
        )}
    </span>
  )
}

function formatEntryReturnMeta(value: number | null): string | null {
  if (value == null) return null
  const formatted = formatPercent(value)
  return value > 0 ? `+${formatted}` : formatted
}

function formatEntryPnlTooltip(value: number | null): string | null {
  if (value == null) return null
  if (value === 0) return '0'
  const formatted = formatNumber(Math.abs(value))
  return value > 0 ? `+${formatted}` : `-${formatted}`
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
  entryReturnRate,
  entryPnl,
}: {
  result: EvaluateResult
  currentPrice?: number
  entryReturnRate: number | null
  entryPnl: number | null
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
          labelMeta={formatEntryReturnMeta(entryReturnRate)}
          labelMetaTooltip={formatEntryPnlTooltip(entryPnl)}
          value={formatNumber(currentPrice ?? null)}
          className="result-hero-card--mark"
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
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
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
              onChange={(v, meta) => onChange({ orderContracts: v }, historyOptions(meta))}
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
                onChange={(v, meta) => onChange({ orderPrice: v }, historyOptions(meta))}
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
                  onChange={(v, meta) => onChange({ orderPrice: v }, historyOptions(meta))}
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
      index: t.fields.contractAmount.label,
      before: formatNumber(result.beforeContractAmount),
      after: hasAfter ? formatNumber(result.afterContractAmount) : '-',
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
  const { storageMode, activeNumberSetId } = useCalculator()
  // 기록을 어느 슬롯에서 만들었는지 태그. 클라우드 슬롯일 때만 실제 number_sets.id이고,
  // 로컬 모드/미선택이면 null('미분류'). FK 위반 방지를 위해 로컬 id는 태그하지 않는다.
  const activeCloudNumberSetId = storageMode === 'cloud' ? activeNumberSetId : null
  const recordsRepository = useMemo(() => createAccountRecordsRepository(), [])
  const [snapshotBusy, setSnapshotBusy] = useState(false)
  const [snapshotSavedModalOpen, setSnapshotSavedModalOpen] = useState(false)
  const [snapshotSaveNotice, setSnapshotSaveNotice] = useState<string | null>(null)
  const [orderSaveNotice, setOrderSaveNotice] = useState<string | null>(null)
  const snapshotButtonRef = useRef<HTMLButtonElement>(null)
  const activeRecordsUserIdRef = useRef(userId)

  const evalInputs = useMemo(() => resolveEvaluationInputs(inputs), [inputs])
  const entryReturnRate = calcEntryPriceReturnRate(evalInputs)
  const entryPnl = calcPositionUnrealizedPnl(evalInputs)
  const evaluateResult = useMemo(
    () => calculateEvaluate(inputs),
    [inputs],
  )
  const orderResult = useMemo(
    () => calculateOrder(inputs),
    [inputs],
  )

  const orderBlocked = orderResult.orderCapacityMessage !== null

  const orderScenarioActive = isOrderScenarioModeActive(inputs)
  const orderChipText = formatOrderScenarioChip(inputs, t.orderScenarioChip)

  const saveSnapshot = useCallback(async () => {
    if (!userId) return

    setSnapshotBusy(true)
    setSnapshotSaveNotice(null)
    const payload = buildAccountSnapshotPayload(
      inputs,
      evaluateResult,
      t.accountRecords.snapshotsTab,
      { numberSetId: activeCloudNumberSetId },
    )
    const result = await recordsRepository.createAccountSnapshot(userId, payload)
    if (activeRecordsUserIdRef.current !== userId) {
      setSnapshotBusy(false)
      return
    }
    if (result.error !== null) {
      setSnapshotSaveNotice(t.accountRecords.snapshotSaveError)
      setSnapshotBusy(false)
      return
    }

    setSnapshotSavedModalOpen(true)
    setSnapshotBusy(false)
  }, [activeCloudNumberSetId, evaluateResult, inputs, recordsRepository, t.accountRecords, userId])

  const saveOrderRecord = useCallback<OrderApplyHandler>(
    (beforeInputs, afterInputs, result) => {
      if (!userId || !user?.autoSaveOrderHistory) return

      const payload = buildOrderHistoryPayload(beforeInputs, afterInputs, result, activeCloudNumberSetId)
      const saveGeneration = beginOrderHistorySave()
      setOrderSaveNotice(null)
      void recordsRepository.createOrderHistory(userId, payload).then((created) => {
        if (activeRecordsUserIdRef.current !== userId) return
        if (created.error !== null) {
          setOrderSaveNotice(t.accountRecords.orderSaveError)
          return
        }
        if (!created.data) return

        const race = completeOrderHistorySave(saveGeneration, created.data.id)
        if (race.deleteImmediately) {
          void recordsRepository.deleteOrderHistory(userId, race.deleteImmediately)
        }
      })
    },
    [activeCloudNumberSetId, recordsRepository, t.accountRecords.orderSaveError, user?.autoSaveOrderHistory, userId],
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

  return (
    <div className="result-column">
      <section className="panel result-panel">
        <div className="result-panel__head">
          <h2>{t.result}</h2>
          <div className="result-panel__head-actions">
            {userId && (
              <button
                type="button"
                ref={snapshotButtonRef}
                className="result-panel__head-btn"
                disabled={snapshotBusy}
                onClick={() => void saveSnapshot()}
              >
                {snapshotBusy ? t.accountRecords.savingSnapshot : t.accountRecords.saveSnapshot}
              </button>
            )}
            <a
              className="result-panel__head-btn"
              href={FORMULAS_PATH}
              onClick={(event) => {
                event.preventDefault()
                navigate(FORMULAS_PATH)
              }}
            >
              {t.formulas.title}
            </a>
          </div>
          {snapshotSaveNotice && (
            <p className="account-records-error" role="alert">
              {snapshotSaveNotice}
            </p>
          )}
        </div>
        <EvaluateResults
          key={positionSide}
          result={evaluateResult}
          currentPrice={evalInputs.currentPrice}
          entryReturnRate={entryReturnRate}
          entryPnl={entryPnl}
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
        {orderSaveNotice && (
          <p className="account-records-error" role="alert">
            {orderSaveNotice}
          </p>
        )}
      </section>

      {snapshotSavedModalOpen && (
        <Suspense fallback={null}>
          <SnapshotSavedModal
            copy={{
              title: t.accountRecords.savedModalTitle,
              body: t.accountRecords.snapshotSaved,
              goToRecords: t.accountRecords.savedModalGoToRecords,
              close: t.close,
            }}
            restoreFocusRef={snapshotButtonRef}
            onClose={() => setSnapshotSavedModalOpen(false)}
            onGoToRecords={() => {
              setSnapshotSavedModalOpen(false)
              navigate(MY_PAGE_PATH)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
