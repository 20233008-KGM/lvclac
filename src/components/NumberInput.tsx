import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
  formatNumberForInput,
  formatRateForInput,
  formatRawNumericInput,
  formatRawRateInput,
  normalizeInputValue,
  parseFormattedInput,
} from '../utils/inputFormat'

export interface NumberInputHandle {
  commit: () => boolean
}

interface NumberInputProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  /** blur 시에만 onChange/onCommit 호출 (타이핑 중 부모 state 미갱신) */
  deferChangeUntilBlur?: boolean
  /** defer 모드에서 blur 확정 시 호출 (없으면 onChange 사용) */
  onCommit?: (value: number | undefined) => void
  /** defer 모드에서 onCommit이 있으면 값이 같아도 commit 호출 */
  forceCommit?: boolean
  allowDecimal?: boolean
  allowNegative?: boolean
  optional?: boolean
  /** 비율 필드 — 콤마 없이 소수 입력 */
  isRate?: boolean
  placeholder?: string
  'aria-labelledby'?: string
  className?: string
}

export const NumberInput = forwardRef<NumberInputHandle, NumberInputProps>(function NumberInput(
  {
    value,
    onChange,
    deferChangeUntilBlur = false,
    onCommit,
    forceCommit = false,
    allowDecimal = false,
    allowNegative = false,
    isRate = false,
    placeholder,
    'aria-labelledby': ariaLabelledBy,
    className,
  },
  ref,
) {
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

  function commitFromText(): boolean {
    const parsed = parseFormattedInput(text)
    if (parsed === '') {
      setText(formatValue(value))
      return false
    }
    const normalized = normalizeInputValue(parsed, { isRate, allowDecimal })
    const handler = onCommit ?? onChange
    const shouldCommit =
      deferChangeUntilBlur && onCommit
        ? forceCommit || normalized !== value
        : normalized !== value

    if (shouldCommit) {
      handler(normalized)
    }
    setText(formatValue(normalized))
    setFocused(false)
    return shouldCommit
  }

  useImperativeHandle(ref, () => ({
    commit: commitFromText,
  }))

  return (
    <input
      type="text"
      inputMode={allowDecimal || isRate ? 'decimal' : 'numeric'}
      placeholder={placeholder}
      aria-labelledby={ariaLabelledBy}
      className={className}
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        if (!deferChangeUntilBlur) {
          setFocused(false)
          const parsed = parseFormattedInput(text)
          if (parsed === '') {
            setText(formatValue(value))
            return
          }
          const normalized = normalizeInputValue(parsed, { isRate, allowDecimal })
          if (normalized !== value) onChange(normalized)
          setText(formatValue(normalized))
          return
        }
        commitFromText()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && deferChangeUntilBlur) {
          e.preventDefault()
          commitFromText()
          e.currentTarget.blur()
        }
      }}
      onChange={(e) => {
        const formatted = formatRaw(e.target.value)
        setText(formatted)

        if (deferChangeUntilBlur) return

        const parsed = parseFormattedInput(formatted)
        if (parsed === '') {
          onChange(undefined)
          return
        }
        onChange(parsed)
      }}
    />
  )
})
