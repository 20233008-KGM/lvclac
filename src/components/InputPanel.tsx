import type { CalculatorInputs } from '../types'
import type { FieldCopy } from '../i18n/types'
import { useLanguage } from '../i18n'
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
  children,
}: {
  label: string
  optionalText?: string
  children: React.ReactNode
}) {
  return (
    <label className="field">
      <span className="field-label-row">
        <span>
          {label}
          {optionalText && <em className="optional"> {optionalText}</em>}
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
) {
  const value = inputs[key] as number | undefined
  const allowDecimal = DECIMAL_FIELDS.has(key)
  const isRate = RATE_FIELDS.has(key)

  return (
    <Field key={key} label={field.label} optionalText={optional ? optionalText : undefined}>
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
  const isOrder = inputs.mode === 'order'
  const f = t.fields

  return (
    <section className="panel input-panel">
      <h2>{t.input}</h2>

      <div className="input-controls">
        <div className="field">
          <span className="field-label-row">{t.modeLabel}</span>
          <div className="mode-toggle">
            {(['evaluate', 'order'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`mode-btn ${inputs.mode === mode ? 'active' : ''}`}
                onClick={() => onChange({ mode })}
              >
                {t.modes[mode]}
              </button>
            ))}
          </div>
        </div>

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
          {numField(f.accountEquity, 'accountEval', inputs, onChange)}
          {numField(f.contracts, 'contracts', inputs, onChange)}
          {numField(f.contractAmount, 'contractAmount', inputs, onChange, true, t.optional)}
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.instrument}</SectionTitle>
          {numField(f.currentPrice, 'currentPrice', inputs, onChange)}
          {numField(f.contractMultiplier, 'contractMultiplier', inputs, onChange, true, t.optional)}
          {isOrder && numField(f.orderContracts, 'orderContracts', inputs, onChange)}
        </div>

        <div className="field-section">
          <SectionTitle>{t.sections.margin}</SectionTitle>
          {numField(f.maintenanceMarginRate, 'maintenanceMarginRate', inputs, onChange, true, t.optional)}
          {numField(f.maintenanceMargin, 'maintenanceMargin', inputs, onChange, true, t.optional)}
          {numField(f.entrustedMarginRate, 'entrustedMarginRate', inputs, onChange, true, t.optional)}
          {numField(f.entrustedMargin, 'entrustedMargin', inputs, onChange, true, t.optional)}
        </div>
      </div>

      <SaveDraftToggle />
    </section>
  )
}
