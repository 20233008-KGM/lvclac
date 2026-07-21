import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import { isPreviewModeActive, type CalculatorInputPatch } from '../calc/mtmLink'
import type { CalculatorHistoryOptions } from '../context/calculatorHistory'
import {
  isAccountSetupComplete,
  readSkipAccountSettingGuard,
  setSkipAccountSettingGuard,
} from './accountSettingGuard'
import { GUIDE_PATH } from '../config/routes'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import {
  ScenarioPriceApplyButton,
} from './InputCommitButton'
import { NumberInput, type NumberInputChangeMeta, type NumberInputHandle } from './NumberInput'
import { NumberStepper } from './NumberStepper'
import {
  PRICE_SCRUB_PX_PER_TICK,
} from './numberStepperScrub'
import { ClearAllInputsButton } from './ClearAllInputsButton'
import { ActiveNumberSetLabel } from './ActiveNumberSetLabel'
import { SaveDraftToggle } from './SaveDraftToggle'
import { resolveInputPanelDisplayInputs } from './inputPanelDisplay'
import { calcPositionTickPnl } from '../calc/positionMetrics'
import { formatNumberForInput } from '../utils/inputFormat'
import { formatNumber } from '../utils/format'

interface InputPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
}

const DECIMAL_FIELDS = new Set<keyof CalculatorInputs>(['contractMultiplier'])
const RATE_FIELDS = new Set<keyof CalculatorInputs>([
  'maintenanceMarginRate',
  'entrustedMarginRate',
])

function historyOptions(meta?: NumberInputChangeMeta): CalculatorHistoryOptions | undefined {
  return meta?.historyGroup
    ? {
        historyGroup: meta.historyGroup,
        historyCommit: meta.historyCommit,
        historyOnly: meta.historyOnly,
      }
    : undefined
}

function Field({
  label,
  optionalText,
  tooltip,
  tooltipLabel,
  tooltipGuideHref,
  tooltipGuideLinkLabel,
  labelId,
  className,
  children,
}: {
  label: string
  optionalText?: string
  tooltip?: string
  tooltipLabel?: string
  tooltipGuideHref?: string
  tooltipGuideLinkLabel?: string
  labelId?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={`field${className ? ` ${className}` : ''}`}>
      <span className="field-label-row" id={labelId}>
        <span className="field-label-text">
          {label}
          {optionalText && <em className="optional"> {optionalText}</em>}
          {tooltip && tooltipLabel && (
            <FieldLabelTooltip
              text={tooltip}
              label={tooltipLabel}
              guideHref={tooltipGuideHref}
              guideLinkLabel={tooltipGuideLinkLabel}
            />
          )}
        </span>
      </span>
      {children}
    </label>
  )
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="field-section-title">{children}</h3>
}

function DerivedMetricField({ label, value }: { label: string; value: string }) {
  return (
    <div className="field field--derived-metric">
      <span className="field-label-row">
        <span className="field-label-text">{label}</span>
      </span>
      <div className="derived-metric-box" aria-label={`${label}: ${value}`}>
        <span className="derived-metric-value">{value}</span>
      </div>
    </div>
  )
}

function formatTickPnl(value: number | null): string {
  if (value == null) return '-'
  if (value === 0) return '0'
  return `±${formatNumber(value)}`
}

function numField(
  field: FieldCopy,
  key: keyof CalculatorInputs,
  inputs: CalculatorInputs,
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void,
  optional = false,
  optionalText?: string,
  showTooltip = false,
  tooltipLabel?: string,
  inputProps?: Partial<{
    deferChangeUntilBlur: boolean
    onCommit: (value: number | undefined, meta?: NumberInputChangeMeta) => void
    disabled: boolean
    className: string
    guardLocked: boolean
    onGuardBlocked: () => void
  }>,
) {
  const value = inputs[key] as number | undefined
  const allowDecimal = DECIMAL_FIELDS.has(key)
  const isRate = RATE_FIELDS.has(key)

  return (
    <Field
      key={key}
      label={field.label}
      optionalText={optional ? optionalText : undefined}
      tooltip={showTooltip ? field.hint : undefined}
      tooltipLabel={showTooltip ? tooltipLabel : undefined}
      className={inputProps?.className}
    >
      <NumberInput
        value={value}
        allowDecimal={allowDecimal || isRate}
        isRate={isRate}
        optional={optional}
        placeholder={field.placeholder || undefined}
        disabled={inputProps?.disabled}
        deferChangeUntilBlur={inputProps?.deferChangeUntilBlur}
        onCommit={inputProps?.onCommit}
        guardLocked={inputProps?.guardLocked}
        onGuardBlocked={inputProps?.onGuardBlocked}
        onChange={(v, meta) => {
          const patch = { [key]: v } as CalculatorInputPatch
          if (key === 'contractAmount') patch.contractAmountRole = 'entryPrice'
          onChange(patch, historyOptions(meta))
        }}
      />
    </Field>
  )
}

function CurrentPriceField({
  inputs,
  onChange,
  field,
  stepUpLabel,
  stepDownLabel,
  tooltipLabel,
  tooltipGuideHref,
  tooltipGuideLinkLabel,
  disabled = false,
  rollPnlOnChange = false,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  tooltipGuideHref?: string
  tooltipGuideLinkLabel?: string
  disabled?: boolean
  rollPnlOnChange?: boolean
}) {
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  function handleChange(
    v: number | undefined,
    meta?: NumberInputChangeMeta & { gestureStart?: boolean },
  ) {
    const options = historyOptions(meta)
    if (!rollPnlOnChange) {
      onChange({ currentPrice: v }, options)
      return
    }
    if (v == null) return
    const gestureStart = meta?.gestureStart ?? true
    onChange(
      { applyMarkPrice: v, preserveMarkPriceUndoSnapshot: gestureStart ? undefined : true },
      options,
    )
  }

  const fieldProps = {
    label: field.label,
    labelId: 'current-price-label',
    tooltip: field.hint,
    tooltipLabel,
    tooltipGuideHref,
    tooltipGuideLinkLabel,
  }

  if (useStepper) {
    return (
      <Field {...fieldProps}>
        <NumberStepper
          value={inputs.currentPrice}
          step={tickSize}
          allowNegative={false}
          placeholder={field.placeholder || undefined}
          stepUpLabel={stepUpLabel}
          stepDownLabel={stepDownLabel}
          ariaLabelledBy="current-price-label"
          deferChangeUntilBlur={rollPnlOnChange}
          onCommit={handleChange}
          onDeleteKey={rollPnlOnChange ? () => undefined : undefined}
          disabled={disabled}
          enableDragScrub
          dragScrubPxPerTick={PRICE_SCRUB_PX_PER_TICK}
          onChange={handleChange}
        />
      </Field>
    )
  }

  return (
    <Field {...fieldProps}>
      <NumberInput
        value={inputs.currentPrice}
        allowDecimal={false}
        placeholder={field.placeholder || undefined}
        aria-labelledby="current-price-label"
        disabled={disabled}
        deferChangeUntilBlur={rollPnlOnChange}
        onCommit={handleChange}
        onDeleteKey={rollPnlOnChange ? () => undefined : undefined}
        onChange={handleChange}
      />
    </Field>
  )
}

export function ScenarioPriceField({
  inputs,
  onChange,
  field,
  stepUpLabel,
  stepDownLabel,
  tooltipLabel,
  tooltipGuideLink,
  clearLabel,
  applyPnlLabel,
  disabled = false,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  tooltipGuideLink: string
  clearLabel: string
  applyPnlLabel: string
  disabled?: boolean
}) {
  const inputRef = useRef<NumberInputHandle>(null)
  const [draftPrice, setDraftPrice] = useState<number | undefined>()
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  const scenarioApplyUndoAvailable = inputs.markPriceUndoSnapshot != null

  function clearScenario() {
    setDraftPrice(undefined)
  }

  function resolveScenarioPrice(): number | undefined {
    if (useStepper) return draftPrice
    return inputRef.current?.readDraft() ?? draftPrice
  }

  function applyScenarioToMark(price?: number) {
    const resolved = price ?? resolveScenarioPrice()
    if (resolved == null) return
    onChange({ applyMarkPrice: resolved })
    setDraftPrice(undefined)
  }

  /** Enter/↵ — 미진입: 시나리오 모드 진입 / 진입 후: 손익 반영 */
  function handleScenarioEnter() {
    const price = resolveScenarioPrice()
    if (price == null) return
    applyScenarioToMark(price)
  }

  function handleScenarioPriceChange(v: number | undefined) {
    setDraftPrice(v)
  }

  const applyPnlDisabled = draftPrice == null

  const scenarioPlaceholder =
    inputs.currentPrice != null
      ? formatNumberForInput(inputs.currentPrice)
      : field.placeholder || undefined

  const applyPnlButton = (
    <ScenarioPriceApplyButton
      label={applyPnlLabel}
      disabled={disabled || applyPnlDisabled}
      onClick={() => applyScenarioToMark()}
    />
  )

  const labelRow = (
    <span className="field-label-row field-label-row--with-action" id="scenario-price-label">
      <span className="field-label-text">
        {field.label}
        <FieldLabelTooltip
          text={field.hint}
          label={tooltipLabel}
          highlight={false}
          guideHref={GUIDE_PATH}
          guideLinkLabel={tooltipGuideLink}
        />
      </span>
      <span className="field-label-action-slot">
        <button
          type="button"
          className={`field-label-del-btn field-label-del-btn--scenario${scenarioApplyUndoAvailable ? '' : ' field-label-del-btn--hidden'}`}
          aria-label={clearLabel}
          title={clearLabel}
          tabIndex={scenarioApplyUndoAvailable ? 0 : -1}
          aria-hidden={!scenarioApplyUndoAvailable}
          onClick={() => onChange({ undoMarkPrice: true })}
        >
          undo
        </button>
      </span>
    </span>
  )

  const commitBtnSlot = applyPnlButton

  if (useStepper) {
    return (
      <div className="field">
        {labelRow}
        <NumberStepper
          ref={inputRef}
          value={draftPrice}
          step={tickSize}
          allowNegative={false}
          placeholder={scenarioPlaceholder}
          stepUpLabel={stepUpLabel}
          stepDownLabel={stepDownLabel}
          ariaLabelledBy="scenario-price-label"
          inlineSlot={commitBtnSlot}
          disabled={disabled}
          enableDragScrub
          dragScrubPxPerTick={PRICE_SCRUB_PX_PER_TICK}
          scrubSeedValue={inputs.currentPrice}
          onEnterKey={handleScenarioEnter}
          onDeleteKey={clearScenario}
          onChange={handleScenarioPriceChange}
        />
      </div>
    )
  }

  return (
    <div className="field">
      {labelRow}
      <div className="input-commit-row input-commit-row--enter">
        <NumberInput
          ref={inputRef}
          value={draftPrice}
          allowDecimal={false}
          placeholder={scenarioPlaceholder}
          aria-labelledby="scenario-price-label"
          className="input-commit-row__input"
          disabled={disabled}
          onEnterKey={handleScenarioEnter}
          onDeleteKey={clearScenario}
          onChange={handleScenarioPriceChange}
        />
        {commitBtnSlot}
      </div>
    </div>
  )
}

const MARGIN_MODES = ['rate', 'perContract', 'total'] as const

function setupCopy(lang: 'ko' | 'en') {
  if (lang === 'ko') {
    return {
      setupTitle: '계좌 세팅',
      updateTitle: '현재가 갱신',
      baselinePrice: '기준 현재가',
      updatePrice: '새 현재가',
      lock: '세팅 잠금',
      edit: '수정',
      locked: '세팅 잠김',
      lockedHint: '계좌 기준값을 바꾸면 이후 가격 갱신 결과가 달라집니다.',
      apply: '현재가 반영',
      undo: '마지막 반영 취소',
      position: '포지션',
    }
  }
  return {
    setupTitle: 'Account setup',
    updateTitle: 'Mark update',
    baselinePrice: 'Baseline mark',
    updatePrice: 'New mark',
    lock: 'Lock setup',
    edit: 'Edit',
    locked: 'Setup locked',
    lockedHint: 'Changing account baseline values will change future mark updates.',
    apply: 'Apply mark',
    undo: 'Undo last apply',
    position: 'Side',
  }
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="account-setup-summary__item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function AccountSetupSummary({
  inputs,
  onEdit,
}: {
  inputs: CalculatorInputs
  onEdit: () => void
}) {
  const { t } = useLanguage()
  const c = setupCopy(t.lang)
  const f = t.fields
  const sideLabel = inputs.positionSide === 'long' ? t.long : t.short

  return (
    <div className="field-section account-setup-summary">
      <div className="account-setup-summary__head">
        <div>
          <SectionTitle>{c.setupTitle}</SectionTitle>
          <p>{c.lockedHint}</p>
        </div>
        <button type="button" className="account-setup-lock-btn" onClick={onEdit}>
          {c.edit}
        </button>
      </div>
      <div className="account-setup-summary__grid">
        <SummaryItem label={c.position} value={sideLabel} />
        <SummaryItem label={f.accountEquity.label} value={formatNumber(inputs.accountEval ?? null)} />
        <SummaryItem label={f.contracts.label} value={formatNumber(inputs.contracts ?? null)} />
        <SummaryItem label={f.contractAmount.label} value={formatNumber(inputs.contractAmount ?? null)} />
        <SummaryItem label={f.contractMultiplier.label} value={formatNumber(inputs.contractMultiplier ?? null)} />
        <SummaryItem label={c.baselinePrice} value={formatNumber(inputs.currentPrice ?? null)} />
      </div>
    </div>
  )
}

function MarginSection({
  inputs,
  onChange,
  setupScreen = false,
  guardLocked = false,
  onGuardBlocked,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch, options?: CalculatorHistoryOptions) => void
  setupScreen?: boolean
  guardLocked?: boolean
  onGuardBlocked?: () => void
}) {
  const { t } = useLanguage()
  const f = t.fields
  const m = t.marginMode
  const scenarioModeActive = isPreviewModeActive(inputs)
  const mode = inputs.marginInputMode ?? 'rate'

  const tooltipLabel = t.fieldTooltipLabel
  const guardProps = {
    disabled: scenarioModeActive,
    className: `${setupScreen ? 'field--setup-screen' : ''} fh-margin`.trim(),
    guardLocked,
    onGuardBlocked,
  }

  return (
    <div className="field-section">
      <div className="field-section-head">
        <SectionTitle>{t.sections.margin}</SectionTitle>
        <div className="margin-mode-toggle" role="group" aria-label={m.label}>
          {MARGIN_MODES.map((value) => (
            <button
              key={value}
              type="button"
              className={`margin-mode-btn ${mode === value ? 'active' : ''}`}
              aria-pressed={mode === value}
              disabled={scenarioModeActive}
              onClick={() => (guardLocked ? onGuardBlocked?.() : onChange({ marginInputMode: value }))}
            >
              {m[value]}
            </button>
          ))}
        </div>
        <FieldLabelTooltip text={m.tooltip} label={m.label} />
      </div>

      {mode === 'rate' && (
        <>
          {numField(f.maintenanceMarginRate, 'maintenanceMarginRate', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
          {numField(f.entrustedMarginRate, 'entrustedMarginRate', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
        </>
      )}

      {mode === 'perContract' && (
        <>
          {numField(f.maintenanceMarginPerContract, 'maintenanceMarginPerContract', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
          {numField(f.entrustedMarginPerContract, 'entrustedMarginPerContract', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
        </>
      )}

      {mode === 'total' && (
        <>
          {numField(f.maintenanceMargin, 'maintenanceMargin', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
          {numField(f.entrustedMargin, 'entrustedMargin', inputs, onChange, false, undefined, true, tooltipLabel, guardProps)}
        </>
      )}

      <div className="field-section-footer">
        <SaveDraftToggle />
      </div>
    </div>
  )
}

function AccountSettingChangeModal({
  title,
  body,
  confirmLabel,
  cancelLabel,
  skipLabel,
  dontShowAgain,
  onDontShowAgainChange,
  onConfirm,
  onCancel,
}: {
  title: string
  body: string
  confirmLabel: string
  cancelLabel: string
  skipLabel: string
  dontShowAgain: boolean
  onDontShowAgainChange: (value: boolean) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])

  const modal = (
    <div
      className="disclaimer-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="disclaimer-modal draft-save-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-setting-guard-title"
      >
        <h2 id="account-setting-guard-title" className="disclaimer-modal-title">
          {title}
        </h2>
        <p className="disclaimer-modal-text">{body}</p>
        <div className="account-setting-guard-actions">
          <button type="button" className="btn btn-ghost draft-save-modal-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary draft-save-modal-btn"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
        <div className="draft-save-modal-footer">
          <label className="draft-save-skip">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => onDontShowAgainChange(e.target.checked)}
            />
            <span>{skipLabel}</span>
          </label>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  const { t } = useLanguage()
  const f = t.fields
  const scenarioModeActive = isPreviewModeActive(inputs)
  const displayInputs = resolveInputPanelDisplayInputs(inputs)
  const tickPnl = calcPositionTickPnl(displayInputs)
  const setupComplete = isAccountSetupComplete(inputs)
  const frozenFieldClass = setupComplete ? 'field--setup-screen' : ''
  // 세팅 완료 후에는 baseline 필드가 잠긴다. 편집을 시도하면 확인창이 뜨고,
  // 확인해야 잠금이 풀려 편집할 수 있다. 현재가/틱사이즈는 잠금 대상이 아니다.
  const [settingsUnlocked, setSettingsUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const guardLocked = setupComplete && !settingsUnlocked

  function requestUnlock() {
    if (readSkipAccountSettingGuard()) {
      confirmUnlock()
      return
    }
    setDontShowAgain(false)
    setUnlockModalOpen(true)
  }

  function confirmUnlock() {
    if (dontShowAgain) setSkipAccountSettingGuard(true)
    setSettingsUnlocked(true)
    setUnlockModalOpen(false)
  }

  function cancelUnlock() {
    setUnlockModalOpen(false)
  }

  return (
    <>
    <section className="panel input-panel">
      <div className="input-panel__head">
        <h2>
          <span>{t.input}</span>
          <ActiveNumberSetLabel />
        </h2>
        <ClearAllInputsButton disabled={scenarioModeActive} />
      </div>

      <div className="input-sections">
        <div className="field-section field-section--position">
          <SectionTitle>{t.position}</SectionTitle>
          <div className="side-toggle">
            {(['long', 'short'] as const).map((side) => (
              <button
                key={side}
                type="button"
                className={`side-btn ${inputs.positionSide === side ? 'active' : ''}`}
                disabled={scenarioModeActive}
                onClick={() =>
                  guardLocked ? requestUnlock() : onChange({ positionSide: side })
                }
              >
                {side === 'long' ? t.long : t.short}
              </button>
            ))}
          </div>
        </div>

        <div className="field-section field-section--account">
          <SectionTitle>{t.sections.account}</SectionTitle>
          <Field
            label={f.accountEquity.label}
            tooltip={f.accountEquity.hint}
            tooltipLabel={t.fieldTooltipLabel}
            tooltipGuideHref={GUIDE_PATH}
            tooltipGuideLinkLabel={t.tooltipGuideLink}
            className={`${frozenFieldClass} fh-equity`.trim()}
          >
            <NumberInput
              value={displayInputs.accountEval}
              allowDecimal={false}
              placeholder={f.accountEquity.placeholder || undefined}
              disabled={scenarioModeActive}
              guardLocked={guardLocked}
              onGuardBlocked={requestUnlock}
              onChange={(v, meta) =>
                onChange(
                  { accountEval: v, evalSnapshotSide: inputs.positionSide },
                  historyOptions(meta),
                )
              }
            />
          </Field>
          {numField(f.contractAmount, 'contractAmount', displayInputs, onChange, false, t.optional, true, t.fieldTooltipLabel, {
            disabled: scenarioModeActive,
            className: `${frozenFieldClass} fh-entry`.trim(),
            guardLocked,
            onGuardBlocked: requestUnlock,
          })}
          <Field
            label={f.contracts.label}
            labelId="contracts-label"
            tooltip={f.contracts.hint}
            tooltipLabel={t.fieldTooltipLabel}
            className={`${frozenFieldClass} fh-contracts`.trim()}
          >
            <NumberStepper
              value={displayInputs.contracts}
              step={1}
              allowNegative={false}
              placeholder={f.contracts.placeholder || undefined}
              stepUpLabel={t.stepUp}
              stepDownLabel={t.stepDown}
              ariaLabelledBy="contracts-label"
              disabled={scenarioModeActive}
              guardLocked={guardLocked}
              onGuardBlocked={requestUnlock}
              onChange={(v, meta) =>
                onChange(
                  { contracts: v === undefined ? v : Math.max(0, v) },
                  historyOptions(meta),
                )
              }
            />
          </Field>
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.instrument}</SectionTitle>
          <div className="fh-mark">
            <CurrentPriceField
              inputs={inputs}
              onChange={onChange}
              field={f.currentPrice}
              stepUpLabel={t.stepUp}
              stepDownLabel={t.stepDown}
              tooltipLabel={t.fieldTooltipLabel}
              tooltipGuideHref={GUIDE_PATH}
              tooltipGuideLinkLabel={t.tooltipGuideLink}
              disabled={scenarioModeActive}
              rollPnlOnChange={setupComplete}
            />
          </div>
          {numField(f.contractMultiplier, 'contractMultiplier', inputs, onChange, false, t.optional, true, t.fieldTooltipLabel, {
            disabled: scenarioModeActive,
            className: `${frozenFieldClass} fh-mult`.trim(),
            guardLocked,
            onGuardBlocked: requestUnlock,
          })}
          {numField(
            f.tickSize,
            'tickSize',
            inputs,
            onChange,
            true,
            t.optional,
            true,
            t.fieldTooltipLabel,
            {
              disabled: scenarioModeActive,
            },
          )}
          <DerivedMetricField
            label={t.results.tickPnl}
            value={formatTickPnl(tickPnl)}
          />
        </div>

        <MarginSection
          inputs={inputs}
          onChange={onChange}
          setupScreen={setupComplete}
          guardLocked={guardLocked}
          onGuardBlocked={requestUnlock}
        />
      </div>
    </section>
    {unlockModalOpen && (
      <AccountSettingChangeModal
        title={t.accountSettingGuard.title}
        body={t.accountSettingGuard.body}
        confirmLabel={t.accountSettingGuard.confirm}
        cancelLabel={t.accountSettingGuard.cancel}
        skipLabel={t.accountSettingGuard.skipModalLabel}
        dontShowAgain={dontShowAgain}
        onDontShowAgainChange={setDontShowAgain}
        onConfirm={confirmUnlock}
        onCancel={cancelUnlock}
      />
    )}
    </>
  )
}
