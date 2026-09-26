import { useEffect, useMemo, useRef } from 'react'
import { calculateEvaluate, calculateOrder } from '../calc/leverage'
import { useCalculator } from '../context/CalculatorContext'
import { usePathname } from '../hooks/usePathname'
import { useLanguage } from '../i18n'
import { trackLiqGuardEvent } from '../lib/analytics'
import type { CalculatorInputs } from '../types'

type InputGroup = 'account' | 'position' | 'instrument' | 'margin' | 'scenario' | 'order'

type InteractionKind = 'click' | 'focus' | 'input'

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

const INPUT_FIELD_KEYS: Partial<Record<keyof CalculatorInputs, string>> = {
  accountEval: 'account_equity',
  contracts: 'contracts',
  contractAmount: 'entry_price',
  contractAmountRole: 'entry_price_role',
  currentPrice: 'current_price',
  contractMultiplier: 'contract_multiplier',
  tickSize: 'tick_size',
  maintenanceMarginRate: 'maintenance_margin_rate',
  maintenanceMargin: 'maintenance_margin_total',
  maintenanceMarginPerContract: 'maintenance_margin_per_contract',
  entrustedMarginRate: 'entry_margin_rate',
  entrustedMargin: 'entry_margin_total',
  entrustedMarginPerContract: 'entry_margin_per_contract',
  marginInputMode: 'margin_input_mode',
  totalMarginKind: 'total_margin_kind',
  positionSide: 'position_side',
  mode: 'calculator_mode',
  orderContracts: 'order_contracts',
  orderPrice: 'order_price',
  orderPriceLinked: 'order_price_linked',
  scenarioPrice: 'scenario_price',
  scenarioAppliedPrice: 'scenario_applied_price',
}

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

function changedInputFields(
  previous: CalculatorInputs,
  next: CalculatorInputs,
): string[] {
  const keys = new Set<keyof CalculatorInputs>([
    ...(Object.keys(previous) as (keyof CalculatorInputs)[]),
    ...(Object.keys(next) as (keyof CalculatorInputs)[]),
  ])
  const fields = new Set<string>()
  keys.forEach((key) => {
    if (previous[key] === next[key]) return
    const field = INPUT_FIELD_KEYS[key]
    if (field) fields.add(field)
  })
  return [...fields]
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

function slugPart(value: string | null | undefined): string | null {
  if (!value) return null
  const slug = value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/https?:\/\//g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
  return slug || null
}

function explicitInteractionName(element: Element, kind: InteractionKind): string | null {
  const attr = kind === 'click'
    ? 'data-analytics-click'
    : kind === 'focus'
      ? 'data-analytics-focus'
      : 'data-analytics-input'
  const value = element.closest<HTMLElement>(`[${attr}]`)?.getAttribute(attr)
  return slugPart(value)
}

function explicitInteractionKey(element: Element): string | null {
  return slugPart(element.closest<HTMLElement>('[data-analytics-key]')?.dataset.analyticsKey)
}

function classKeyForElement(element: HTMLElement): string | null {
  const classes = [...element.classList]
    .filter((name) => !/^(active|disabled|selected|open|closed|loading)$/.test(name))
    .slice(0, 3)
    .map((name) => slugPart(name))
    .filter(Boolean)
  return classes.length > 0 ? classes.join('_') : null
}

function keyForInteractiveElement(element: HTMLElement): string {
  const explicitKey = explicitInteractionKey(element)
  if (explicitKey) return explicitKey

  const ariaLabel = slugPart(element.getAttribute('aria-label'))
  if (ariaLabel) return ariaLabel

  const title = slugPart(element.getAttribute('title'))
  if (title) return title

  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  if (ariaLabelledBy) {
    const label = ariaLabelledBy
      .split(/\s+/)
      .map((id) => slugPart(document.getElementById(id)?.id))
      .find(Boolean)
    if (label) return label
  }

  if (element instanceof HTMLAnchorElement) {
    const href = element.getAttribute('href')
    if (href?.startsWith('/')) return slugPart(href.split('?')[0]) ?? 'link'
  }

  const id = slugPart(element.id)
  if (id) return id

  const classKey = classKeyForElement(element)
  if (classKey) return classKey

  const field = element.closest<HTMLElement>('.field, .result-order-field, [data-analytics-key]')
  if (field && field !== element) {
    const fieldKey = explicitInteractionKey(field) ?? classKeyForElement(field)
    if (fieldKey) return fieldKey
  }

  const role = slugPart(element.getAttribute('role'))
  if (role) return `${element.tagName.toLowerCase()}_${role}`
  return element.tagName.toLowerCase()
}

function interactionEventName(kind: InteractionKind, element: HTMLElement): string {
  const explicit = explicitInteractionName(element, kind)
  if (explicit) return explicit
  return `${kind}_${keyForInteractiveElement(element)}`.slice(0, 96)
}

function actionKeyForElement(action: HTMLElement): string {
  return keyForInteractiveElement(action)
}

function shouldThrottleInteraction(key: string, intervalMs: number): boolean {
  const now = Date.now()
  const storageKey = `liqguard-analytics-throttle:${key}`
  try {
    const previous = Number(sessionStorage.getItem(storageKey) ?? 0)
    if (now - previous < intervalMs) return true
    sessionStorage.setItem(storageKey, String(now))
  } catch {
    // If storage is blocked, allow the event for this runtime.
  }
  return false
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

    changedInputFields(previous, inputs).forEach((field) => {
      const eventName = `input_${field}`
      if (shouldThrottleInteraction(eventName, 2000)) return
      trackLiqGuardEvent(eventName, {
        ...commonProperties,
        field,
        mode: inputs.mode,
        field_count: filledFieldCount(inputs),
      })
    })
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
    const clickableSelector = [
      '[data-analytics-click]',
      'button',
      'a',
      '[role="button"]',
      '[role="menuitem"]',
      '[role="tab"]',
      'summary',
    ].join(',')
    const inputSelector = 'input, select, textarea, [contenteditable="true"], [data-analytics-input]'

    function trackInteraction(kind: InteractionKind, element: HTMLElement) {
      const eventName = interactionEventName(kind, element)
      if (shouldThrottleInteraction(`${kind}:${eventName}`, kind === 'input' ? 2000 : 500)) return
      trackLiqGuardEvent(eventName, {
        ...commonProperties,
        element: element.tagName.toLowerCase(),
        interaction_key: actionKeyForElement(element),
        mode: inputs.mode,
      })
    }

    function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const action = target.closest(clickableSelector)
      if (!(action instanceof HTMLElement)) return

      trackInteraction('click', action)
      trackLiqGuardEvent('calculator_action_clicked', {
        ...commonProperties,
        element: action.tagName.toLowerCase(),
        action_key: actionKeyForElement(action),
        mode: inputs.mode,
      })
    }

    function handleFocusIn(event: FocusEvent) {
      const target = event.target
      if (!(target instanceof Element)) return
      const input = target.closest(inputSelector)
      if (!(input instanceof HTMLElement)) return
      trackInteraction('focus', input)
    }

    function handleInput(event: Event) {
      const target = event.target
      if (!(target instanceof Element)) return
      const input = target.closest(inputSelector)
      if (!(input instanceof HTMLElement)) return
      if (input.closest('.input-panel, .result-panel')) return
      trackInteraction('input', input)
    }

    document.addEventListener('click', handleClick, { capture: true })
    document.addEventListener('focusin', handleFocusIn, { capture: true })
    document.addEventListener('input', handleInput, { capture: true })
    document.addEventListener('change', handleInput, { capture: true })
    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
      document.removeEventListener('focusin', handleFocusIn, { capture: true })
      document.removeEventListener('input', handleInput, { capture: true })
      document.removeEventListener('change', handleInput, { capture: true })
    }
  }, [commonProperties, inputs.mode])

  return null
}
