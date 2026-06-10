import { useRef } from 'react'
import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import { isScenarioModeActive, type CalculatorInputPatch } from '../calc/mtmLink'
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
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0

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
          onChange={(v) => onChange({ currentPrice: v })}
        />
      </Field>
    )
  }

  return (
    <Field label={field.label} labelId="current-price-label">
      <NumberInput
        value={inputs.currentPrice}
        allowDecimal={false}
        placeholder={field.placeholder || undefined}
        aria-labelledby="current-price-label"
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
  clearLabel,
  applyPnlLabel,
}: {
  inputs: CalculatorInputs
  onChange: (patch: CalculatorInputPatch) => void
  field: FieldCopy
  stepUpLabel: string
  stepDownLabel: string
  tooltipLabel: string
  commitLabel: string
  clearLabel: string
  applyPnlLabel: string
}) {
  const inputRef = useRef<NumberInputHandle>(null)
  const tickSize = inputs.tickSize
  const useStepper = tickSize != null && tickSize > 0
  const scenarioModeActive = isScenarioModeActive(inputs)

  function commitScenario(price: number) {
    onChange({ commitScenarioPrice: price })
  }

  function clearScenario() {
    onChange({ clearScenario: true })
  }

  function resolveScenarioPrice(): number | undefined {
    if (useStepper) return inputs.scenarioPrice
    return inputRef.current?.readDraft() ?? inputs.scenarioPrice
  }

  function applyScenarioToMark(price?: number) {
    const resolved = price ?? resolveScenarioPrice()
    if (resolved == null) return
    onChange({ applyScenarioToMark: resolved })
  }

  /** Enter/↵ — 미진입 시 시나리오 모드, 진입 후에는 현재가 반영·모드 종료 */
  function confirmScenario(price: number) {
    if (scenarioModeActive) {
      applyScenarioToMark(price)
    } else {
      commitScenario(price)
    }
  }

  function handleScenarioEnter() {
    const price = resolveScenarioPrice()
    if (price == null) return
    confirmScenario(price)
  }

  const applyPnlDisabled = useStepper && inputs.scenarioPrice == null

  const applyPnlButton = (
    <button
      type="button"
      className="scenario-apply-pnl-btn scenario-apply-pnl-btn--inline"
      disabled={applyPnlDisabled}
      tabIndex={scenarioModeActive ? 0 : -1}
      aria-hidden={!scenarioModeActive}
      onClick={() => applyScenarioToMark()}
    >
      {applyPnlLabel}
    </button>
  )

  const labelRow = (
    <span className="field-label-row field-label-row--with-action" id="scenario-price-label">
      <span className="field-label-text">
        {field.label}
        <FieldLabelTooltip text={field.hint} label={tooltipLabel} />
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
          del
        </button>
      </span>
    </span>
  )

  const commitButton = (
    <ScenarioPriceCommitButton
      label={commitLabel}
      disabled={!scenarioModeActive && inputs.scenarioPrice == null}
      onClick={() => {
        if (scenarioModeActive) {
          handleScenarioEnter()
          return
        }
        if (inputs.scenarioPrice != null) confirmScenario(inputs.scenarioPrice)
        else inputRef.current?.commit()
      }}
    />
  )

  if (useStepper) {
    return (
      <div className="field">
        {labelRow}
        <div
          className={`input-commit-row${scenarioModeActive ? ' input-commit-row--no-commit' : ''}`}
        >
          <NumberStepper
            value={inputs.scenarioPrice}
            step={tickSize}
            allowNegative={false}
            placeholder={field.placeholder || undefined}
            stepUpLabel={stepUpLabel}
            stepDownLabel={stepDownLabel}
            ariaLabelledBy="scenario-price-label"
            onEnterKey={handleScenarioEnter}
            onDeleteKey={scenarioModeActive ? clearScenario : undefined}
            onChange={(v) => onChange({ scenarioPrice: v })}
          />
          <span className="input-commit-btn-slot">
            <span
              className={scenarioModeActive ? 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden' : 'input-commit-btn-slot__layer'}
              aria-hidden={scenarioModeActive}
            >
              {commitButton}
            </span>
            <span
              className={scenarioModeActive ? 'input-commit-btn-slot__layer' : 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden'}
              aria-hidden={!scenarioModeActive}
            >
              {applyPnlButton}
            </span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="field">
      {labelRow}
      <div
        className={`input-commit-row${scenarioModeActive ? ' input-commit-row--no-commit' : ''}`}
      >
        <NumberInput
          ref={inputRef}
          value={inputs.scenarioPrice}
          allowDecimal={false}
          placeholder={field.placeholder || undefined}
          aria-labelledby="scenario-price-label"
          className={scenarioModeActive ? undefined : 'input-commit-row__input'}
          deferChangeUntilBlur
          forceCommit
          onEnterKey={handleScenarioEnter}
          onDeleteKey={scenarioModeActive ? clearScenario : undefined}
          onCommit={(v) => {
            if (v != null) confirmScenario(v)
          }}
          onChange={() => {}}
        />
        <span className="input-commit-btn-slot">
          <span
            className={scenarioModeActive ? 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden' : 'input-commit-btn-slot__layer'}
            aria-hidden={scenarioModeActive}
          >
            {commitButton}
          </span>
          <span
            className={scenarioModeActive ? 'input-commit-btn-slot__layer' : 'input-commit-btn-slot__layer input-commit-btn-slot__layer--hidden'}
            aria-hidden={!scenarioModeActive}
          >
            {applyPnlButton}
          </span>
        </span>
      </div>
    </div>
  )
}

export function InputPanel({ inputs, onChange }: InputPanelProps) {
  const { t } = useLanguage()
  const f = t.fields

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
          <ScenarioPriceField
            inputs={inputs}
            onChange={onChange}
            field={f.scenarioPrice}
            stepUpLabel={t.stepUp}
            stepDownLabel={t.stepDown}
            tooltipLabel={t.fieldTooltipLabel}
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
