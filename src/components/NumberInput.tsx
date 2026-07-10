import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useLayout } from '../context/LayoutContext'
import { useOverflowEllipsis } from '../hooks/useOverflowEllipsis'
import { useLanguage } from '../i18n'
import {
  formatNumberForInput,
  formatRateForInput,
  formatRawNumericInput,
  formatRawRateInput,
  normalizeInputValue,
  parseFormattedInput,
  shouldShowDigitLimitBorder,
  shouldShowDigitLimitHint,
  wasIntegerDigitTruncated,
} from '../utils/inputFormat'

export interface NumberInputHandle {
  commit: () => boolean
  /** defer 모드에서 입력 중 draft 값 읽기 */
  readDraft: () => number | undefined
  focus: () => void
}

export interface NumberInputChangeMeta {
  historyGroup?: string
}

interface NumberInputProps {
  value: number | undefined
  onChange: (value: number | undefined, meta?: NumberInputChangeMeta) => void
  /** blur 시에만 onChange/onCommit 호출 (타이핑 중 부모 state 미갱신) */
  deferChangeUntilBlur?: boolean
  /** defer 모드에서 blur 확정 시 호출 (없으면 onChange 사용) */
  onCommit?: (value: number | undefined, meta?: NumberInputChangeMeta) => void
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
  /** Delete 키 입력 시 (시나리오 초기화 등) */
  onDeleteKey?: () => void
  /** Enter 키 입력 시 (defer 없이도 사용 가능) */
  onEnterKey?: () => void
  disabled?: boolean
  /** 잠금 상태 — 포커스/편집 시도 시 onGuardBlocked 호출 후 편집 차단 */
  guardLocked?: boolean
  /** 잠금 상태에서 편집을 시도했을 때 */
  onGuardBlocked?: () => void
}

let nextNumberInputInstanceId = 0

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
    onDeleteKey,
    onEnterKey,
    disabled = false,
    guardLocked = false,
    onGuardBlocked,
  },
  ref,
) {
  const { t } = useLanguage()
  const { layoutMode, fitScale } = useLayout()
  const skipBlurCommitRef = useRef(false)
  const inputElRef = useRef<HTMLInputElement>(null)
  const inputInstanceIdRef = useRef(++nextNumberInputInstanceId)
  const historyGroupSerialRef = useRef(0)
  const historyGroupRef = useRef<string | null>(null)
  const formatValue = isRate
    ? (v: number | undefined | null) => formatRateForInput(v)
    : (v: number | undefined | null) => formatNumberForInput(v, allowDecimal, allowNegative)

  const formatRaw = isRate
    ? formatRawRateInput
    : (raw: string) => formatRawNumericInput(raw, allowDecimal, allowNegative)

  const [text, setText] = useState(() => formatValue(value))
  const [focused, setFocused] = useState(false)
  const [truncatedAttempt, setTruncatedAttempt] = useState(false)

  useEffect(() => {
    if (!focused) {
      setText(formatValue(value))
      setTruncatedAttempt(false)
      return
    }
    if (readDraftFromText() !== value) {
      setText(formatValue(value))
    }
  }, [value, focused, isRate, allowDecimal, allowNegative])

  function readDraftFromText(): number | undefined {
    const parsed = parseFormattedInput(text)
    if (parsed === '') return undefined
    return normalizeInputValue(parsed, { isRate, allowDecimal })
  }

  const hintValue = focused ? readDraftFromText() : value
  const showHint = shouldShowDigitLimitHint(isRate, truncatedAttempt, hintValue)
  const atBorder = shouldShowDigitLimitBorder(isRate, text, allowDecimal, allowNegative)
  const overflowing = useOverflowEllipsis(inputElRef, true, [text, layoutMode, fitScale])
  const ellipsisActive = !focused && (layoutMode === 'manual' || overflowing)

  function beginHistoryGroup() {
    historyGroupSerialRef.current += 1
    historyGroupRef.current = `number-input-${inputInstanceIdRef.current}-${historyGroupSerialRef.current}`
  }

  function currentChangeMeta(): NumberInputChangeMeta {
    if (!historyGroupRef.current) beginHistoryGroup()
    return { historyGroup: historyGroupRef.current ?? undefined }
  }

  function endHistoryGroup() {
    historyGroupRef.current = null
  }

  function commitFromText(): boolean {
    const normalized = readDraftFromText()
    if (normalized === undefined) {
      setText(formatValue(value))
      return false
    }
    const handler = onCommit ?? onChange
    const shouldCommit =
      deferChangeUntilBlur && onCommit
        ? forceCommit || normalized !== value
        : normalized !== value

    if (shouldCommit) {
      handler(normalized, currentChangeMeta())
    }
    setText(formatValue(normalized))
    setFocused(false)
    setTruncatedAttempt(false)
    endHistoryGroup()
    return shouldCommit
  }

  function clearEntireValue() {
    setText('')
    setTruncatedAttempt(false)
    if (deferChangeUntilBlur) {
      const handler = onCommit ?? onChange
      handler(undefined, currentChangeMeta())
      return
    }
    onChange(undefined, currentChangeMeta())
  }

  useImperativeHandle(ref, () => ({
    commit: commitFromText,
    readDraft: readDraftFromText,
    focus: () => inputElRef.current?.focus(),
  }))

  const inputClass = [
    className ?? '',
    ellipsisActive ? 'numeric-field--ellipsis' : '',
    atBorder ? 'numeric-field__input--at-limit' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={`numeric-field-clip${overflowing ? ' is-overflowing' : ''}`}>
      <div className={`numeric-field${atBorder ? ' numeric-field--at-limit' : ''}`}>
        <input
          ref={inputElRef}
          type="text"
          inputMode={allowDecimal || isRate ? 'decimal' : 'numeric'}
          placeholder={placeholder}
          aria-labelledby={ariaLabelledBy}
          className={inputClass || undefined}
          disabled={disabled}
          value={text}
          title={overflowing && !focused ? text : undefined}
          onMouseDown={(e) => {
            if (guardLocked) {
              e.preventDefault()
              onGuardBlocked?.()
            }
          }}
          onFocus={() => {
            if (guardLocked) {
              onGuardBlocked?.()
              inputElRef.current?.blur()
              return
            }
            setFocused(true)
            beginHistoryGroup()
          }}
          onBlur={() => {
            if (skipBlurCommitRef.current) {
              skipBlurCommitRef.current = false
              setFocused(false)
              setTruncatedAttempt(false)
              endHistoryGroup()
              return
            }
            if (!deferChangeUntilBlur) {
              setFocused(false)
              setTruncatedAttempt(false)
              const parsed = parseFormattedInput(text)
              if (parsed === '') {
                setText(formatValue(value))
                endHistoryGroup()
                return
              }
              const normalized = normalizeInputValue(parsed, { isRate, allowDecimal })
              if (normalized !== value) onChange(normalized, currentChangeMeta())
              setText(formatValue(normalized))
              endHistoryGroup()
              return
            }
            commitFromText()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Delete') {
              if (onDeleteKey) {
                e.preventDefault()
                onDeleteKey()
                return
              }
              if (text !== '' || value !== undefined) {
                e.preventDefault()
                clearEntireValue()
              }
              return
            }
            if (e.key === 'Enter' && onEnterKey) {
              e.preventDefault()
              e.stopPropagation()
              skipBlurCommitRef.current = true
              onEnterKey()
              e.currentTarget.blur()
              return
            }
            if (e.key === 'Enter' && deferChangeUntilBlur) {
              e.preventDefault()
              skipBlurCommitRef.current = true
              commitFromText()
              e.currentTarget.blur()
            }
          }}
          onChange={(e) => {
            const raw = e.target.value
            const formatted = formatRaw(raw)
            setText(formatted)
            if (
              !isRate &&
              wasIntegerDigitTruncated(raw, formatted, allowDecimal, allowNegative)
            ) {
              setTruncatedAttempt(true)
            }

            if (deferChangeUntilBlur) return

            const parsed = parseFormattedInput(formatted)
            if (parsed === '') {
              onChange(undefined, currentChangeMeta())
              return
            }
            onChange(normalizeInputValue(parsed, { isRate, allowDecimal }), currentChangeMeta())
          }}
        />
        {showHint && (
          <span className="field-hint field-hint--limit" role="status" aria-live="polite">
            {t.inputMaxDigitsWarning}
          </span>
        )}
      </div>
    </div>
  )
})
