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
  optional?: boolean
  /** 비율 필드 — 콤마 없이 소수 입력 */
  isRate?: boolean
  placeholder?: string
}

export function NumberInput({
  value,
  onChange,
  allowDecimal = false,
  isRate = false,
  placeholder,
}: NumberInputProps) {
  const formatValue = isRate
    ? (v: number | undefined | null) => formatRateForInput(v)
    : (v: number | undefined | null) => formatNumberForInput(v, allowDecimal)

  const formatRaw = isRate
    ? formatRawRateInput
    : (raw: string) => formatRawNumericInput(raw, allowDecimal)

  const [text, setText] = useState(() => formatValue(value))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(formatValue(value))
    }
  }, [value, focused, isRate, allowDecimal])

  return (
    <input
      type="text"
      inputMode={allowDecimal || isRate ? 'decimal' : 'numeric'}
      placeholder={placeholder}
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
