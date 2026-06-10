import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import { useLanguage } from '../i18n'
import { FieldLabelTooltip } from './FieldLabelTooltip'
import { NumberInput } from './NumberInput'
import { SaveDraftToggle } from './SaveDraftToggle'

interface InputPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
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
  children,
}: {
  label: string
  optionalText?: string
  tooltip?: string
  tooltipLabel?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label-row">
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
  onChange: (patch: Partial<CalculatorInputs>) => void,
  optional = false,
  optionalText?: string,
  showTooltip = false,
  tooltipLabel?: string,
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
        onChange={(v) => onChange({ [key]: v })}
      />
    </Field>
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
        <div className="field-section">
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
          {numField(f.contracts, 'contracts', inputs, onChange)}
          {numField(f.contractAmount, 'contractAmount', inputs, onChange, true, t.optional)}
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.instrument}</SectionTitle>
          {numField(f.currentPrice, 'currentPrice', inputs, onChange)}
          {numField(f.contractMultiplier, 'contractMultiplier', inputs, onChange, true, t.optional)}
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
