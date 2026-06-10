import { useRef } from 'react'
import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import type { CalculatorInputPatch } from '../calc/mtmLink'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import { NumberInput, type NumberInputHandle } from './NumberInput'
import { NumberStepper } from './NumberStepper'
import { SaveDraftToggle } from './SaveDraftToggle'

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
  labelId,
  children,
}: {
  label: string
  optionalText?: string
  tooltip?: string
  tooltipLabel?: string
  labelId?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label-row" id={labelId}>
        <span className="field-label-text">
          {label}
          {optionalText && <em className="optional"> {optionalText}</em>}
          {tooltip && tooltipLabel && <FieldLabelTooltip text={tooltip} label={tooltipLabel} />}
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
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
}) {
  const single = inputs.singleInstrument ?? false
  const tickSize = inputs.tickSize
  const useStepper = single && tickSize != null && tickSize > 0

  if (useStepper) {
    return (
      <Field label={field.label} labelId="current-price-label">
        <NumberStepper
          value={inputs.currentPrice}
          step={tickSize}
          allowNegative={false}
          placeholder={field.placeholder || undefined}
          stepUpLabel={stepUpLabel}
          stepDownLabel={stepDownLabel}
          ariaLabelledBy="current-price-label"
          onChange={(v) => {
            if (v == null || inputs.currentPrice == null) return
            if (v > inputs.currentPrice) onChange({ tickCurrentPrice: 1 })
            else if (v < inputs.currentPrice) onChange({ tickCurrentPrice: -1 })
          }}
        />
      </Field>
    )
  }

  if (single) {
    return (
      <Field label={field.label} labelId="current-price-label">
        <NumberInput
          value={inputs.currentPrice}
          allowDecimal={false}
          placeholder={field.placeholder || undefined}
          aria-labelledby="current-price-label"
          deferChangeUntilBlur
          onCommit={(v) => {
            if (v != null) onChange({ commitCurrentPrice: v })
          }}
          onChange={() => {}}
        />
      </Field>
    )
  }

  return (
    <Field label={field.label}>
      <NumberInput
        value={inputs.currentPrice}
        allowDecimal={false}
        placeholder={field.placeholder || undefined}
        onChange={(v) => onChange({ currentPrice: v })}
      />
    </Field>
  )
}

function ScenarioPriceCommitButton({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="input-commit-btn"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      ↵
    </button>
  )
}

function ScenarioPriceField({
  inputs,
  onChange,
  field,
  stepUpLabel,
  stepDownLabel,
  tooltipLabel,
  commitLabel,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  commitLabel: string
}) {
  const inputRef = useRef<NumberInputHandle>(null)
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0

  function commitScenario(price: number) {
    onChange({ commitScenarioPrice: price })
  }

  if (useStepper) {
    return (
      <Field
        label={field.label}
        labelId="scenario-price-label"
        tooltip={field.hint}
        tooltipLabel={tooltipLabel}
      >
        <div className="input-commit-row">
          <NumberStepper
            value={inputs.scenarioPrice}
            step={tickSize}
            allowNegative={false}
            placeholder={field.placeholder || undefined}
            stepUpLabel={stepUpLabel}
            stepDownLabel={stepDownLabel}
            ariaLabelledBy="scenario-price-label"
            onChange={(v) => onChange({ scenarioPrice: v })}
          />
          <ScenarioPriceCommitButton
            label={commitLabel}
            disabled={inputs.scenarioPrice == null}
            onClick={() => {
              if (inputs.scenarioPrice != null) commitScenario(inputs.scenarioPrice)
            }}
          />
        </div>
      </Field>
    )
  }

  return (
    <Field
      label={field.label}
      labelId="scenario-price-label"
      tooltip={field.hint}
      tooltipLabel={tooltipLabel}
    >
      <div className="input-commit-row">
        <NumberInput
          ref={inputRef}
          value={inputs.scenarioPrice}
          allowDecimal={false}
          placeholder={field.placeholder || undefined}
          aria-labelledby="scenario-price-label"
          className="input-commit-row__input"
          deferChangeUntilBlur
          forceCommit
          onCommit={(v) => {
            if (v != null) commitScenario(v)
          }}
          onChange={() => {}}
        />
        <ScenarioPriceCommitButton
          label={commitLabel}
          onClick={() => inputRef.current?.commit()}
        />
      </div>
    </Field>
  )
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  const { t } = useLanguage()
  const f = t.fields
  const singleInstrument = inputs.singleInstrument ?? false

  return (
    <section className="panel input-panel">
      <h2>{t.input}</h2>

      <div className="input-controls">
        <div className="field">
          <span className="field-label-row">{t.position}</span>
          <div className="side-toggle">
            {(['long', 'short'] as const).map((side) => (
              <button
                key={side}
                type="button"
                className={`side-btn ${inputs.positionSide === side ? 'active' : ''}`}
                onClick={() => onChange({ positionSide: side })}
              >
                {side === 'long' ? t.long : t.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="input-sections">
        <div className="field-section field-section--account">
          <SectionTitle>{t.sections.account}</SectionTitle>
          <Field
            label={f.accountEquity.label}
            tooltip={f.accountEquity.hint}
            tooltipLabel={t.fieldTooltipLabel}
          >
            <NumberInput
              value={inputs.accountEval}
              allowDecimal={false}
              placeholder={f.accountEquity.placeholder || undefined}
              onChange={(v) =>
                onChange({ accountEval: v, evalSnapshotSide: inputs.positionSide })
              }
            />
          </Field>
          {numField(f.contractAmount, 'contractAmount', inputs, onChange, true, t.optional)}
          <Field label={f.contracts.label} labelId="contracts-label">
            <NumberStepper
              value={inputs.contracts}
              step={1}
              allowNegative={false}
              placeholder={f.contracts.placeholder || undefined}
              stepUpLabel={t.stepUp}
              stepDownLabel={t.stepDown}
              ariaLabelledBy="contracts-label"
              onChange={(v) =>
                onChange({ contracts: v === undefined ? v : Math.max(0, v) })
              }
            />
          </Field>
          <div className="account-single-instrument-cell">
            <label className="input-option-toggle">
              <input
                type="checkbox"
                checked={singleInstrument}
                onChange={(e) => onChange({ singleInstrument: e.target.checked })}
              />
              <span className="input-option-toggle__label">
                {t.singleInstrument.label}
                <FieldLabelTooltip text={t.singleInstrument.hint} label={t.fieldTooltipLabel} />
              </span>
            </label>
          </div>
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.instrument}</SectionTitle>
          <CurrentPriceField
            inputs={inputs}
            onChange={onChange}
            field={f.currentPrice}
            stepUpLabel={t.stepUp}
            stepDownLabel={t.stepDown}
          />
          {numField(f.contractMultiplier, 'contractMultiplier', inputs, onChange, true, t.optional)}
          {singleInstrument && (
            <>
              <ScenarioPriceField
                inputs={inputs}
                onChange={onChange}
                field={f.scenarioPrice}
                stepUpLabel={t.stepUp}
                stepDownLabel={t.stepDown}
                tooltipLabel={t.fieldTooltipLabel}
                commitLabel={t.scenarioPriceCommit}
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
              )}
            </>
          )}
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.margin}</SectionTitle>
          {numField(f.maintenanceMarginRate, 'maintenanceMarginRate', inputs, onChange)}
          {numField(f.maintenanceMargin, 'maintenanceMargin', inputs, onChange, true, t.optional)}
          {numField(f.entrustedMarginRate, 'entrustedMarginRate', inputs, onChange)}
          {numField(f.entrustedMargin, 'entrustedMargin', inputs, onChange, true, t.optional)}
        </div>
      </div>

      <SaveDraftToggle />
    </section>
  )
}
