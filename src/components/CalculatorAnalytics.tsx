import { useEffect, useMemo, useRef } from 'react'
import { calculateEvaluate, calculateOrder } from '../calc/leverage'
import { useCalculator } from '../context/CalculatorContext'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { trackLiqGuardEvent } from '../lib/analytics'
import type { CalculatorInputs } from '../types'

type InputGroup = 'account' | 'position' | 'instrument' | 'margin' | 'scenario' | 'order'

const ACTIVE_TIME_THRESHOLDS = [
  5,
  10,
  15,
  20,
  25,
  30,
  45,
  60,
  90,
  120,
  180,
  300,
] as const

const INPUT_GROUPS: Record<InputGroup, (keyof CalculatorInputs)[]> = {
  account: ['accountEval', 'contracts', 'contractAmount', 'contractAmountRole'],
  position: ['positionSide'],
  instrument: ['currentPrice', 'contractMultiplier', 'tickSize'],
  margin: [
    'marginInputMode',
    'totalMarginKind',
    'maintenanceMarginRate',
    'maintenanceMargin',
    'maintenanceMarginPerContract',
    'entrustedMarginRate',
    'entrustedMargin',
    'entrustedMarginPerContract',
  ],
  scenario: ['scenarioPrice', 'scenarioAppliedPrice'],
  order: ['mode', 'orderContracts', 'orderPrice', 'orderPriceLinked'],
}

function readSessionSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(key) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

function writeSessionSet(key: string, values: Set<string>): void {
  try {
    sessionStorage.setItem(key, JSON.stringify([...values]))
  } catch {
    // Ignore storage failures; analytics should never affect the calculator.
  }
}

function markOnce(key: string): boolean {
  try {
    if (sessionStorage.getItem(key) === '1') return false
    sessionStorage.setItem(key, '1')
  } catch {
    // If storage is blocked, allow the event for this runtime.
  }
  return true
}

function classifyReferrer(referrer: string): string {
  if (!referrer) return 'direct'
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '')
    if (host.includes('google.')) return 'google'
    if (host.includes('bing.')) return 'bing'
    if (host.includes('naver.')) return 'naver'
    if (host.includes('liqguard.com')) return 'internal'
    return 'other'
  } catch {
    return 'other'
  }
}

function inputGroupForKey(key: keyof CalculatorInputs): InputGroup | null {
  return (Object.entries(INPUT_GROUPS) as [InputGroup, (keyof CalculatorInputs)[]][])
    .find(([, keys]) => keys.includes(key))?.[0] ?? null
}

function changedInputGroups(
  previous: CalculatorInputs,
  next: CalculatorInputs,
): InputGroup[] {
  const keys = new Set<keyof CalculatorInputs>([
    ...(Object.keys(previous) as (keyof CalculatorInputs)[]),
    ...(Object.keys(next) as (keyof CalculatorInputs)[]),
  ])
  const groups = new Set<InputGroup>()
  keys.forEach((key) => {
    if (previous[key] === next[key]) return
    const group = inputGroupForKey(key)
    if (group) groups.add(group)
  })
  return [...groups]
}

function filledFieldCount(inputs: CalculatorInputs): number {
  return (Object.values(inputs) as unknown[]).filter((value) => (
    value !== undefined && value !== null && value !== ''
  )).length
}

function hasMeaningfulInput(inputs: CalculatorInputs): boolean {
  return filledFieldCount(inputs) > 2
}

function hasVisibleResult(inputs: CalculatorInputs): boolean {
  if (inputs.mode === 'order') {
    const result = calculateOrder(inputs)
    return result.afterLiquidation != null
      || result.afterTolerance != null
      || result.afterMargins != null
  }

  const result = calculateEvaluate(inputs)
  return result.liquidationPrice != null
    || result.toleranceRate != null
    || result.margins != null
    || result.maxBuyable != null
}

function actionKeyForElement(action: HTMLElement): string {
  const classKey = [...action.classList].slice(0, 3).join('.')
  if (classKey) return classKey
  const href = action instanceof HTMLAnchorElement ? action.getAttribute('href') : null
  if (href?.startsWith('/')) return href.split('?')[0]
  return action.tagName.toLowerCase()
}

export function CalculatorAnalytics() {
  const {
    inputs,
    saveEnabled,
    storageMode,
    syncStatus,
    activeNumberSetId,
  } = useCalculator()
  const pathname = usePathname()
  const { t, preset } = useLanguage()
  const previousInputsRef = useRef(inputs)
  const saveWasEnabledRef = useRef(saveEnabled)
  const previousSyncStatusRef = useRef(syncStatus)
  const activeSecondsRef = useRef(0)
  const emittedActiveThresholdsRef = useRef<Set<number>>(new Set())

  const commonProperties = useMemo(() => ({
    locale: t.htmlLang,
    preset,
    path: pathname || '/',
  }), [pathname, preset, t.htmlLang])

  useEffect(() => {
    if (!markOnce('liqguard-analytics-landing-v1')) return
    const params = new URLSearchParams(window.location.search)
    trackLiqGuardEvent('calculator_landing', {
      ...commonProperties,
      referrer: classifyReferrer(document.referrer),
      has_ad_click_id: params.has('gclid') || params.has('gbraid') || params.has('wbraid'),
      utm_source: params.get('utm_source') ?? null,
      utm_medium: params.get('utm_medium') ?? null,
      utm_campaign: params.get('utm_campaign') ?? null,
    })
  }, [commonProperties])

  useEffect(() => {
    const previous = previousInputsRef.current
    if (previous === inputs) return
    previousInputsRef.current = inputs

    const groups = changedInputGroups(previous, inputs)
    if (groups.length === 0) return

    if (hasMeaningfulInput(inputs) && markOnce('liqguard-analytics-first-input-v1')) {
      trackLiqGuardEvent('first_calculator_input', {
        ...commonProperties,
        mode: inputs.mode,
        field_count: filledFieldCount(inputs),
      })
    }

    const usedGroups = readSessionSet('liqguard-analytics-input-groups-v1')
    let changed = false
    groups.forEach((group) => {
      if (usedGroups.has(group)) return
      usedGroups.add(group)
      changed = true
      trackLiqGuardEvent('calculator_input_group_used', {
        ...commonProperties,
        group,
        mode: inputs.mode,
        field_count: filledFieldCount(inputs),
      })
    })
    if (changed) writeSessionSet('liqguard-analytics-input-groups-v1', usedGroups)
  }, [commonProperties, inputs])

  useEffect(() => {
    if (!hasVisibleResult(inputs)) return
    const key = [
      'liqguard-analytics-result-v1',
      inputs.mode,
      inputs.positionSide,
      inputs.marginInputMode ?? 'rate',
      filledFieldCount(inputs),
    ].join(':')
    if (!markOnce(key)) return
    trackLiqGuardEvent('calculation_result_viewed', {
      ...commonProperties,
      mode: inputs.mode,
      side: inputs.positionSide,
      margin_mode: inputs.marginInputMode ?? 'rate',
      field_count: filledFieldCount(inputs),
    })
  }, [commonProperties, inputs])

  useEffect(() => {
    if (!saveWasEnabledRef.current && saveEnabled) {
      trackLiqGuardEvent('calculator_save_enabled', {
        ...commonProperties,
        storage_mode: storageMode,
        has_active_number_set: Boolean(activeNumberSetId),
      })
    }
    saveWasEnabledRef.current = saveEnabled
  }, [activeNumberSetId, commonProperties, saveEnabled, storageMode])

  useEffect(() => {
    if (previousSyncStatusRef.current !== 'saved' && syncStatus === 'saved') {
      trackLiqGuardEvent('calculator_saved', {
        ...commonProperties,
        storage_mode: storageMode,
        has_active_number_set: Boolean(activeNumberSetId),
      })
    }
    previousSyncStatusRef.current = syncStatus
  }, [activeNumberSetId, commonProperties, storageMode, syncStatus])

  useEffect(() => {
    function isActive() {
      return document.visibilityState === 'visible' && document.hasFocus()
    }

    const interval = window.setInterval(() => {
      if (!isActive()) return
      activeSecondsRef.current += 1
      ACTIVE_TIME_THRESHOLDS.forEach((threshold) => {
        if (
          activeSecondsRef.current < threshold
          || emittedActiveThresholdsRef.current.has(threshold)
        ) return
        emittedActiveThresholdsRef.current.add(threshold)
        trackLiqGuardEvent('calculator_active_time', {
          ...commonProperties,
          seconds: threshold,
          mode: inputs.mode,
          field_count: filledFieldCount(inputs),
        })
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [commonProperties, inputs])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const action = target.closest('button, a')
      if (!(action instanceof HTMLElement)) return
      trackLiqGuardEvent('calculator_action_clicked', {
        ...commonProperties,
        element: action.tagName.toLowerCase(),
        action_key: actionKeyForElement(action),
        mode: inputs.mode,
      })
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [commonProperties, inputs.mode])

  return null
}
