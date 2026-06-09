import { useEffect, useState } from 'react'
import {
  formatNumberForInput,
  formatRateForInput,
  formatRawNumericInput,
  formatRawRateInput,
  normalizeInputValue,
  parseFormattedInput,
} from '../utils/inputFormat'

interface NumberInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  allowDecimal?: boolean
  allowNegative?: boolean
  optional?: boolean
  /** 비율 필드 — 콤마 없이 소수 입력 */
  isRate?: boolean
  placeholder?: string
  'aria-labelledby'?: string
}

export function NumberInput({
  value,
  onChange,
  allowDecimal = false,
  allowNegative = false,
  isRate = false,
  placeholder,
  'aria-labelledby': ariaLabelledBy,
}: NumberInputProps) {
  const formatValue = isRate
    ? (v: number | undefined | null) => formatRateForInput(v)
    : (v: number | undefined | null) => formatNumberForInput(v, allowDecimal, allowNegative)

  const formatRaw = isRate
    ? formatRawRateInput
    : (raw: string) => formatRawNumericInput(raw, allowDecimal, allowNegative)

  const [text, setText] = useState(() => formatValue(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(formatValue(value))
    }
  }, [value, focused, isRate, allowDecimal, allowNegative])

  return (
    <input
      type="text"
      inputMode={allowDecimal || isRate ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      aria-labelledby={ariaLabelledBy}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        const parsed = parseFormattedInput(text)
        if (parsed === '') {
          setText(formatValue(value))
          return
        }
        const normalized = normalizeInputValue(parsed, { isRate, allowDecimal })
        if (normalized !== value) onChange(normalized)
        setText(formatValue(normalized))
      }}
      onChange={(e) => {
        const formatted = formatRaw(e.target.value)
        setText(formatted)

        const parsed = parseFormattedInput(formatted)
        if (parsed === '') {
          onChange(undefined)
          return
        }
        onChange(parsed)
      }}
    />
  )
}
