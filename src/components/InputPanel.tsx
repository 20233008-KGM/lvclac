import type { CalculatorInputs } from '../types'
import { useLanguage } from '../i18n'
import { NumberInput } from './NumberInput'

interface InputPanelProps {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

const DECIMAL_FIELDS = new Set<keyof CalculatorInputs>(['contractMultiplier'])

const RATE_PLACEHOLDERS: Partial<Record<keyof CalculatorInputs, string>> = {
  maintenanceMarginRate: '0.247',
  entrustedMarginRate: '0.350',
}

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

function numField(
  label: string,
  key: keyof CalculatorInputs,
  inputs: CalculatorInputs,
  onChange: (patch: Partial<CalculatorInputs>) => void,
  optional = false,
  optionalText?: string,
) {
  const value = inputs[key] as number | undefined
  const allowDecimal = DECIMAL_FIELDS.has(key)
  const isRate = key in RATE_PLACEHOLDERS

  return (
    <Field key={key} label={label} optionalText={optional ? optionalText : undefined}>
      <NumberInput
        value={value}
        allowDecimal={allowDecimal || isRate}
        isRate={isRate}
        optional={optional}
        placeholder={RATE_PLACEHOLDERS[key]}
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
          <span className="field-label-spacer" aria-hidden="true">
            &nbsp;
          </span>
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
          <span>{t.position}</span>
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

      <div className="field-grid">
        {numField(f.accountEquity.label, 'accountEval', inputs, onChange)}
        {numField(f.maintenanceMarginRate.label, 'maintenanceMarginRate', inputs, onChange)}
        {numField(f.maintenanceMargin.label, 'maintenanceMargin', inputs, onChange, true, t.optional)}
        {numField(f.entrustedMarginRate.label, 'entrustedMarginRate', inputs, onChange)}
        {numField(f.contracts.label, 'contracts', inputs, onChange)}
        {numField(f.contractAmount.label, 'contractAmount', inputs, onChange)}
        {numField(f.currentPrice.label, 'currentPrice', inputs, onChange)}
        {numField(f.contractMultiplier.label, 'contractMultiplier', inputs, onChange)}
        {isOrder && numField(f.orderContracts.label, 'orderContracts', inputs, onChange)}
      </div>
    </section>
  )
}
