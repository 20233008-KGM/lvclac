import { forwardRef, useCallback, useEffect, useRef, type MouseEvent, type PointerEvent } from 'react'
import { NumberInput, type NumberInputHandle } from './NumberInput'

interface NumberStepperProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  step?: number
  allowNegative?: boolean
  placeholder?: string
  stepUpLabel: string
  stepDownLabel: string
  ariaLabelledBy?: string
  onEnterKey?: () => void
  onDeleteKey?: () => void
  disabled?: boolean
}

const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 80

export const NumberStepper = forwardRef<NumberInputHandle, NumberStepperProps>(function NumberStepper(
  {
    value,
    onChange,
    step = 1,
    allowNegative = false,
    placeholder,
    stepUpLabel,
    stepDownLabel,
    ariaLabelledBy,
    onEnterKey,
    onDeleteKey,
    disabled = false,
  },
  ref,
) {
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current)
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current)
    }
  }, [])

  const effectiveValue = useCallback(
    () => (valueRef.current === undefined ? 0 : valueRef.current),
    [],
  )

  const bump = useCallback(
    (delta: number) => {
      const next = effectiveValue() + delta
      valueRef.current = next
      onChangeRef.current(next)
    },
    [effectiveValue],
  )

  const stopHold = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
  }, [])

  const startHold = useCallback(
    (delta: number) => {
      stopHold()
      bump(delta)
      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => bump(delta), HOLD_INTERVAL_MS)
      }, HOLD_DELAY_MS)
    },
    [bump, stopHold],
  )

  function stepButtonProps(delta: number, label: string) {
    return {
      type: 'button' as const,
      className: 'number-stepper__btn',
      'aria-label': label,
      disabled,
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        if (disabled) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        startHold(delta)
      },
      onPointerUp: stopHold,
      onPointerCancel: stopHold,
      onLostPointerCapture: stopHold,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    }
  }

  return (
    <div className="number-stepper">
      <div className="number-stepper__input">
        <NumberInput
          ref={ref}
          value={value}
          allowDecimal={false}
          allowNegative={allowNegative}
          isRate={false}
          optional={false}
          placeholder={placeholder}
          aria-labelledby={ariaLabelledBy}
          onEnterKey={onEnterKey}
          onDeleteKey={onDeleteKey}
          disabled={disabled}
          onChange={onChange}
        />
      </div>
      <div className="number-stepper__controls">
        <button {...stepButtonProps(step, stepUpLabel)}>▲</button>
        <button {...stepButtonProps(-step, stepDownLabel)}>▼</button>
      </div>
    </div>
  )
})
