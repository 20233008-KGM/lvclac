import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { NumberInput, type NumberInputHandle } from './NumberInput'
import {
  HOLD_DELAY_MS,
  HOLD_INTERVAL_MS,
  resolvePointerUp,
  shouldEnterScrub,
  type PointerMode,
} from './numberStepperPointer'
import {
  applyScrubMultiplier,
  DEFAULT_FINGER_PX,
  snapToStep,
} from './numberStepperScrub'

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
  /** 입력과 스테퍼 사이에 끼우는 버튼 등 (시나리오 가격 ↵/반영) */
  inlineSlot?: ReactNode
  /** 세로 드래그 배율 스크럽 (시나리오 가격 전용) */
  enableDragScrub?: boolean
  dragScrubFingerPx?: number
  /** value 미설정 시 스크럽 시작 기준가 */
  scrubSeedValue?: number
}

interface PointerSession {
  mode: PointerMode
  startY: number
  lastClientY: number
  delta: number
}

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
    inlineSlot,
    enableDragScrub = false,
    dragScrubFingerPx = DEFAULT_FINGER_PX,
    scrubSeedValue,
  },
  ref,
) {
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pointerSessionRef = useRef<PointerSession | null>(null)
  const [scrubbingDelta, setScrubbingDelta] = useState<number | null>(null)

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

  const isScrubActive = scrubbingDelta !== null

  useEffect(() => {
    if (!isScrubActive) return
    document.body.classList.add('scrub-drag-active')
    return () => document.body.classList.remove('scrub-drag-active')
  }, [isScrubActive])

  const minValue = allowNegative ? undefined : 0

  const effectiveValue = useCallback(
    () => (valueRef.current === undefined ? 0 : valueRef.current),
    [],
  )

  const scrubBaseValue = useCallback(() => {
    if (valueRef.current != null) return valueRef.current
    if (scrubSeedValue != null) return scrubSeedValue
    return 0
  }, [scrubSeedValue])

  const bumpBase = useCallback(() => {
    if (valueRef.current != null) return valueRef.current
    if (enableDragScrub) return scrubBaseValue()
    return effectiveValue()
  }, [enableDragScrub, effectiveValue, scrubBaseValue])

  const bump = useCallback(
    (delta: number) => {
      const next = bumpBase() + delta
      valueRef.current = next
      onChangeRef.current(next)
    },
    [bumpBase],
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

  const resetPointerSession = useCallback(() => {
    pointerSessionRef.current = null
    setScrubbingDelta(null)
  }, [])

  const applyScrubMove = useCallback(
    (clientY: number) => {
      const session = pointerSessionRef.current
      if (!session || session.mode !== 'scrub') return

      const deltaPx = session.lastClientY - clientY
      if (deltaPx === 0) return

      const current = valueRef.current ?? scrubBaseValue()
      const next = applyScrubMultiplier(current, deltaPx, dragScrubFingerPx, minValue ?? 0)
      session.lastClientY = clientY
      valueRef.current = next
      onChangeRef.current(next)
    },
    [dragScrubFingerPx, minValue, scrubBaseValue],
  )

  const enterScrubMode = useCallback(
    (clientY: number) => {
      const session = pointerSessionRef.current
      if (!session || session.mode !== 'pending') return

      stopHold()
      session.mode = 'scrub'
      session.lastClientY = clientY
      setScrubbingDelta(session.delta)

      const seed = scrubBaseValue()
      if (valueRef.current == null) {
        valueRef.current = seed
        onChangeRef.current(seed)
      }
    },
    [scrubBaseValue, stopHold],
  )

  const endPointerSession = useCallback(() => {
    const session = pointerSessionRef.current
    if (!session) return

    stopHold()
    const outcome = resolvePointerUp(session.mode)

    if (outcome === 'tap') {
      bump(session.delta)
    } else if (outcome === 'scrubEnd') {
      const current = valueRef.current ?? scrubBaseValue()
      const snapped = snapToStep(current, step)
      const clamped = minValue != null ? Math.max(minValue, snapped) : snapped
      valueRef.current = clamped
      onChangeRef.current(clamped)
    }

    resetPointerSession()
  }, [bump, minValue, resetPointerSession, scrubBaseValue, step, stopHold])

  const scheduleHoldRepeat = useCallback(
    (delta: number) => {
      stopHold()
      holdTimeoutRef.current = setTimeout(() => {
        const session = pointerSessionRef.current
        if (!session || session.mode !== 'pending') return

        session.mode = 'holdRepeat'
        bump(delta)
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

  function scrubStepButtonProps(delta: number, label: string) {
    const isScrubbing = scrubbingDelta === delta

    return {
      type: 'button' as const,
      className: `number-stepper__btn${isScrubbing ? ' number-stepper__btn--scrubbing' : ''}`,
      'aria-label': label,
      disabled,
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        if (disabled) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)

        pointerSessionRef.current = {
          mode: 'pending',
          startY: e.clientY,
          lastClientY: e.clientY,
          delta,
        }
        scheduleHoldRepeat(delta)
      },
      onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
        const session = pointerSessionRef.current
        if (!session) return

        if (session.mode === 'holdRepeat') return

        if (session.mode === 'scrub') {
          applyScrubMove(e.clientY)
          return
        }

        if (shouldEnterScrub(session.mode, session.startY, e.clientY)) {
          enterScrubMode(e.clientY)
          applyScrubMove(e.clientY)
        }
      },
      onPointerUp: endPointerSession,
      onPointerCancel: endPointerSession,
      onLostPointerCapture: endPointerSession,
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    }
  }

  const buttonProps = enableDragScrub ? scrubStepButtonProps : stepButtonProps

  return (
    <div
      className={`number-stepper${inlineSlot ? ' number-stepper--with-inline-slot' : ''}${enableDragScrub ? ' number-stepper--drag-scrub' : ''}${isScrubActive ? ' number-stepper--scrub-active' : ''}`}
    >
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
      {inlineSlot && <div className="number-stepper__inline-slot">{inlineSlot}</div>}
      <div className="number-stepper__controls">
        <button {...buttonProps(step, stepUpLabel)}>▲</button>
        <button {...buttonProps(-step, stepDownLabel)}>▼</button>
      </div>
    </div>
  )
})
