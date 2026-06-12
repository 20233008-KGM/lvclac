import { useEffect, useRef } from 'react'
import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import {
  hasScenarioApplyUndo,
  isPreviewModeActive,
  isScenarioModeActive,
  resolveEvaluationInputs,
  type CalculatorInputPatch,
} from '../calc/mtmLink'
import { GUIDE_PATH } from '../config/routes'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import {
  CommitButtonSlot,
  ScenarioPriceApplyButton,
  ScenarioPriceCommitButton,
} from './InputCommitButton'
import { NumberInput, type NumberInputHandle } from './NumberInput'
import { NumberStepper } from './NumberStepper'
import {
  PRICE_SCRUB_PX_PER_TICK,
} from './numberStepperScrub'
import { ClearAllInputsButton } from './ClearAllInputsButton'
import { SaveDraftToggle } from './SaveDraftToggle'
import { formatNumberForInput } from '../utils/inputFormat'

interface InputPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
}

const DECIMAL_FIELDS = new Set<keyof CalculatorInputs>(['contractMultiplier'])
const RATE_FIELDS = new Set<keyof CalculatorInputs>([
  'maintenanceMarginRate',
  'entrustedMarginRate',
])

function Field({
  label,
  optionalText,
  tooltip,
  tooltipLabel,
  tooltipGuideHref,
  tooltipGuideLinkLabel,
  labelId,
  children,
}: {
  label: string
  optionalText?: string
  tooltip?: string
  tooltipLabel?: string
  tooltipGuideHref?: string
  tooltipGuideLinkLabel?: string
  labelId?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
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

function numField(
  field: FieldCopy,
  key: keyof CalculatorInputs,
  inputs: CalculatorInputs,
  onChange: (patch: CalculatorInputPatch) => void,
  optional = false,
  optionalText?: string,
  showTooltip = false,
  tooltipLabel?: string,
  inputProps?: Partial<{
    deferChangeUntilBlur: boolean
    onCommit: (value: number | undefined) => void
    disabled: boolean
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
        onChange={(v) => onChange({ [key]: v })}
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
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  tooltipGuideHref?: string
  tooltipGuideLinkLabel?: string
  disabled?: boolean
}) {
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
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
          disabled={disabled}
          enableDragScrub
          dragScrubPxPerTick={PRICE_SCRUB_PX_PER_TICK}
          onChange={(v) => onChange({ currentPrice: v })}
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
        onChange={(v) => onChange({ currentPrice: v })}
      />
    </Field>
  )
}

function ScenarioPriceField({
  inputs,
  onChange,
  field,
  stepUpLabel,
  stepDownLabel,
  tooltipLabel,
  tooltipGuideLink,
  commitLabel,
  clearLabel,
  applyPnlLabel,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  tooltipGuideLink: string
  commitLabel: string
  clearLabel: string
  applyPnlLabel: string
}) {
  const inputRef = useRef<NumberInputHandle>(null)
  const wasScenarioModeRef = useRef(false)
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  const scenarioModeActive = isScenarioModeActive(inputs)
  const scenarioApplyUndoAvailable = hasScenarioApplyUndo(inputs)

  function focusScenarioInput() {
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function commitScenario(price: number) {
    onChange({ commitScenarioPrice: price })
  }

  function clearScenario() {
    onChange({ clearScenario: true })
  }

  useEffect(() => {
    if (wasScenarioModeRef.current !== scenarioModeActive) {
      focusScenarioInput()
    }
    wasScenarioModeRef.current = scenarioModeActive
  }, [scenarioModeActive])

  useEffect(() => {
    if (!scenarioModeActive) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onChange({ clearScenario: true })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scenarioModeActive, onChange])

  useEffect(() => {
    if (!scenarioApplyUndoAvailable) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'z' || e.shiftKey || !(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      onChange({ undoScenarioApply: true })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scenarioApplyUndoAvailable, onChange])

  function resolveScenarioPrice(): number | undefined {
    if (useStepper) return inputs.scenarioPrice
    return inputRef.current?.readDraft() ?? inputs.scenarioPrice
  }

  function applyScenarioToMark(price?: number) {
    const resolved = price ?? resolveScenarioPrice()
    if (resolved == null) return
    onChange({ applyScenarioToMark: resolved })
  }

  /** Enter/↵ — 미진입: 시나리오 모드 진입 / 진입 후: 손익 반영 */
  function handleScenarioEnter() {
    const price = resolveScenarioPrice()
    if (price == null) return
    if (scenarioModeActive) {
      applyScenarioToMark(price)
    } else {
      commitScenario(price)
    }
  }

  function handleScenarioPriceChange(v: number | undefined) {
    onChange({ scenarioPrice: v })
  }

  const applyPnlDisabled = useStepper && inputs.scenarioPrice == null

  const scenarioPlaceholder =
    inputs.currentPrice != null
      ? formatNumberForInput(inputs.currentPrice)
      : field.placeholder || undefined

  const applyPnlButton = (
    <ScenarioPriceApplyButton
      label={applyPnlLabel}
      disabled={applyPnlDisabled}
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
          highlight={scenarioModeActive}
          guideHref={GUIDE_PATH}
          guideLinkLabel={tooltipGuideLink}
        />
      </span>
      <span className="field-label-action-slot">
        <button
          type="button"
          className={`field-label-del-btn field-label-del-btn--scenario${scenarioModeActive ? '' : ' field-label-del-btn--hidden'}`}
          aria-label={clearLabel}
          title={clearLabel}
          tabIndex={scenarioModeActive ? 0 : -1}
          aria-hidden={!scenarioModeActive}
          onClick={clearScenario}
        >
          esc
        </button>
      </span>
    </span>
  )

  const commitButton = (
    <ScenarioPriceCommitButton
      label={commitLabel}
      disabled={!scenarioModeActive && inputs.scenarioPrice == null}
      onClick={() => {
        const price = resolveScenarioPrice()
        if (price != null) handleScenarioEnter()
      }}
    />
  )

  const commitBtnSlot = (
    <CommitButtonSlot
      previewActive={scenarioModeActive}
      commitButton={commitButton}
      applyButton={applyPnlButton}
    />
  )

  if (useStepper) {
    return (
      <div className="field">
        {labelRow}
        <NumberStepper
          ref={inputRef}
          value={inputs.scenarioPrice}
          step={tickSize}
          allowNegative={false}
          placeholder={scenarioPlaceholder}
          stepUpLabel={stepUpLabel}
          stepDownLabel={stepDownLabel}
          ariaLabelledBy="scenario-price-label"
          inlineSlot={commitBtnSlot}
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
          value={inputs.scenarioPrice}
          allowDecimal={false}
          placeholder={scenarioPlaceholder}
          aria-labelledby="scenario-price-label"
          className="input-commit-row__input"
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

function MarginSection({
  inputs,
  onChange,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
}) {
  const { t } = useLanguage()
  const f = t.fields
  const m = t.marginMode
  const scenarioModeActive = isPreviewModeActive(inputs)
  const mode = inputs.marginInputMode ?? 'rate'

  const tooltipLabel = t.fieldTooltipLabel

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
              onClick={() => onChange({ marginInputMode: value })}
            >
              {m[value]}
            </button>
          ))}
        </div>
        <FieldLabelTooltip text={m.tooltip} label={m.label} />
      </div>

      {mode === 'rate' && (
        <>
          {numField(f.maintenanceMarginRate, 'maintenanceMarginRate', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
          {numField(f.entrustedMarginRate, 'entrustedMarginRate', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
        </>
      )}

      {mode === 'perContract' && (
        <>
          {numField(f.maintenanceMarginPerContract, 'maintenanceMarginPerContract', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
          {numField(f.entrustedMarginPerContract, 'entrustedMarginPerContract', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
        </>
      )}

      {mode === 'total' && (
        <>
          {numField(f.maintenanceMargin, 'maintenanceMargin', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
          {numField(f.entrustedMargin, 'entrustedMargin', inputs, onChange, false, undefined, true, tooltipLabel, {
            disabled: scenarioModeActive,
          })}
        </>
      )}

      <div className="field-section-footer">
        <SaveDraftToggle />
      </div>
    </div>
  )
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  const { t } = useLanguage()
  const f = t.fields
  const scenarioModeActive = isPreviewModeActive(inputs)
  const previewInputs = scenarioModeActive ? resolveEvaluationInputs(inputs) : inputs

  return (
    <section className="panel input-panel">
      <div className="input-panel__head">
        <h2>{t.input}</h2>
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
                onClick={() => onChange({ positionSide: side })}
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
          >
            <NumberInput
              value={previewInputs.accountEval}
              allowDecimal={false}
              placeholder={f.accountEquity.placeholder || undefined}
              disabled={scenarioModeActive}
              onChange={(v) =>
                onChange({ accountEval: v, evalSnapshotSide: inputs.positionSide })
              }
            />
          </Field>
          {numField(f.contractAmount, 'contractAmount', inputs, onChange, true, t.optional, true, t.fieldTooltipLabel, {
            disabled: scenarioModeActive,
          })}
          <Field
            label={f.contracts.label}
            labelId="contracts-label"
            tooltip={f.contracts.hint}
            tooltipLabel={t.fieldTooltipLabel}
          >
            <NumberStepper
              value={previewInputs.contracts}
              step={1}
              allowNegative={false}
              placeholder={f.contracts.placeholder || undefined}
              stepUpLabel={t.stepUp}
              stepDownLabel={t.stepDown}
              ariaLabelledBy="contracts-label"
              disabled={scenarioModeActive}
              onChange={(v) =>
                onChange({ contracts: v === undefined ? v : Math.max(0, v) })
              }
            />
          </Field>
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.instrument}</SectionTitle>
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
          />
          {numField(f.contractMultiplier, 'contractMultiplier', inputs, onChange, true, t.optional, true, t.fieldTooltipLabel, {
            disabled: scenarioModeActive,
          })}
          <ScenarioPriceField
            inputs={inputs}
            onChange={onChange}
            field={f.scenarioPrice}
            stepUpLabel={t.stepUp}
            stepDownLabel={t.stepDown}
            tooltipLabel={t.fieldTooltipLabel}
            tooltipGuideLink={t.tooltipGuideLink}
            commitLabel={t.scenarioPriceCommit}
            clearLabel={t.scenarioPriceClear}
            applyPnlLabel={t.scenarioApplyPnl}
          />
          {numField(
            f.tickSize,
            'tickSize',
            inputs,
            onChange,
            true,
            t.optional,
            true,
            t.fieldTooltipLabel,
            { disabled: scenarioModeActive },
          )}
        </div>

        <MarginSection inputs={inputs} onChange={onChange} />
      </div>
    </section>
  )
}
